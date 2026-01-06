import StorefrontPage from "@/components/StorefrontPage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AccountPage() {
  return (
    <StorefrontPage>
      <div className="container min-h-screen py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-iwanyu-foreground mb-4">My Account</h1>
          <p className="text-lg text-gray-600">Manage your account settings and preferences</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-iwanyu-border p-6">
              <h2 className="text-xl font-semibold text-iwanyu-foreground mb-6">Account Menu</h2>
              <nav className="space-y-4">
                {[
                  { name: 'Profile Settings', icon: '👤' },
                  { name: 'Order History', icon: '📦' },
                  { name: 'Wishlist', icon: '❤️' },
                  { name: 'Addresses', icon: '📍' },
                  { name: 'Payment Methods', icon: '💳' },
                  { name: 'Notifications', icon: '🔔' }
                ].map((item) => (
                  <div key={item.name} className="flex items-center p-3 rounded-xl hover:bg-iwanyu-primary/5 cursor-pointer transition-colors">
                    <span className="mr-3 text-xl">{item.icon}</span>
                    <span className="font-medium text-iwanyu-foreground">{item.name}</span>
                  </div>
                ))}
              </nav>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-iwanyu-border p-8">
              <h3 className="text-2xl font-semibold text-iwanyu-foreground mb-6">Profile Information</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-iwanyu-primary focus:border-iwanyu-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-iwanyu-primary focus:border-iwanyu-primary" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input type="email" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-iwanyu-primary focus:border-iwanyu-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input type="tel" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-iwanyu-primary focus:border-iwanyu-primary" />
                </div>
              </div>
            </div>
            
            <div className="mt-8 bg-white rounded-2xl border border-iwanyu-border p-8">
              <h3 className="text-2xl font-semibold text-iwanyu-foreground mb-6">Account Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-iwanyu-primary/5 rounded-xl">
                  <div className="text-3xl font-bold text-iwanyu-primary">12</div>
                  <div className="text-sm text-gray-600 mt-1">Total Orders</div>
                </div>
                <div className="text-center p-6 bg-green-50 rounded-xl">
                  <div className="text-3xl font-bold text-green-600">8</div>
                  <div className="text-sm text-gray-600 mt-1">Wishlist Items</div>
                </div>
                <div className="text-center p-6 bg-blue-50 rounded-xl">
                  <div className="text-3xl font-bold text-blue-600">3</div>
                  <div className="text-sm text-gray-600 mt-1">Saved Addresses</div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
