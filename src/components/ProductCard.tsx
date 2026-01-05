
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, ShoppingCart, Check } from 'lucide-react';
import { Product } from '@/types/product';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/context/cart';
import { useMarketplace } from '@/context/marketplace';
import { formatMoney } from '@/lib/money';
import { Badge } from '@/components/ui/badge';
import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const { toast } = useToast();
  const { addItem } = useCart();
  const { getVendorById } = useMarketplace();

  const {
    id,
    vendorId,
    title,
    price,
    rating,
    reviewCount,
    category,
    image,
    discountPercentage,
    inStock,
    freeShipping
  } = product;

  const vendorName = vendorId ? getVendorById(vendorId)?.name : undefined;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({ productId: id, title, price, image });
    toast({
      title: "Added to cart",
      description: `${title} has been added to your cart.`,
    });
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    toast({
      title: isFavorite ? "Removed from wishlist" : "Added to wishlist",
      description: `${title} has been ${isFavorite ? "removed from" : "added to"} your wishlist.`,
    });
  };

  return (
    <Link
      to={`/product/${id}`}
      className="group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden rounded-lg border border-iwanyu-border bg-white shadow-product transition-all duration-300 hover:shadow-hover hover:-translate-y-1">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden bg-iwanyu-muted p-4">
          {image ? (
            <img
              src={getOptimizedCloudinaryUrl(image, { kind: "image", width: 600 })}
              alt={title}
              className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">No image</div>
          )}

          {typeof discountPercentage === "number" && discountPercentage > 0 ? (
            <div className="absolute left-2 top-2">
              <Badge>{discountPercentage}% off</Badge>
            </div>
          ) : null}
          
          {/* Favorite Button */}
          <button
            className={`absolute right-2 top-2 rounded-full p-1.5 transition-colors ${
              isFavorite 
                ? 'bg-red-50 text-red-500' 
                : 'bg-white/80 text-gray-400 hover:bg-iwanyu-muted hover:text-gray-600'
            }`}
            onClick={handleToggleFavorite}
            aria-label={isFavorite ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
          </button>
          
          {/* Quick Add to Cart - Shows on Hover */}
          <div 
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/90 to-transparent p-4 pt-8 transition-all duration-300 ${
              isHovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
            }`}
          >
            <Button 
              onClick={handleAddToCart}
              disabled={!inStock}
              className="w-full rounded-full bg-iwanyu-primary font-medium text-white hover:bg-iwanyu-primary/90"
            >
              <ShoppingCart size={16} className="mr-2" />
              {inStock ? 'Add to Cart' : 'Out of Stock'}
            </Button>
          </div>
        </div>
        
        {/* Product Details */}
        <div className="p-4">
          <h3 className="mb-1 text-sm font-medium text-iwanyu-foreground line-clamp-2">
            {title}
          </h3>

          <div className="mb-2 flex flex-wrap items-center gap-2">
            {category ? <Badge variant="secondary">{category}</Badge> : null}
          </div>

          {vendorName ? (
            <div className="mb-2 text-xs text-gray-500">Sold by {vendorName}</div>
          ) : null}
          
          {/* Rating */}
          <div className="mb-2 flex items-center">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={i < Math.floor(rating) ? "fill-iwanyu-primary text-iwanyu-primary" : "text-gray-300"}
                  fill={i < Math.floor(rating) ? "currentColor" : "none"}
                />
              ))}
            </div>
            <span className="ml-1 text-xs text-gray-500">{reviewCount}</span>
          </div>
          
          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-iwanyu-foreground">
              {formatMoney(price)}
            </span>
          </div>
          
          {/* Free Shipping */}
          {freeShipping && (
            <div className="mt-2 flex items-center text-xs text-green-600">
              <Check size={12} className="mr-1" />
              Free shipping
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
