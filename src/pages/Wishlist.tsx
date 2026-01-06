import { Link } from "react-router-dom";
import StorefrontPage from "@/components/StorefrontPage";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/context/wishlist";
import { useMarketplace } from "@/context/marketplace";
import { ProductCard } from "@/components/ProductCard";

export default function WishlistPage() {
  const { productIds } = useWishlist();
  const { products } = useMarketplace();

  const wishlistProducts = productIds
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean);

  return (
    <StorefrontPage>
      <div className="container min-h-screen py-12">
        <h1 className="text-3xl font-bold text-iwanyu-foreground">Wishlist</h1>
        <p className="mt-1 text-gray-600">Your saved items.</p>

        {wishlistProducts.length === 0 ? (
          <div className="mt-6 rounded-lg border border-iwanyu-border bg-white p-6">
            <p className="text-gray-600">No saved items.</p>
            <Link to="/">
              <Button className="mt-4 rounded-full bg-iwanyu-primary text-white hover:bg-iwanyu-primary/90">Browse products</Button>
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {wishlistProducts.map((p) => (
              <ProductCard key={p!.id} product={p!} />
            ))}
          </div>
        )}
      </div>
    </StorefrontPage>
  );
}
