import StorefrontPage from "@/components/StorefrontPage";
import { formatMoney } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useEffect, useMemo, useState } from "react";

type DbOrder = {
  id: string;
  created_at: string;
  status: string;
  total_rwf: number;
};

type ViewOrder = {
  id: string;
  status: string;
  createdAt: string;
  total: number;
};

export default function OrdersPage() {
  const { user } = useAuth();
  const supabase = getSupabaseClient();
  const [dbOrders, setDbOrders] = useState<DbOrder[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!supabase || !user) {
        setDbOrders(null);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("id, created_at, status, total_rwf")
          .eq("buyer_user_id", user.id)
          .order("created_at", { ascending: false });

        if (cancelled) return;
        if (error) throw error;

        setDbOrders((data ?? []) as DbOrder[]);
      } catch {
        if (!cancelled) setDbOrders([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [supabase, user]);

  const viewOrders: ViewOrder[] = useMemo(
    () =>
      (dbOrders ?? []).map((o) => ({
        id: o.id,
        status: o.status,
        createdAt: o.created_at,
        total: Number(o.total_rwf ?? 0),
      })),
    [dbOrders]
  );

  return (
    <StorefrontPage>
      <div className="container min-h-screen py-12">
        <h1 className="text-3xl font-bold text-iwanyu-foreground">Your Orders</h1>
        <p className="mt-1 text-gray-600">Order history.</p>

        {!user ? (
          <div className="mt-6 rounded-lg border border-iwanyu-border bg-white p-6 text-sm text-gray-700">
            <div className="font-semibold text-gray-900">Sign in to see your orders</div>
            <div className="mt-1 text-gray-600">Orders are tied to your account.</div>
            <Link to="/login" className="mt-3 inline-block text-sm font-semibold text-iwanyu-primary hover:underline">
              Go to login
            </Link>
          </div>
        ) : null}

        {!supabase ? (
          <div className="mt-6 rounded-lg border border-iwanyu-border bg-white p-6 text-sm text-gray-700">
            <div className="font-semibold text-gray-900">Orders are not available</div>
            <div className="mt-1 text-gray-600">Supabase environment variables are missing.</div>
          </div>
        ) : null}

        <div className="mt-6 grid gap-4">
          {loading ? (
            <div className="rounded-lg border border-iwanyu-border bg-white p-6 text-sm text-gray-600">Loading…</div>
          ) : null}
          {viewOrders.map((o) => (
            <Card key={o.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{o.id}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                <div className="flex flex-wrap gap-x-6 gap-y-1">
                  <div>
                    <span className="text-gray-500">Status:</span> <span className="font-medium text-gray-900">{o.status}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Date:</span>{" "}
                    <span className="font-medium text-gray-900">{new Date(o.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Total:</span>{" "}
                    <span className="font-medium text-gray-900">{formatMoney(o.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {user && supabase && !loading && viewOrders.length === 0 ? (
            <div className="rounded-lg border border-iwanyu-border bg-white p-6 text-sm text-gray-600">
              No orders yet.
            </div>
          ) : null}
        </div>
      </div>
    </StorefrontPage>
  );
}
