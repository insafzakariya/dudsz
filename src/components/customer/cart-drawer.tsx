'use client';

import { useEffect, useState } from 'react';
import { X, ShoppingBag, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cart-store';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';

export function CartDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const { items, getBundles, removeItem, getTotalPrice, clearCart, getIncompleteBundles } = useCartStore();

  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);
    window.addEventListener('toggle-cart', handleToggle);
    return () => window.removeEventListener('toggle-cart', handleToggle);
  }, []);

  const bundleGroups = getBundles();
  const totalPrice = getTotalPrice();
  const incompleteBundles = getIncompleteBundles();

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-bold">Shopping Cart</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <ShoppingBag className="h-16 w-16 mb-4 opacity-50" />
                <p>Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Bundle Groups */}
                {bundleGroups.map((bundle) => (
                  <div
                    key={bundle.bundleId}
                    className={`border-2 rounded-lg p-4 ${
                      bundle.isComplete ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-blue-600">
                        <AlertCircle className="h-4 w-4" />
                        <span className="font-semibold text-sm">
                          {bundle.offerName}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-gray-600">
                        {bundle.currentQuantity} / {bundle.requiredQuantity} items
                      </span>
                    </div>

                    {!bundle.isComplete && (
                      <div className="bg-yellow-100 text-yellow-800 text-xs p-2 rounded mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-3 w-3" />
                          <span>
                            Add {bundle.requiredQuantity - bundle.currentQuantity} more
                            item(s) to meet minimum requirement
                          </span>
                        </div>
                        <Link
                          href={`/offers/${bundle.offerSlug}?bundleId=${bundle.bundleId}`}
                          onClick={() => setIsOpen(false)}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs bg-white hover:bg-yellow-50 border-yellow-300"
                          >
                            Add More Items to This Offer
                          </Button>
                        </Link>
                      </div>
                    )}

                    {bundle.isComplete && (
                      <div className="bg-green-100 text-green-800 text-xs p-2 rounded mb-3 flex items-center gap-2">
                        <AlertCircle className="h-3 w-3" />
                        Bundle complete! Great savings unlocked!
                      </div>
                    )}

                    <div className="space-y-2">
                      {bundle.items.map((item) => (
                        <div
                          key={`${item.productId}-${item.bundleId}`}
                          className="flex items-center gap-3 bg-white p-2 rounded"
                        >
                          {item.productImage && (
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {item.productName}
                            </p>
                            {item.size && (
                              <p className="text-xs text-gray-500 italic">
                                {item.size}
                              </p>
                            )}
                            <p className="text-xs text-gray-600">
                              {formatPrice(bundle.pricePerItem)} × {item.quantity} = {formatPrice(bundle.pricePerItem * item.quantity)}
                            </p>
                          </div>
                          <button
                            onClick={() => removeItem(item.productId, item.bundleId)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 pt-3 border-t flex justify-between items-center">
                      <div className="text-xs text-gray-600">
                        {formatPrice(bundle.pricePerItem)} × {bundle.currentQuantity} items
                      </div>
                      <div className="font-bold text-lg" style={{ color: 'var(--primary)' }}>
                        {formatPrice(bundle.calculatedTotal)}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Regular Items */}
                {items
                  .filter((item) => !item.bundleId)
                  .map((item, index) => (
                    <div
                      key={`${item.productId}-${item.size}-${item.color}-${index}`}
                      className="flex items-center gap-3 border rounded-lg p-3 bg-white"
                    >
                      {item.productImage && (
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{item.productName}</p>
                        {(item.size || item.color) && (
                          <p className="text-sm text-gray-500 italic">
                            {item.size && item.color ? `${item.size} | ${item.color}` : item.size || item.color}
                          </p>
                        )}
                        <p className="text-xs text-gray-600">
                          {formatPrice(item.price || item.productPrice || 0)} × {item.quantity} = {formatPrice((item.price || item.productPrice || 0) * item.quantity)}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId, undefined, item.size, item.color)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t p-4 space-y-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <Link href="/checkout" className="block">
                <Button
                  className="w-full"
                  size="lg"
                  disabled={incompleteBundles.length > 0}
                  onClick={() => setIsOpen(false)}
                >
                  Proceed to Checkout
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full"
                onClick={clearCart}
              >
                Clear Cart
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
