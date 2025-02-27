
export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  rating: number;
  reviewCount: number;
  category: string;
  image: string;
  badges?: string[];
  inStock: boolean;
  freeShipping?: boolean;
  discountPercentage?: number;
}
