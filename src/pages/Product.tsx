import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import StorefrontPage from "@/components/StorefrontPage";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/context/cart";
import { useMarketplace } from "@/context/marketplace";
import { formatMoney } from "@/lib/money";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { getOptimizedCloudinaryUrl } from "@/lib/cloudinary";

type ProductMedia = {
  id: string;
  kind: "image" | "video";
  url: string;
};

export default function ProductPage() {
  const { productId } = useParams();
  const { toast } = useToast();
  const { addItem } = useCart();
  const { products, getVendorById } = useMarketplace();
  const supabase = getSupabaseClient();

  const [media, setMedia] = useState<ProductMedia[]>([]);

  const product = useMemo(() => products.find((p) => p.id === productId), [products, productId]);

  const vendor = product?.vendorId ? getVendorById(product.vendorId) : undefined;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!supabase || !productId) return;
      const { data, error } = await supabase
        .from("product_media")
        .select("id, kind, url")
        .eq("product_id", productId)
        .order("position", { ascending: true });

      if (cancelled) return;
      if (error) {
        setMedia([]);
        return;
      }
      setMedia((data ?? []) as ProductMedia[]);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [supabase, productId]);

  if (!product) {
    return (
      <StorefrontPage>
        <div className="container py-10">
          <h1 className="text-2xl font-bold text-iwanyu-foreground">Product not found</h1>
          <Link to="/" className="mt-2 inline-block text-sm font-medium text-iwanyu-primary hover:underline">
            Back to home
          </Link>
        </div>
      </StorefrontPage>
    );
  }

  return (
    <StorefrontPage>
      <div className="container py-8">
        <div className="text-sm text-gray-500">
          <Link to="/" className="hover:underline">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link
            to={`/category/${product.category.toLowerCase().replace(/\s+/g, "-")}`}
            className="hover:underline"
          >
            {product.category}
          </Link>
        </div>

        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <div className="rounded-lg border border-iwanyu-border bg-iwanyu-muted p-6">
            {(() => {
              const firstImage = media.find((m) => m.kind === "image")?.url ?? product.image;
              const firstVideo = media.find((m) => m.kind === "video")?.url ?? "";

              if (firstImage) {
                return (
                  <img
                    src={getOptimizedCloudinaryUrl(firstImage, { kind: "image", width: 900 })}
                    alt={product.title}
                    className="mx-auto h-72 w-72 object-contain"
                    loading="lazy"
                  />
                );
              }

              if (firstVideo) {
                return (
                  <video
                    className="mx-auto h-72 w-72"
                    controls
                    preload="metadata"
                    src={getOptimizedCloudinaryUrl(firstVideo, { kind: "video", width: 900 })}
                  />
                );
              }

              return <div className="mx-auto flex h-72 w-72 items-center justify-center text-sm text-gray-500">No media</div>;
            })()}

            {media.length > 1 ? (
              <div className="mt-4 grid grid-cols-4 gap-2">
                {media.slice(0, 8).map((m) => (
                  <div key={m.id} className="rounded-md border border-iwanyu-border bg-white p-1">
                    {m.kind === "image" ? (
                      <img
                        src={getOptimizedCloudinaryUrl(m.url, { kind: "image", width: 200 })}
                        alt=""
                        className="h-12 w-full object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-12 items-center justify-center text-[10px] text-gray-600">Video</div>
                    )}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <h1 className="text-3xl font-bold text-iwanyu-foreground">{product.title}</h1>
            <p className="mt-2 text-gray-600">{product.description}</p>

            <div className="mt-5 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-iwanyu-foreground">{formatMoney(product.price)}</span>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                className="rounded-full bg-iwanyu-primary text-white hover:bg-iwanyu-primary/90"
                disabled={!product.inStock}
                onClick={() => {
                  addItem({ productId: product.id, title: product.title, price: product.price, image: product.image });
                  toast({ title: "Added to cart", description: `${product.title} has been added to your cart.` });
                }}
              >
                <ShoppingCart size={16} className="mr-2" />
                {product.inStock ? "Add to cart" : "Out of stock"}
              </Button>
              <Link to="/cart">
                <Button variant="outline" className="rounded-full">
                  View cart
                </Button>
              </Link>
            </div>

            <div className="mt-8 rounded-lg border border-iwanyu-border bg-white p-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Vendor</div>
                  <div className="font-medium text-iwanyu-foreground">{vendor?.name ?? "—"}</div>
                </div>
                <div>
                  <div className="text-gray-500">Category</div>
                  <div className="font-medium text-iwanyu-foreground">{product.category}</div>
                </div>
                <div>
                  <div className="text-gray-500">Shipping</div>
                  <div className="font-medium text-iwanyu-foreground">
                    {product.freeShipping ? "Free shipping" : "Calculated at checkout"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StorefrontPage>
  );
}
