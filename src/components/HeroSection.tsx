import { Button } from '@/components/ui/button';

export const HeroSection = () => {
  return (
    <section className="relative w-full overflow-hidden bg-iwanyu-muted">
      <div className="container py-10 sm:py-14">
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold text-iwanyu-foreground sm:text-4xl">Shop from trusted sellers</h2>
            <p className="mt-2 max-w-md text-sm text-gray-600 sm:text-base">
              Discover products across categories and check out securely.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild className="rounded-full bg-iwanyu-primary text-white hover:bg-iwanyu-primary/90">
                <a href="/category/all">Browse products</a>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <a href="/sell">Become a seller</a>
              </Button>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="aspect-[4/3] w-full rounded-xl border border-iwanyu-border bg-white" />
          </div>
        </div>
      </div>
    </section>
  );
};
