import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  productCode?: string;
  productName: string;
  productImage: string;
  productPrice: number; // Original product price
  price?: number; // For backward compatibility
  size?: string;
  color?: string;
  weight: number;
  quantity: number;
  offerId?: string;
  offerSlug?: string;
  offerName?: string;
  bundleId?: string; // Groups items in the same bundle
  offerPrice?: number; // Total price for the required quantity
  offerQuantity?: number; // Required quantity for the offer
}

export interface BundleGroup {
  bundleId: string;
  offerId: string;
  offerSlug: string;
  offerName: string;
  offerLogic: string;
  requiredQuantity: number;
  offerPrice: number; // Price for required quantity
  calculatedTotal: number; // Actual total based on selected items
  pricePerItem: number; // offerPrice / requiredQuantity
  items: CartItem[];
  isComplete: boolean;
  currentQuantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, bundleId?: string, size?: string, color?: string) => void;
  removeBundleItems: (bundleId: string) => void;
  updateItemQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  getBundles: () => BundleGroup[];
  getRegularItems: () => CartItem[];
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getTotalWeight: () => number;
  getIncompleteBundles: () => BundleGroup[];
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          // Check if item already exists with same attributes
          const existingItemIndex = state.items.findIndex(
            (i) =>
              i.productId === item.productId &&
              i.size === item.size &&
              i.color === item.color &&
              i.bundleId === item.bundleId
          );

          if (existingItemIndex !== -1) {
            // Item already exists
            // For regular items (no bundleId), add quantities together
            // For bundle items, don't add duplicate
            if (!item.bundleId) {
              const updatedItems = [...state.items];
              updatedItems[existingItemIndex] = {
                ...updatedItems[existingItemIndex],
                quantity: updatedItems[existingItemIndex].quantity + item.quantity,
              };
              return { items: updatedItems };
            }
            // For bundle items, don't add duplicate
            return state;
          }

          return { items: [...state.items, item] };
        });
      },

      removeItem: (productId, bundleId, size, color) => {
        set((state) => ({
          items: state.items.filter((item) => {
            if (bundleId) {
              return !(item.productId === productId && item.bundleId === bundleId);
            }
            // For regular items, match on productId + size + color
            if (size !== undefined || color !== undefined) {
              return !(
                item.productId === productId &&
                item.size === size &&
                item.color === color &&
                !item.bundleId
              );
            }
            // Fallback: remove all items with this productId (no bundleId)
            return !(item.productId === productId && !item.bundleId);
          }),
        }));
      },

      removeBundleItems: (bundleId) => {
        set((state) => ({
          items: state.items.filter((item) => item.bundleId !== bundleId),
        }));
      },

      updateItemQuantity: (productId, size, color, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter(
                (item) =>
                  !(
                    item.productId === productId &&
                    item.size === size &&
                    item.color === color
                  )
              ),
            };
          }

          const existingItemIndex = state.items.findIndex(
            (item) =>
              item.productId === productId &&
              item.size === size &&
              item.color === color
          );

          if (existingItemIndex === -1) return state;

          const updatedItems = [...state.items];
          // For quantity updates, we might need to duplicate items
          // For now, we'll keep it simple and not support quantity directly
          return state;
        });
      },

      clearCart: () => set({ items: [] }),

      getBundles: () => {
        const state = get();
        const bundleMap = new Map<string, BundleGroup>();

        state.items.forEach((item) => {
          if (item.bundleId && item.offerId && item.offerPrice && item.offerQuantity) {
            if (!bundleMap.has(item.bundleId)) {
              const pricePerItem = item.offerPrice / item.offerQuantity;
              bundleMap.set(item.bundleId, {
                bundleId: item.bundleId,
                offerId: item.offerId,
                offerSlug: item.offerSlug || '',
                offerName: item.offerName || '',
                offerLogic: item.offerName || '',
                requiredQuantity: item.offerQuantity,
                offerPrice: item.offerPrice,
                pricePerItem: pricePerItem,
                calculatedTotal: 0, // Will be calculated
                items: [],
                isComplete: false,
                currentQuantity: 0,
              });
            }

            const bundle = bundleMap.get(item.bundleId)!;
            bundle.items.push(item);
            // Sum up quantities instead of counting items
            bundle.currentQuantity = bundle.items.reduce((sum, i) => sum + i.quantity, 0);
            // Calculate total as (offerPrice / offerQuantity) * totalQuantity
            bundle.calculatedTotal = bundle.pricePerItem * bundle.currentQuantity;
            bundle.isComplete = bundle.currentQuantity >= bundle.requiredQuantity;
          }
        });

        return Array.from(bundleMap.values());
      },

      getRegularItems: () => {
        const state = get();
        return state.items.filter((item) => !item.bundleId);
      },

      getTotalItems: () => {
        const state = get();
        return state.items.length;
      },

      getTotalPrice: () => {
        const state = get();
        const bundles = get().getBundles();
        let total = 0;

        // Calculate bundle prices using dynamic pricing
        bundles.forEach((bundle) => {
          total += bundle.calculatedTotal;
        });

        // Add regular items
        const regularItems = get().getRegularItems();
        regularItems.forEach((item) => {
          total += (item.price || item.productPrice || 0) * item.quantity;
        });

        return total;
      },

      getTotalWeight: () => {
        const state = get();
        return state.items.reduce((total, item) => total + (item.weight * item.quantity), 0);
      },

      getIncompleteBundles: () => {
        const bundles = get().getBundles();
        return bundles.filter((bundle) => !bundle.isComplete);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
