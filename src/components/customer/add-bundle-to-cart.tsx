'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/cart-store';
import { useToast } from '@/components/ui/use-toast';

interface AddBundleToCartProps {
  offer: {
    id: string;
    name: string;
    slug: string;
    quantity: number;
    price: number;
    offerProducts: Array<{
      product: {
        id: string;
        name: string;
        price: number;
        images: string[];
        weight: number;
      };
    }>;
  };
}

export function AddBundleToCart({ offer }: AddBundleToCartProps) {
  const { addItem } = useCartStore();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = () => {
    setIsAdding(true);

    try {
      // Generate a unique bundle ID
      const bundleId = `${offer.id}-${Date.now()}`;

      // Add the first 'quantity' products to the cart as a bundle
      // User can modify selection in cart if needed
      const productsToAdd = offer.offerProducts.slice(0, offer.quantity);

      productsToAdd.forEach((op) => {
        addItem({
          productId: op.product.id,
          productName: op.product.name,
          productPrice: op.product.price,
          productImage: op.product.images[0] || '',
          weight: op.product.weight,
          quantity: 1,
          bundleId: bundleId,
          offerId: offer.id,
          offerName: offer.name,
          offerPrice: offer.price,
          offerQuantity: offer.quantity,
        });
      });

      toast({
        title: 'Bundle added to cart!',
        description: `${offer.name} has been added to your cart. You can customize your selection in the cart.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add bundle to cart',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Button
      onClick={handleAddToCart}
      disabled={isAdding}
      className="w-full"
      size="lg"
    >
      <ShoppingCart className="mr-2 h-5 w-5" />
      {isAdding ? 'Adding...' : 'Start Building Your Bundle'}
    </Button>
  );
}
