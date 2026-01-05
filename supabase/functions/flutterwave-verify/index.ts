// Supabase Edge Function: verify a Flutterwave transaction and mark an order as paid.
// Secrets required (server-side): FLUTTERWAVE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    status: init?.status ?? 200,
  });
}

async function requireSupabaseUser(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  if (!token) return { ok: false as const, error: "Missing Authorization bearer token" };

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  if (!supabaseUrl || !anonKey) return { ok: false as const, error: "Supabase env not configured" };

  const res = await fetch(`${supabaseUrl.replace(/\/+$/, "")}/auth/v1/user`, {
    headers: { authorization: `Bearer ${token}`, apikey: anonKey },
  });

  if (!res.ok) return { ok: false as const, error: "Invalid or expired token" };
  const user = (await res.json().catch(() => null)) as { id?: string } | null;
  if (!user?.id) return { ok: false as const, error: "Invalid user" };
  return { ok: true as const, userId: user.id };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
        "access-control-allow-methods": "POST, OPTIONS",
      },
    });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405, headers: { "access-control-allow-origin": "*" } });
  }

  const authz = await requireSupabaseUser(req);
  if (!authz.ok) {
    return json({ error: authz.error }, { status: 401, headers: { "access-control-allow-origin": "*" } });
  }

  const flutterwaveSecret = Deno.env.get("FLUTTERWAVE_SECRET_KEY") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!flutterwaveSecret || !supabaseUrl || !serviceRoleKey) {
    return json(
      { error: "Missing server configuration" },
      { status: 500, headers: { "access-control-allow-origin": "*" } },
    );
  }

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const orderId = typeof body.orderId === "string" ? body.orderId : "";
  const transactionId = typeof body.transactionId === "number" ? body.transactionId : NaN;
  const expectedAmount = typeof body.expectedAmount === "number" ? body.expectedAmount : NaN;

  if (!orderId || !Number.isFinite(transactionId) || transactionId <= 0) {
    return json(
      { error: "Invalid input" },
      { status: 400, headers: { "access-control-allow-origin": "*" } },
    );
  }

  const verifyRes = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
    headers: { Authorization: `Bearer ${flutterwaveSecret}` },
  });

  if (!verifyRes.ok) {
    const text = await verifyRes.text().catch(() => "");
    return json(
      { error: `Flutterwave verify failed (${verifyRes.status})`, details: text },
      { status: 502, headers: { "access-control-allow-origin": "*" } },
    );
  }

  const payload = (await verifyRes.json().catch(() => null)) as any;
  const data = payload?.data;

  const status = data?.status;
  const txRef = data?.tx_ref;
  const currency = data?.currency;
  const amount = Number(data?.amount ?? NaN);

  if (status !== "successful") {
    return json(
      { error: "Payment not successful", status },
      { status: 402, headers: { "access-control-allow-origin": "*" } },
    );
  }

  if (txRef !== orderId) {
    return json(
      { error: "Transaction reference mismatch" },
      { status: 400, headers: { "access-control-allow-origin": "*" } },
    );
  }

  if (currency !== "RWF") {
    return json(
      { error: "Currency mismatch" },
      { status: 400, headers: { "access-control-allow-origin": "*" } },
    );
  }

  if (Number.isFinite(expectedAmount) && Number.isFinite(amount) && Math.round(amount) !== Math.round(expectedAmount)) {
    return json(
      { error: "Amount mismatch" },
      { status: 400, headers: { "access-control-allow-origin": "*" } },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Ensure the order belongs to the authenticated user.
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("id,buyer_user_id")
    .eq("id", orderId)
    .maybeSingle();

  if (orderErr) {
    return json(
      { error: "Failed to load order" },
      { status: 500, headers: { "access-control-allow-origin": "*" } },
    );
  }

  if (!order || order.buyer_user_id !== authz.userId) {
    return json(
      { error: "Order not found" },
      { status: 404, headers: { "access-control-allow-origin": "*" } },
    );
  }

  const paymentId = `pay_${crypto.randomUUID()}`;

  // Record payment.
  const { error: payErr } = await supabase.from("payments").insert({
    id: paymentId,
    order_id: orderId,
    provider: "flutterwave",
    status: "successful",
    amount_rwf: Math.round(amount),
    currency: "RWF",
    tx_ref: orderId,
    flw_transaction_id: transactionId,
    raw: payload,
  });

  if (payErr) {
    return json(
      { error: "Failed to record payment" },
      { status: 500, headers: { "access-control-allow-origin": "*" } },
    );
  }

  // Mark order + items as processing.
  const { error: updOrderErr } = await supabase
    .from("orders")
    .update({ status: "Processing", updated_at: new Date().toISOString() })
    .eq("id", orderId);

  if (updOrderErr) {
    return json(
      { error: "Failed to update order" },
      { status: 500, headers: { "access-control-allow-origin": "*" } },
    );
  }

  await supabase
    .from("order_items")
    .update({ status: "Processing", updated_at: new Date().toISOString() })
    .eq("order_id", orderId);

  return json(
    { ok: true, orderId, paymentId },
    { headers: { "access-control-allow-origin": "*" } },
  );
});
