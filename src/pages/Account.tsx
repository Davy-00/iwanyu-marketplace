import StorefrontPage from "@/components/StorefrontPage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AccountPage() {
  return (
    <StorefrontPage>
      <div className="container py-8">
        <h1 className="text-3xl font-bold text-iwanyu-foreground">Your Account</h1>
        <p className="mt-1 text-gray-600">Buyer dashboard.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600">Manage your account details.</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Addresses</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600">Shipping and billing addresses.</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Payments</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600">Payment methods and billing.</CardContent>
          </Card>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <a href="/orders">
            <Button className="rounded-full bg-iwanyu-primary text-white hover:bg-iwanyu-primary/90">View orders</Button>
          </a>
          <a href="/seller">
            <Button variant="outline" className="rounded-full">Seller dashboard</Button>
          </a>
          <a href="/admin">
            <Button variant="outline" className="rounded-full">Admin dashboard</Button>
          </a>
        </div>
      </div>
    </StorefrontPage>
  );
}
