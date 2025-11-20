'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/store/cart-store';
import { useToast } from '@/components/ui/use-toast';

interface VariantOption {
  id: string;
  name: string;
  variantType: {
    id: string;
    name: string;
  };
}

interface ProductVariant {
  id: string;
  variantOption: VariantOption;
}

interface ProductCardProps {
  product: {
    id: string;
    code: string;
    name: string;
    price: number;
    images: string[];
    category: { name: string } | null;
    hasVariants?: boolean;
    productVariants?: ProductVariant[];
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  // Map<variantTypeId, variantOptionId>
  const [selectedVariants, setSelectedVariants] = useState<Map<string, string>>(new Map());
  const { addItem } = useCartStore();
  const { toast } = useToast();

  // No cart highlighting
  const isInCart = false;
  const totalInCart = 0;

  // Group variants by type
  const getVariantsByType = () => {
    if (!product.productVariants || product.productVariants.length === 0) {
      return [];
    }

    const variantMap = new Map<
      string,
      { typeId: string; typeName: string; options: VariantOption[] }
    >();

    product.productVariants.forEach((pv) => {
      const typeId = pv.variantOption.variantType.id;
      const typeName = pv.variantOption.variantType.name;

      if (!variantMap.has(typeId)) {
        variantMap.set(typeId, { typeId, typeName, options: [] });
      }
      variantMap.get(typeId)!.options.push(pv.variantOption);
    });

    return Array.from(variantMap.values());
  };

  const variantTypes = getVariantsByType();

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  const selectVariant = (variantTypeId: string, variantOptionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newVariants = new Map(selectedVariants);
    newVariants.set(variantTypeId, variantOptionId);
    setSelectedVariants(newVariants);
  };

  const handleAddToCart = () => {
    // Check if all variants are selected
    if (variantTypes.length > 0 && selectedVariants.size !== variantTypes.length) {
      toast({
        title: "Please select all options",
        description: `Select all variant options for ${product.name}`,
        variant: "destructive",
      });
      return;
    }

    // Build variant info string
    let variantInfo = "";
    if (selectedVariants.size > 0 && product.productVariants) {
      const variantLabels: string[] = [];
      selectedVariants.forEach((optionId, typeId) => {
        const variant = product.productVariants?.find(
          (pv) => pv.variantOption.id === optionId
        );
        if (variant) {
          variantLabels.push(
            `${variant.variantOption.variantType.name}: ${variant.variantOption.name}`
          );
        }
      });
      variantInfo = variantLabels.join(", ");
    }

    // Add to cart
    addItem({
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      productPrice: product.price,
      productImage: product.images[0] || "",
      weight: 0, // You may want to add weight to product data
      quantity: quantity,
      size: variantInfo, // Store variant info in size field for display
    });

    toast({
      title: "Added to cart!",
      description: `${quantity} x ${product.name} added to your cart`,
    });

    // Reset selections
    setQuantity(1);
    setSelectedVariants(new Map());

    // Trigger cart drawer open
    window.dispatchEvent(new Event('toggle-cart'));
  };
  return (
    <Card className="h-full hover:shadow-xl transition-all cursor-pointer overflow-hidden relative group active:scale-[0.98] duration-150">
      {/* Beautiful gradient background */}
      <div
        className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity"
        style={{
          background: `linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)`
        }}
      />

      {/* Decorative circles */}
      <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-5" style={{ backgroundColor: 'var(--primary)' }} />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full opacity-5" style={{ backgroundColor: 'var(--secondary)' }} />

      <CardContent className="p-0 relative z-10">
        <div className="aspect-square bg-gray-100 overflow-hidden relative">
          {product.images[0] && (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          )}
          {/* Category badge overlay */}
          {product.category && (
            <div className="absolute top-2 left-2">
              <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium shadow-sm" style={{ color: 'var(--primary)' }}>
                {product.category.name}
              </span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex-col items-start p-3 sm:p-4 relative z-10 gap-2 sm:gap-3">
        <div className="flex-1 w-full space-y-2 sm:space-y-3">
          <h3 className="font-bold text-sm sm:text-base line-clamp-2 group-hover:text-[var(--primary)] transition-colors w-full">
            {product.name}
          </h3>

          {/* Price highlight box */}
          <div className="w-full rounded-md p-2 sm:p-3 bg-blue-50 border border-blue-100">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--primary)' }}>
                {formatPrice(product.price)}
              </div>
            </div>
          </div>

          {/* Variants Display - with minimum height to keep buttons aligned */}
          <div className="w-full min-h-[60px]">
            {variantTypes.length > 0 && (
              <div className="w-full space-y-2 py-2 border-t border-gray-100">
                {variantTypes.map((variantType) => {
                  const selectedOption = selectedVariants.get(variantType.typeId);
                  return (
                    <div key={variantType.typeId} className="space-y-1">
                      <p className="text-[10px] sm:text-xs font-semibold text-gray-600">
                        {variantType.typeName}:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {variantType.options.map((option) => {
                          const isSelected = selectedOption === option.id;
                          return (
                            <button
                              key={option.id}
                              onClick={(e) => selectVariant(variantType.typeId, option.id, e)}
                              className={`px-2 py-1 rounded text-[9px] sm:text-xs font-medium border transition-all ${
                                isSelected
                                  ? 'bg-blue-500 text-white border-blue-600 shadow-sm'
                                  : 'bg-gray-100 text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                              }`}
                            >
                              {option.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="w-full flex items-center gap-2 mt-auto">
          {/* Quantity Spinner */}
          <div className="flex items-center border rounded-md">
            <button
              onClick={(e) => { e.stopPropagation(); decrementQuantity(); }}
              className="h-8 sm:h-9 w-8 sm:w-9 flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
            <span className="h-8 sm:h-9 w-10 sm:w-12 flex items-center justify-center text-xs sm:text-sm font-semibold border-x">
              {quantity}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); incrementQuantity(); }}
              className="h-8 sm:h-9 w-8 sm:w-9 flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <Button
            onClick={(e) => { e.stopPropagation(); handleAddToCart(); }}
            className="flex-1 group-hover:shadow-lg transition-shadow text-xs sm:text-sm h-8 sm:h-9"
            size="sm"
          >
            <ShoppingCart className="mr-1.5 h-3 w-3 sm:h-4 sm:w-4" />
            Add to Cart
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
