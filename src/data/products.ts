
import { Product } from '@/types/product';

export const products: Product[] = [
  {
    id: '1',
    title: 'Premium Wireless Headphones',
    description: 'Experience crystal-clear sound with our premium noise-cancelling wireless headphones.',
    price: 199.99,
    rating: 4.8,
    reviewCount: 3245,
    category: 'Electronics',
    image: '/placeholder.svg',
    badges: ['Best Seller', 'Limited Time Offer'],
    inStock: true,
    freeShipping: true,
    discountPercentage: 15
  },
  {
    id: '2',
    title: 'Ultra-Slim Laptop',
    description: 'Powerful performance in an incredibly thin and light design.',
    price: 1299.99,
    rating: 4.7,
    reviewCount: 1876,
    category: 'Electronics',
    image: '/placeholder.svg',
    badges: ['New Release'],
    inStock: true,
    freeShipping: true
  },
  {
    id: '3',
    title: 'Smart Home Hub',
    description: 'Control all your smart devices from one central hub with voice commands.',
    price: 129.99,
    rating: 4.5,
    reviewCount: 925,
    category: 'Smart Home',
    image: '/placeholder.svg',
    inStock: true,
    freeShipping: true,
    discountPercentage: 10
  },
  {
    id: '4',
    title: 'Fitness Tracker Watch',
    description: 'Monitor your health and fitness goals with precision tracking and smart notifications.',
    price: 79.99,
    rating: 4.6,
    reviewCount: 2134,
    category: 'Wearables',
    image: '/placeholder.svg',
    badges: ['Top Rated'],
    inStock: true,
    freeShipping: false
  },
  {
    id: '5',
    title: 'Designer Desk Lamp',
    description: 'Elegant, adjustable LED desk lamp with multiple brightness settings.',
    price: 49.99,
    rating: 4.4,
    reviewCount: 687,
    category: 'Home Decor',
    image: '/placeholder.svg',
    inStock: true,
    freeShipping: true
  },
  {
    id: '6',
    title: 'Professional Chef Knife Set',
    description: 'Premium stainless steel knife set, perfect for professional chefs and home cooking enthusiasts.',
    price: 189.99,
    rating: 4.9,
    reviewCount: 1253,
    category: 'Kitchen',
    image: '/placeholder.svg',
    badges: ['Premium Quality'],
    inStock: true,
    freeShipping: true,
    discountPercentage: 20
  },
  {
    id: '7',
    title: 'Wireless Charging Pad',
    description: 'Fast wireless charging for all compatible devices with sleek, minimalist design.',
    price: 29.99,
    rating: 4.3,
    reviewCount: 1589,
    category: 'Electronics',
    image: '/placeholder.svg',
    inStock: true,
    freeShipping: false
  },
  {
    id: '8',
    title: 'Ergonomic Office Chair',
    description: 'Premium comfort with adjustable features for all-day support during work hours.',
    price: 249.99,
    rating: 4.7,
    reviewCount: 934,
    category: 'Furniture',
    image: '/placeholder.svg',
    badges: ['Ergonomic Design'],
    inStock: true,
    freeShipping: true
  }
];

export const categories = [
  { id: 'all', name: 'All Departments' },
  { id: 'electronics', name: 'Electronics' },
  { id: 'smart-home', name: 'Smart Home' },
  { id: 'wearables', name: 'Wearables' },
  { id: 'computers', name: 'Computers & Accessories' },
  { id: 'kitchen', name: 'Kitchen' },
  { id: 'furniture', name: 'Furniture' },
  { id: 'home-decor', name: 'Home Decor' },
  { id: 'books', name: 'Books' },
  { id: 'fashion', name: 'Clothing & Fashion' }
];

export const featuredCategories = [
  { id: 'deals', name: 'Today\'s Deals', image: '/placeholder.svg' },
  { id: 'electronics', name: 'Electronics', image: '/placeholder.svg' },
  { id: 'home', name: 'Home & Kitchen', image: '/placeholder.svg' },
  { id: 'fashion', name: 'Fashion', image: '/placeholder.svg' }
];
