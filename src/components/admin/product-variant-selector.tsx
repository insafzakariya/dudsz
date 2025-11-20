'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

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

interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  images: string[];
  enabled: boolean;
  hasVariants: boolean;
  productVariants?: ProductVariant[];
}

interface ProductVariantSelectorProps {
  product: Product;
  selectedVariantIds: string[];
  onVariantSelectionChange: (productId: string, variantIds: string[]) => void;
  onRemoveProduct: (productId: string) => void;
}

export function ProductVariantSelector({
  product,
  selectedVariantIds,
  onVariantSelectionChange,
  onRemoveProduct,
}: ProductVariantSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Group variants by type
  const variantsByType = new Map<string, { typeName: string; options: VariantOption[] }>();

  if (product.hasVariants && product.productVariants) {
    product.productVariants.forEach((pv) => {
      const typeId = pv.variantOption.variantType.id;
      const typeName = pv.variantOption.variantType.name;

      if (!variantsByType.has(typeId)) {
        variantsByType.set(typeId, { typeName, options: [] });
      }
      variantsByType.get(typeId)!.options.push(pv.variantOption);
    });
  }

  const handleVariantToggle = (variantId: string) => {
    const newSelection = selectedVariantIds.includes(variantId)
      ? selectedVariantIds.filter(id => id !== variantId)
      : [...selectedVariantIds, variantId];

    onVariantSelectionChange(product.id, newSelection);
  };

  const handleSelectAll = () => {
    if (!product.productVariants) return;
    const allVariantIds = product.productVariants.map(pv => pv.variantOption.id);
    onVariantSelectionChange(product.id, allVariantIds);
  };

  const handleDeselectAll = () => {
    onVariantSelectionChange(product.id, []);
  };

  const allSelected = product.productVariants
    ? selectedVariantIds.length === product.productVariants.length
    : false;

  const hasVariants = product.hasVariants && product.productVariants && product.productVariants.length > 0;

  return (
    <div className="flex flex-col p-3 bg-blue-50 rounded-lg border border-blue-200">
      {/* Product Header */}
      <div className="flex items-center gap-3">
        {product.images[0] && (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-12 h-12 object-cover rounded"
          />
        )}
        <div className="flex-1">
          <p className="font-semibold text-sm">{product.name}</p>
          <p className="text-xs text-gray-600">
            Code: {product.code} | {formatPrice(product.price)}
          </p>
          {hasVariants && (
            <p className="text-xs text-blue-600 mt-1">
              {selectedVariantIds.length === 0
                ? 'No variants selected - product will not appear in offer'
                : `${selectedVariantIds.length} variant${selectedVariantIds.length > 1 ? 's' : ''} selected`
              }
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasVariants && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemoveProduct(product.id)}
          >
            <X className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </div>

      {/* Variant Selection */}
      {hasVariants && isExpanded && (
        <div className="mt-3 pt-3 border-t border-blue-200 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">Select Variants for Offer:</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={allSelected}
                className="h-7 text-xs"
              >
                Select All
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDeselectAll}
                disabled={selectedVariantIds.length === 0}
                className="h-7 text-xs"
              >
                Clear
              </Button>
            </div>
          </div>

          {Array.from(variantsByType.entries()).map(([typeId, { typeName, options }]) => (
            <div key={typeId} className="space-y-2">
              <p className="text-xs font-semibold text-gray-600">{typeName}:</p>
              <div className="flex flex-wrap gap-2">
                {options.map((option) => {
                  const isSelected = selectedVariantIds.includes(option.id);
                  return (
                    <label
                      key={option.id}
                      className={`cursor-pointer px-3 py-1.5 rounded-md border text-xs font-medium transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                          : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleVariantToggle(option.id)}
                        className="sr-only"
                      />
                      {option.name}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {!hasVariants && (
        <p className="text-xs text-gray-500 mt-2">No variants configured for this product</p>
      )}
    </div>
  );
}
