
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { CategoryNav } from "@/components/CategoryNav";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      
      <main className="flex-1">
        <HeroSection />
        
        <CategoryNav />
        
        <FeaturedProducts 
          title="Today's Deals" 
          subtitle="Limited time offers on top products"
          viewAllLink="/deals"
        />
        
        <div className="container py-4">
          <div className="rounded-lg border border-iwanyu-border bg-gradient-to-r from-yellow-50 to-amber-50 p-6 shadow-subtle">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <span className="inline-block rounded bg-iwanyu-primary/10 px-2.5 py-1 text-xs font-medium text-iwanyu-primary">
                  Limited Offer
                </span>
                <h2 className="mt-2 text-2xl font-bold text-iwanyu-foreground">
                  Get free shipping on your first order
                </h2>
                <p className="mt-1 text-gray-600">
                  Sign up for an iwanyu account and get free shipping on your first order.
                </p>
              </div>
              <div className="flex items-center justify-center md:justify-end">
                <a 
                  href="/account" 
                  className="rounded-full bg-iwanyu-primary px-6 py-2.5 text-center text-sm font-medium text-white shadow-md transition-colors hover:bg-iwanyu-primary/90"
                >
                  Sign Up Now
                </a>
              </div>
            </div>
          </div>
        </div>
        
        <FeaturedProducts 
          title="Top Electronics" 
          category="Electronics"
          viewAllLink="/category/electronics"
        />
        
        <FeaturedProducts 
          title="Home & Kitchen Favorites" 
          category="Kitchen"
          viewAllLink="/category/kitchen"
          maxProducts={4}
        />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
