import { BarChart3, Package, ShoppingBag, Store, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/money";
import { useAuth } from "@/context/auth";
import { useMarketplace } from "@/context/marketplace";
import { getSupabaseClient } from "@/lib/supabaseClient";

type VendorNotification = {
  id: string;
  title: string;
  message: string;
  created_at: string;
  vendor_id: string;
  read_at: string | null;
};

const nav = [
  { label: "Overview", icon: BarChart3, href: "/seller" },
  { label: "Products", icon: Package, href: "/seller/products" },
  { label: "Orders", icon: ShoppingBag, href: "/seller/orders" },
  { label: "Payouts", icon: Wallet, href: "/seller" },
  { label: "Store", icon: Store, href: "/seller" },
];

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const { getVendorsForOwner } = useMarketplace();
  const supabase = getSupabaseClient();
  const [notifications, setNotifications] = useState<VendorNotification[]>([]);

  const ownedVendorIds = useMemo(() => {
    if (!user || user.role === "admin") return [];
    return getVendorsForOwner(user.id).map((v) => v.id);
  }, [user, getVendorsForOwner]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!supabase || !user) return;
      if (user.role === "admin") {
        setNotifications([]);
        return;
      }
      if (ownedVendorIds.length === 0) {
        setNotifications([]);
        return;
      }

      const { data, error } = await supabase
        .from("vendor_notifications")
        .select("id, title, message, created_at, vendor_id, read_at")
        .in("vendor_id", ownedVendorIds)
        .order("created_at", { ascending: false })
        .limit(5);

      if (cancelled) return;
      if (error) {
        setNotifications([]);
        return;
      }

      setNotifications((data ?? []) as VendorNotification[]);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [supabase, user, ownedVendorIds]);

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 bg-white">
        <div className="container py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-iwanyu-foreground">Seller Dashboard</h1>
            <p className="text-sm text-gray-600">Multi-vendor tools (starter).</p>
          </div>
          <div className="flex gap-2">
            <Link to="/">
              <Button variant="outline" className="rounded-full">Storefront</Button>
            </Link>
            <Link to="/sell">
              <Button className="rounded-full bg-iwanyu-primary text-white hover:bg-iwanyu-primary/90">Onboarding</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container py-6 grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-lg border border-gray-200 bg-white p-3 h-fit">
          <nav className="space-y-1">
            {nav.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <item.icon size={18} className="text-gray-500" />
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        <section className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{formatMoney(0)}</div>
                <div className="text-xs text-gray-600">Metrics</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">0</div>
                <div className="text-xs text-gray-600">Metrics</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">0</div>
                <div className="text-xs text-gray-600">Metrics</div>
              </CardContent>
            </Card>
          </div>

          {user?.role !== "admin" ? (
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-700">
                {notifications.length === 0 ? (
                  <div className="text-gray-600">No notifications.</div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((n) => (
                      <div key={n.id} className="rounded-lg border border-iwanyu-border bg-white p-3">
                        <div className="font-semibold text-gray-900">{n.title}</div>
                        <div className="mt-1 text-gray-600">{n.message}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>What a modern marketplace seller must have</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-700 space-y-2">
              <div>• Product management (variants, inventory, media)</div>
              <div>• Order management (fulfillment, refunds, returns)</div>
              <div>• Payouts + statements</div>
              <div>• Store profile + policies</div>
              <div>• Messaging & support tickets</div>
              <div>• Events/audit log (who changed what, when)</div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
