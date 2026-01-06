import { useMarketplace } from "@/context/marketplace";
import StorefrontPage from "@/components/StorefrontPage";
import { ProductCard } from "@/components/ProductCard";

export default function Deals() {
  const { products } = useMarketplace();
  const dealProducts = products;

  return (
    <StorefrontPage>
      <div className="container min-h-screen py-12">
        <h1 className="text-3xl font-bold text-iwanyu-foreground">Deals</h1>
        <p className="mt-1 text-gray-600">Browse available products.</p>

        {dealProducts.length === 0 ? (
          <div className="mt-8 rounded-lg border border-iwanyu-border bg-white p-6 text-gray-600">
            No products yet.
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
            {dealProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </StorefrontPage>
  );
}
