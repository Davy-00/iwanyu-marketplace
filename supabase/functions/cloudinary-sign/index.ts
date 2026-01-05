// Supabase Edge Function: returns Cloudinary signed upload params.
// Secrets required (server-side): CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createHash } from "https://deno.land/std@0.224.0/crypto/mod.ts";

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    status: init?.status ?? 200,
  });
}

function sha1Hex(input: string): string {
  const hash = createHash("sha1");
  hash.update(input);
  return hash.toString();
}

function cloudinarySignature(params: Record<string, string | number>, apiSecret: string) {
  const base = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return sha1Hex(base + apiSecret);
}

async function requireSupabaseUser(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";

  if (!token) {
    return { ok: false as const, error: "Missing Authorization bearer token" };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("SUPABASE_PROJECT_URL") || "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";

  // If env is not available (misconfigured), fail closed.
  if (!supabaseUrl || !anonKey) {
    return { ok: false as const, error: "Supabase env not configured for auth validation" };
  }

  const res = await fetch(`${supabaseUrl.replace(/\/+$/, "")}/auth/v1/user`, {
    headers: {
      authorization: `Bearer ${token}`,
      apikey: anonKey,
    },
  });

  if (!res.ok) {
    return { ok: false as const, error: "Invalid or expired token" };
  }

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

  const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME") ?? "";
  const apiKey = Deno.env.get("CLOUDINARY_API_KEY") ?? "";
  const apiSecret = Deno.env.get("CLOUDINARY_API_SECRET") ?? "";

  if (!cloudName || !apiKey || !apiSecret) {
    return json(
      { error: "Missing Cloudinary server env vars" },
      { status: 500, headers: { "access-control-allow-origin": "*" } },
    );
  }

  const authz = await requireSupabaseUser(req);
  if (!authz.ok) {
    return json(
      { error: authz.error },
      { status: 401, headers: { "access-control-allow-origin": "*" } },
    );
  }

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const folderRaw = typeof body.folder === "string" && body.folder.trim() ? body.folder.trim() : "iwanyu";
  const folder = `${folderRaw.replace(/\/+$/, "")}/${authz.userId}`;

  // Cloudinary signature base: params sorted & concatenated, then SHA1 with API secret.
  // Keep it minimal: folder + timestamp.
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = cloudinarySignature({ folder, timestamp }, apiSecret);

  return json(
    {
      cloudName,
      apiKey,
      timestamp,
      folder,
      signature,
    },
    {
      headers: {
        "access-control-allow-origin": "*",
      },
    },
  );
});
