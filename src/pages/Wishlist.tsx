import { Link } from "react-router-dom";
import StorefrontPage from "@/components/StorefrontPage";
import { Button } from "@/components/ui/button";

export default function WishlistPage() {
  return (
    <StorefrontPage>
      <div className="container py-8">
        <h1 className="text-3xl font-bold text-iwanyu-foreground">Wishlist</h1>
        <p className="mt-1 text-gray-600">Your saved items.</p>

        <div className="mt-6 rounded-lg border border-iwanyu-border bg-white p-6">
          <p className="text-gray-600">No saved items.</p>
          <Link to="/">
            <Button className="mt-4 rounded-full bg-iwanyu-primary text-white hover:bg-iwanyu-primary/90">Browse products</Button>
          </Link>
        </div>
      </div>
    </StorefrontPage>
  );
}
