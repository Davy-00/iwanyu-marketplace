import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import StorefrontPage from "@/components/StorefrontPage";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart";
import { formatMoney } from "@/lib/money";

export default function CartPage() {
  const navigate = useNavigate();
  const { items, itemCount, subtotal, removeItem, setQuantity, clear } = useCart();

  return (
    <StorefrontPage>
      <div className="container min-h-screen py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-iwanyu-foreground mb-4">Your Shopping Cart</h1>
          <div className="flex items-center justify-between">
            <p className="text-lg text-gray-600">{itemCount} item{itemCount === 1 ? "" : "s"} in your cart</p>
            <Link to="/" className="text-sm font-medium text-iwanyu-primary hover:underline px-4 py-2 rounded-full bg-iwanyu-primary/10 transition-colors">
              ← Continue Shopping
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Cart items will render here */}
          </div>
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
            <div className="lg:col-span-2 rounded-lg border border-iwanyu-border bg-white">
              <div className="divide-y">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-4 p-4">
                    <div className="h-20 w-20 shrink-0 rounded-md bg-iwanyu-muted p-2">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="h-full w-full object-contain" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">No image</div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-medium text-iwanyu-foreground">{item.title}</div>
                          <div className="mt-1 text-sm text-gray-600">{formatMoney(item.price)}</div>
                        </div>

                        <button
                          className="rounded-md p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                          onClick={() => removeItem(item.productId)}
                          aria-label="Remove"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center gap-3">
                        <div className="inline-flex items-center rounded-full border border-gray-200 bg-white">
                          <button
                            className="px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-l-full"
                            onClick={() => setQuantity(item.productId, Math.max(1, item.quantity - 1))}
                            aria-label="Decrease"
                          >
                            <Minus size={16} />
                          </button>
                          <div className="min-w-10 text-center text-sm font-semibold text-gray-900">{item.quantity}</div>
                          <button
                            className="px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-r-full"
                            onClick={() => setQuantity(item.productId, item.quantity + 1)}
                            aria-label="Increase"
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        <div className="text-sm text-gray-600">
                          Line total: <span className="font-semibold text-gray-900">{formatMoney(item.price * item.quantity)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between gap-3 p-4">
                <Button variant="outline" className="rounded-full" onClick={clear}>
                  Clear cart
                </Button>
                <Button
                  className="rounded-full bg-iwanyu-primary text-white hover:bg-iwanyu-primary/90"
                  onClick={() => navigate("/checkout")}
                >
                  Checkout
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-iwanyu-border bg-white p-5 h-fit">
              <h2 className="text-lg font-bold text-iwanyu-foreground">Order summary</h2>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold text-gray-900">{formatMoney(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-semibold text-gray-900">Calculated</span>
                </div>
                <div className="border-t pt-3 flex items-center justify-between">
                  <span className="text-gray-700 font-semibold">Total</span>
                  <span className="text-gray-900 font-bold">{formatMoney(subtotal)}</span>
                </div>
              </div>
              <Button
                className="mt-5 w-full rounded-full bg-iwanyu-primary text-white hover:bg-iwanyu-primary/90"
                onClick={() => navigate("/checkout")}
              >
                Proceed to checkout
              </Button>
            </div>
          </div>
        )}
      </div>
    </StorefrontPage>
  );
}
