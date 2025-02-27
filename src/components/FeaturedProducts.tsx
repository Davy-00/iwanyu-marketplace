
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { products } from '@/data/products';

interface FeaturedProductsProps {
  title: string;
  subtitle?: string;
  productIds?: string[];
  category?: string;
  viewAllLink?: string;
  maxProducts?: number;
}

export const FeaturedProducts = ({
  title,
  subtitle,
  productIds,
  category,
  viewAllLink = '/products',
  maxProducts = 4
}: FeaturedProductsProps) => {
  let displayProducts = [...products];
  
  // Filter by product IDs if provided
  if (productIds && productIds.length > 0) {
    displayProducts = displayProducts.filter(product => 
      productIds.includes(product.id)
    );
  }
  
  // Filter by category if provided
  if (category) {
    displayProducts = displayProducts.filter(product => 
      product.category.toLowerCase() === category.toLowerCase()
    );
  }
  
  // Limit number of products
  displayProducts = displayProducts.slice(0, maxProducts);

  return (
    <section className="py-8 sm:py-12">
      <div className="container">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold text-iwanyu-foreground sm:text-3xl">{title}</h2>
            {subtitle && <p className="mt-1 text-gray-500">{subtitle}</p>}
          </div>
          {viewAllLink && (
            <Link
              to={viewAllLink}
              className="flex items-center text-sm font-medium text-iwanyu-primary hover:underline"
            >
              View all
              <ChevronRight size={16} />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
          {displayProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};
