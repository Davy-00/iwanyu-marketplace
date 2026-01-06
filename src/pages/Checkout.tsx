import { useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import StorefrontPage from "@/components/StorefrontPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/context/cart";
import { formatMoney } from "@/lib/money";
import { useAuth } from "@/context/auth";
import { useMarketplace } from "@/context/marketplace";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { createId } from "@/lib/ids";
import { openFlutterwaveInline } from "@/lib/flutterwave";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const { products } = useMarketplace();
  const supabase = getSupabaseClient();
  const flutterwavePublicKey = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY;
  const [isPlacing, setIsPlacing] = useState(false);
  const [email, setEmail] = useState(user?.email ?? "");
  const [address, setAddress] = useState("");

  const [paymentType, setPaymentType] = useState<"card" | "momo">("momo");
  const [momoNetwork, setMomoNetwork] = useState<"MTN" | "Airtel">("MTN");
  const [momoPhone, setMomoPhone] = useState("");
  const [cardNumber, setCardNumber] = useState("");

  const canPay = useMemo(() => {
    if (paymentType === "momo") return momoPhone.trim().length >= 8;
    return true;
  }, [paymentType, momoPhone]);

  const canPlaceOrder = useMemo(
    () => items.length > 0 && email.trim().length > 3 && address.trim().length > 5 && canPay,
    [items.length, email, address, canPay]
  );

  return (
    <StorefrontPage>
      <div className="container min-h-screen py-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-iwanyu-foreground">Checkout</h1>
          <Link to="/cart" className="text-sm font-medium text-iwanyu-primary hover:underline">
            Back to cart
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="mt-8 rounded-lg border border-iwanyu-border bg-white p-6">
            <p className="text-gray-600">Your cart is empty.</p>
            <Link to="/">
              <Button className="mt-4 rounded-full bg-iwanyu-primary text-white hover:bg-iwanyu-primary/90">
                Shop products
              </Button>
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-lg border border-iwanyu-border bg-white p-6">
              <h2 className="text-lg font-bold text-iwanyu-foreground">Contact</h2>
              <div className="mt-3">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1" />
              </div>

              <h2 className="mt-6 text-lg font-bold text-iwanyu-foreground">Shipping</h2>
              <div className="mt-3">
                <label className="text-sm font-medium text-gray-700">Address</label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, City, State" className="mt-1" />
              </div>

              <h2 className="mt-6 text-lg font-bold text-iwanyu-foreground">Payment</h2>
              <div className="mt-3 rounded-lg border border-gray-200 p-4">
                <RadioGroup value={paymentType} onValueChange={(v) => setPaymentType(v as "card" | "momo")} className="grid gap-3">
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="momo" id="pay-momo" />
                    <Label htmlFor="pay-momo" className="font-medium text-gray-900">Mobile Money (MTN / Airtel)</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="card" id="pay-card" />
                    <Label htmlFor="pay-card" className="font-medium text-gray-900">Card (Visa / Mastercard)</Label>
                  </div>
                </RadioGroup>

                {paymentType === "momo" ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Network</label>
                      <div className="mt-1 flex gap-2">
                        <Button
                          type="button"
                          variant={momoNetwork === "MTN" ? "default" : "outline"}
                          className="rounded-full"
                          onClick={() => setMomoNetwork("MTN")}
                        >
                          MTN
                        </Button>
                        <Button
                          type="button"
                          variant={momoNetwork === "Airtel" ? "default" : "outline"}
                          className="rounded-full"
                          onClick={() => setMomoNetwork("Airtel")}
                        >
                          Airtel
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Phone</label>
                      <Input
                        value={momoPhone}
                        onChange={(e) => setMomoPhone(e.target.value)}
                        placeholder="07xxxxxxxx"
                        className="mt-1"
                        inputMode="tel"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-700">Card number</label>
                    <Input
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="1234 5678 9012 3456"
                      className="mt-1"
                      inputMode="numeric"
                    />
                    <p className="mt-2 text-xs text-gray-500">You will complete payment in a secure Flutterwave window.</p>
                  </div>
                )}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button variant="outline" className="rounded-full" onClick={() => navigate("/cart")}
                >
                  Back
                </Button>
                <Button
                  className="rounded-full bg-iwanyu-primary text-white hover:bg-iwanyu-primary/90"
                  disabled={!canPlaceOrder || isPlacing}
                  onClick={async () => {
                    if (isPlacing) return;
                    setIsPlacing(true);
                    try {
                      const trimmedEmail = email.trim();
                      const trimmedAddress = address.trim();
                      const orderItems = items.map((i) => {
                        const p = products.find((x) => x.id === i.productId);
                        return {
                          ...i,
                          vendorId: p?.vendorId,
                        };
                      });

                      if (!supabase || !flutterwavePublicKey) {
                        throw new Error("Checkout is not configured. Missing Supabase/Flutterwave environment variables.");
                      }

                      if (!user) {
                        navigate("/login", { state: { from: location }, replace: false });
                        return;
                      }

                      const orderId = createId("ord");
                      const totalRwf = Math.round(subtotal);

                      const paymentMeta = {
                        provider: "flutterwave",
                        mode: "inline",
                        selected: paymentType,
                        momoNetwork: paymentType === "momo" ? momoNetwork : undefined,
                        momoPhone: paymentType === "momo" ? momoPhone.trim() : undefined,
                      };

                      const { error: ordErr } = await supabase.from("orders").insert({
                        id: orderId,
                        buyer_user_id: user.id,
                        buyer_email: trimmedEmail,
                        shipping_address: trimmedAddress,
                        status: "Placed",
                        total_rwf: totalRwf,
                        payment: paymentMeta,
                      });

                      if (ordErr) throw new Error(ordErr.message);

                      const missingVendor = orderItems.find((i) => !i.vendorId);
                      if (missingVendor) {
                        throw new Error(`Missing vendor for product ${missingVendor.productId}`);
                      }

                      const rows = orderItems.map((i) => ({
                        order_id: orderId,
                        product_id: i.productId,
                        vendor_id: i.vendorId!,
                        title: i.title,
                        price_rwf: Math.round(i.price),
                        quantity: i.quantity,
                        image_url: i.image,
                        status: "Placed",
                      }));

                      const { error: itemsErr } = await supabase.from("order_items").insert(rows);
                      if (itemsErr) throw new Error(itemsErr.message);

                      const session = (await supabase.auth.getSession()).data.session;
                      const accessToken = session?.access_token;
                      if (!accessToken) throw new Error("Missing auth session");

                      const customerName = user.name ?? user.email ?? trimmedEmail;

                      const result = await openFlutterwaveInline({
                        publicKey: flutterwavePublicKey,
                        txRef: orderId,
                        amount: totalRwf,
                        currency: "RWF",
                        paymentOptions: paymentType === "momo" ? "mobilemoney" : "card",
                        customer: {
                          email: trimmedEmail,
                          name: customerName,
                          phone_number: momoPhone.trim() || undefined,
                        },
                        customizations: {
                          title: "iwanyu",
                          description: `Order ${orderId}`,
                        },
                      });

                      if (!result) {
                        toast({ title: "Payment cancelled", description: "Your order was created but not paid." });
                        navigate("/orders");
                        return;
                      }

                      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
                      if (!supabaseUrl || !supabaseAnonKey) throw new Error("Supabase env missing");

                      const verifyRes = await fetch(`${supabaseUrl.replace(/\/+$/, "")}/functions/v1/flutterwave-verify`, {
                        method: "POST",
                        headers: {
                          "content-type": "application/json",
                          apikey: supabaseAnonKey,
                          authorization: `Bearer ${accessToken}`,
                        },
                        body: JSON.stringify({ orderId, transactionId: result.transactionId, expectedAmount: totalRwf }),
                      });

                      if (!verifyRes.ok) {
                        const text = await verifyRes.text().catch(() => "");
                        throw new Error(`Payment verification failed: ${text}`);
                      }

                      clear();
                      toast({ title: "Payment successful", description: `Order ${orderId} is now processing.` });
                      navigate("/orders");
                    } catch (e) {
                      toast({
                        title: "Checkout failed",
                        description: e instanceof Error ? e.message : "Unknown error",
                        variant: "destructive",
                      });
                    } finally {
                      setIsPlacing(false);
                    }
                  }}
                >
                  Place order
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-iwanyu-border bg-white p-5 h-fit">
              <h2 className="text-lg font-bold text-iwanyu-foreground">Summary</h2>
              <div className="mt-4 space-y-3 text-sm">
                {items.map((i) => (
                  <div key={i.productId} className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-gray-900">{i.title}</div>
                      <div className="text-gray-600">Qty {i.quantity}</div>
                    </div>
                    <div className="font-semibold text-gray-900">{formatMoney(i.price * i.quantity)}</div>
                  </div>
                ))}
                <div className="border-t pt-3 flex items-center justify-between">
                  <span className="text-gray-700 font-semibold">Total</span>
                  <span className="text-gray-900 font-bold">{formatMoney(subtotal)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </StorefrontPage>
  );
}
