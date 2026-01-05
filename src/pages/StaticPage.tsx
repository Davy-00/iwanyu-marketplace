import StorefrontPage from "@/components/StorefrontPage";

export default function StaticPage({ title }: { title: string }) {
  return (
    <StorefrontPage>
      <div className="container py-10">
        <h1 className="text-3xl font-bold text-iwanyu-foreground">{title}</h1>
        <p className="mt-2 text-gray-600">This page isn’t available yet.</p>
      </div>
    </StorefrontPage>
  );
}
