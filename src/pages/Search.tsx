import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { useMarketplace } from "@/context/marketplace";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search as SearchIcon, Filter, SortAsc } from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Search = () => {
  const [searchParams] = useSearchParams();
  const { products } = useMarketplace();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [sortBy, setSortBy] = useState("relevance");
  const [filterCategory, setFilterCategory] = useState("all");

  useEffect(() => {
    setQuery(searchParams.get("q") || "");
  }, [searchParams]);

  // Get unique categories for filtering
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  const searchResults = products.filter(product => {
    if (!query.trim()) return true; // Show all products when no search query
    
    const searchTerm = query.toLowerCase().trim();
    const searchWords = searchTerm.split(/\s+/);
    
    // Check if any search word matches any product field
    const matchesSearch = searchWords.some(word => 
      product.title.toLowerCase().includes(word) ||
      product.description?.toLowerCase().includes(word) ||
      product.category?.toLowerCase().includes(word) ||
      product.vendor?.toLowerCase().includes(word) ||
      product.tags?.some(tag => tag.toLowerCase().includes(word))
    );
    
    // Apply category filter
    const matchesCategory = filterCategory === "all" || product.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Sort results
  const sortedResults = [...searchResults].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "name":
        return a.title.localeCompare(b.title);
      case "newest":
        return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
      default: // relevance
        if (!query.trim()) return 0;
        const aScore = a.title.toLowerCase().includes(query.toLowerCase()) ? 2 : 1;
        const bScore = b.title.toLowerCase().includes(query.toLowerCase()) ? 2 : 1;
        return bScore - aScore;
    }
  });

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      
      <main className="flex-1">
        <div className="container py-12">
          {/* Search Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Search Results</h1>
            {query && (
              <p className="text-lg text-gray-600">
                Showing {sortedResults.length} result{sortedResults.length !== 1 ? 's' : ''} for <span className="font-semibold text-iwanyu-primary">"{query}"</span>
              </p>
            )}
          </div>

          {/* Filters and Sorting */}
          {(query || sortedResults.length > 0) && (
            <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-gray-500" />
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category!}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <SortAsc size={16} className="text-gray-500" />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Search Results */}
          {query ? (
            sortedResults.length > 0 ? (
              <>
                <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
                  {sortedResults.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <SearchIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No results found for "{query}"
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  We couldn't find any products matching your search. Try different keywords or browse our popular categories below.
                </p>
                
                {/* Suggested searches */}
                <div className="mb-8">
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Try searching for:</h4>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['shirts', 'shoes', 'accessories', 'electronics', 'books', 'beauty'].map(suggestion => (
                      <Button
                        key={suggestion}
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `/search?q=${suggestion}`}
                        className="capitalize hover:bg-iwanyu-primary hover:text-white"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <Button onClick={() => window.location.href = "/"}>Browse All Products</Button>
              </div>
            )
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-iwanyu-primary/10 mb-4">
                <SearchIcon className="w-8 h-8 text-iwanyu-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Find your perfect product
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Use the search bar above to find products by name, category, or brand.
              </p>
              
              {/* Show all products when no search query */}
              <div className="text-left">
                <h4 className="text-lg font-semibold text-gray-900 mb-6">All Products</h4>
                <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
                  {products.slice(0, 24).map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {products.length > 24 && (
                  <div className="text-center mt-8">
                    <Button onClick={() => window.location.href = "/"}>View All {products.length} Products</Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Search;
