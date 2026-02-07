import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Minus, ShoppingCart, Check } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import type { Database } from '@/integrations/supabase/types';

type Product = Database['public']['Tables']['products']['Row'];

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const handleAddToCart = () => {
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      setQuantity(1);
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group bg-card rounded-xl overflow-hidden shadow-card hover:shadow-glow transition-shadow"
    >
      {/* Product Image */}
      <div className="aspect-square overflow-hidden bg-muted">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <ShoppingCart className="h-12 w-12" />
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-1 line-clamp-2">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-4">
            {product.description}
          </p>
        )}

        <div className="flex items-center justify-between mb-3">
          <span className="text-lg font-bold text-primary">
            {formatPrice(product.price)}
          </span>
        </div>

        {/* Quantity & Add to Cart */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-md">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-r-none"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={added}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="h-9 w-12 text-center border-0 rounded-none"
              disabled={added}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-l-none"
              onClick={() => setQuantity(quantity + 1)}
              disabled={added}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Button
            onClick={handleAddToCart}
            disabled={added}
            className="flex-1"
            variant={added ? 'secondary' : 'default'}
          >
            {added ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Toegevoegd
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Toevoegen
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
