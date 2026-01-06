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

  const galleryMedia = useMemo<ProductMedia[]>(() => {
    if (!product) return [];

    const fallback: ProductMedia[] = product.image
      ? [{ id: `primary-${product.id}`, kind: "image", url: product.image }]
      : [];

    const source = media.length > 0 ? media : fallback;

    // De-dupe by kind+url to avoid repeated thumbnails.
    const seen = new Set<string>();
    const deduped: ProductMedia[] = [];
    for (const m of source) {
      const key = `${m.kind}:${m.url}`;
      if (!m.url || seen.has(key)) continue;
      seen.add(key);
      deduped.push(m);
    }

    return deduped;
  }, [media, product]);

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
      <div className="container min-h-screen py-12">
        <div className="text-sm text-gray-500 mb-8">
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

        <div className="grid gap-12 md:grid-cols-2 lg:gap-16">
          <div className="rounded-2xl border border-iwanyu-border bg-iwanyu-muted p-12">
            {(() => {
              const firstImage = galleryMedia.find((m) => m.kind === "image")?.url ?? product.image;
              const firstVideo = galleryMedia.find((m) => m.kind === "video")?.url ?? "";

              if (firstImage) {
                return (
                  <img
                    src={getOptimizedCloudinaryUrl(firstImage, { kind: "image", width: 900 })}
                    alt={product.title}
                    className="mx-auto h-80 w-80 object-contain lg:h-[420px] lg:w-[420px]"
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

            {galleryMedia.length > 1 ? (
              <div className="mt-6 grid grid-cols-3 gap-3 lg:grid-cols-4">
                {galleryMedia.slice(0, 12).map((m) => (
                  <div
                    key={m.id}
                    className="rounded-xl border border-iwanyu-border bg-white p-2 hover:shadow-md transition-shadow"
                  >
                    {m.kind === "image" ? (
                      <img
                        src={getOptimizedCloudinaryUrl(m.url, { kind: "image", width: 300 })}
                        alt=""
                        className="h-20 w-full object-cover rounded-lg"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-20 items-center justify-center text-sm text-gray-600 bg-gray-100 rounded-lg">
                        <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                        </svg>
                        Video
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-iwanyu-foreground mb-4">{product.title}</h1>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">({product.reviewCount} reviews)</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  product.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {product.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
            </div>

            {/* Price Section */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex items-baseline gap-4 mb-4">
                <span className="text-4xl font-bold text-iwanyu-foreground">{formatMoney(product.price)}</span>
                {product.discountPercentage && product.discountPercentage > 0 && (
                  <span className="text-xl text-gray-500 line-through">
                    {formatMoney(product.price * (1 + product.discountPercentage / 100))}
                  </span>
                )}
              </div>
              {product.freeShipping && (
                <div className="flex items-center text-green-600 text-sm font-medium">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z" />
                  </svg>
                  Free Shipping Included
                </div>
              )}
            </div>

            {/* Size Selection */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-iwanyu-foreground">Available Sizes</h3>
              <div className="grid grid-cols-4 gap-3">
                {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                  <button
                    key={size}
                    className="border-2 border-gray-200 rounded-xl py-3 px-4 text-center font-medium hover:border-iwanyu-primary hover:bg-iwanyu-primary/5 transition-colors"
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Add to Cart */}
            <div className="flex flex-wrap gap-4">
              <Button
                className="flex-1 rounded-xl bg-iwanyu-primary text-white hover:bg-iwanyu-primary/90 py-4 text-lg font-semibold"
                disabled={!product.inStock}
                onClick={() => {
                  addItem({ productId: product.id, title: product.title, price: product.price, image: product.image });
                  toast({ title: "Added to cart", description: `${product.title} has been added to your cart.` });
                }}
              >
                <ShoppingCart size={20} className="mr-2" />
                {product.inStock ? "Add to cart" : "Out of stock"}
              </Button>
              <Link to="/cart">
                <Button variant="outline" className="rounded-xl py-4 px-8 text-lg font-semibold border-2">
                  View cart
                </Button>
              </Link>
            </div>

            {/* Product Details */}
            <div className="bg-white rounded-2xl border border-iwanyu-border p-8">
              <h3 className="text-xl font-semibold text-iwanyu-foreground mb-6">Product Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-gray-500 mb-2">Vendor</div>
                  <div className="font-medium text-iwanyu-foreground text-lg">{vendor?.name ?? "—"}</div>
                </div>
                <div>
                  <div className="text-gray-500 mb-2">Category</div>
                  <div className="font-medium text-iwanyu-foreground text-lg">{product.category}</div>
                </div>
                <div>
                  <div className="text-gray-500 mb-2">Shipping</div>
                  <div className="font-medium text-iwanyu-foreground text-lg">
                    {product.freeShipping ? "Free shipping" : "Calculated at checkout"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 mb-2">Availability</div>
                  <div className="font-medium text-iwanyu-foreground text-lg">
                    {product.inStock ? "In Stock" : "Out of Stock"}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl border border-iwanyu-border p-8">
              <h3 className="text-xl font-semibold text-iwanyu-foreground mb-4">Description</h3>
              <div className="prose max-w-none text-gray-700 leading-relaxed">
                <p className="text-lg mb-4">{product.description}</p>
                <p className="mb-4">This high-quality product offers exceptional value and performance. Crafted with attention to detail, it meets the highest standards of quality and durability.</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Premium materials and construction</li>
                  <li>Designed for long-lasting use</li>
                  <li>Easy care and maintenance</li>
                  <li>Satisfaction guaranteed</li>
                </ul>
              </div>
            </div>

            {/* Specifications */}
            <div className="bg-white rounded-2xl border border-iwanyu-border p-8">
              <h3 className="text-xl font-semibold text-iwanyu-foreground mb-6">Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Material</span>
                  <span className="font-medium">Premium Quality</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Care Instructions</span>
                  <span className="font-medium">Easy Care</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Warranty</span>
                  <span className="font-medium">1 Year</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Country of Origin</span>
                  <span className="font-medium">Rwanda</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Products */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-iwanyu-foreground mb-8">Recommended Products</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {products
              .filter(p => p.category === product.category && p.id !== product.id)
              .slice(0, 12)
              .map((relatedProduct) => (
                <Link
                  key={relatedProduct.id}
                  to={`/product/${relatedProduct.id}`}
                  className="group block rounded-2xl border border-iwanyu-border bg-white shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="aspect-[3/4] overflow-hidden rounded-t-2xl bg-gray-100">
                    {relatedProduct.image ? (
                      <img
                        src={getOptimizedCloudinaryUrl(relatedProduct.image, { kind: "image", width: 400 })}
                        alt={relatedProduct.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400">
                        <svg className="h-12 w-12" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-sm text-iwanyu-foreground line-clamp-2 group-hover:text-iwanyu-primary transition-colors">
                      {relatedProduct.title}
                    </h4>
                    <p className="text-lg font-bold text-iwanyu-foreground mt-2">
                      {formatMoney(relatedProduct.price)}
                    </p>
                  </div>
                </Link>
              ))
            }
          </div>
        </div>
      </div>
    </StorefrontPage>
  );
}
