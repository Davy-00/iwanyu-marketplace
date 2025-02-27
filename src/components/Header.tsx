
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Search, ShoppingCart, User, X } from 'lucide-react';
import { categories } from '@/data/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle search submission
    console.log('Search for:', searchQuery);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-iwanyu-border bg-iwanyu-dark text-white">
      {/* Main Header */}
      <div className="container mx-auto px-4 py-2 md:py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold text-iwanyu-primary">iwanyu</span>
            <span className="text-lg font-medium">store</span>
          </Link>

          {/* Search Bar - Hidden on Mobile */}
          <div className="hidden flex-1 max-w-2xl md:block">
            <form onSubmit={handleSearchSubmit} className="flex">
              <Input
                type="text"
                placeholder="Search iwanyu store"
                value={searchQuery}
                onChange={handleSearchChange}
                className="h-10 flex-1 rounded-l-md border-iwanyu-border bg-white text-iwanyu-foreground"
              />
              <Button 
                type="submit" 
                className="rounded-l-none rounded-r-md bg-iwanyu-primary text-white hover:bg-iwanyu-primary/90"
              >
                <Search size={20} />
              </Button>
            </form>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden items-center space-x-4 md:flex">
            <Link to="/account" className="text-sm button-hover hover:text-iwanyu-primary">
              <div className="flex flex-col items-start">
                <span className="text-xs opacity-85">Hello, Sign in</span>
                <span className="font-medium">Account & Lists</span>
              </div>
            </Link>
            <Link to="/orders" className="text-sm button-hover hover:text-iwanyu-primary">
              <div className="flex flex-col items-start">
                <span className="text-xs opacity-85">Returns</span>
                <span className="font-medium">& Orders</span>
              </div>
            </Link>
            <Link to="/cart" className="relative button-hover hover:text-iwanyu-primary">
              <ShoppingCart size={24} />
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-iwanyu-primary text-xs font-bold text-white">
                0
              </span>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-4 md:hidden">
            <Link to="/cart" className="relative">
              <ShoppingCart size={24} />
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-iwanyu-primary text-xs font-bold text-white">
                0
              </span>
            </Link>
            <button 
              onClick={toggleMobileMenu}
              className="text-white focus:outline-none"
              aria-label="Toggle menu"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>

        {/* Search Bar - Mobile Only */}
        <div className="mt-2 md:hidden">
          <form onSubmit={handleSearchSubmit} className="flex">
            <Input
              type="text"
              placeholder="Search iwanyu store"
              value={searchQuery}
              onChange={handleSearchChange}
              className="h-9 flex-1 rounded-l-md border-iwanyu-border bg-white text-iwanyu-foreground"
            />
            <Button 
              type="submit" 
              className="h-9 rounded-l-none rounded-r-md bg-iwanyu-primary text-white hover:bg-iwanyu-primary/90"
            >
              <Search size={18} />
            </Button>
          </form>
        </div>
      </div>

      {/* Secondary Nav */}
      <nav className="bg-iwanyu-light py-2">
        <div className="container mx-auto hidden px-4 md:block">
          <ul className="flex items-center space-x-6 text-sm">
            <li>
              <button className="flex items-center text-white button-hover hover:text-iwanyu-primary">
                <Menu size={18} className="mr-1" />
                <span>All</span>
              </button>
            </li>
            {categories.slice(0, 7).map((category) => (
              <li key={category.id}>
                <Link 
                  to={`/category/${category.id}`} 
                  className="text-white button-hover hover:text-iwanyu-primary"
                >
                  {category.name}
                </Link>
              </li>
            ))}
            <li>
              <Link 
                to="/deals" 
                className="font-medium text-white button-hover hover:text-iwanyu-primary"
              >
                Today's Deals
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex animate-fade-in md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={toggleMobileMenu}></div>
          <div className="relative h-full w-4/5 max-w-xs animate-slide-in-right bg-white p-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-iwanyu-border pb-3">
              <div className="flex items-center">
                <User size={24} className="mr-2 text-iwanyu-primary" />
                <h2 className="text-lg font-semibold text-iwanyu-foreground">Hello, Sign In</h2>
              </div>
              <button 
                onClick={toggleMobileMenu}
                className="text-iwanyu-foreground focus:outline-none"
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>
            <nav className="mt-4">
              <h3 className="mb-2 text-lg font-semibold text-iwanyu-foreground">Shop By Department</h3>
              <ul className="space-y-2">
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link 
                      to={`/category/${category.id}`} 
                      className="block py-2 text-iwanyu-foreground hover:text-iwanyu-primary"
                      onClick={toggleMobileMenu}
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-6 border-t border-iwanyu-border pt-4">
                <ul className="space-y-2">
                  <li>
                    <Link 
                      to="/account" 
                      className="block py-2 text-iwanyu-foreground hover:text-iwanyu-primary"
                      onClick={toggleMobileMenu}
                    >
                      Your Account
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/orders" 
                      className="block py-2 text-iwanyu-foreground hover:text-iwanyu-primary"
                      onClick={toggleMobileMenu}
                    >
                      Your Orders
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/wishlist" 
                      className="block py-2 text-iwanyu-foreground hover:text-iwanyu-primary"
                      onClick={toggleMobileMenu}
                    >
                      Your Wishlist
                    </Link>
                  </li>
                </ul>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};
