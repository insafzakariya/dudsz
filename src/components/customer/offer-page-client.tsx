"use client";

import { useState, useEffect } from "react";
import { CustomerNav } from "@/components/customer/customer-nav";
import { CartDrawer } from "@/components/customer/cart-drawer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import {
  Tag,
  ShoppingCart,
  ArrowLeft,
  CheckCircle2,
  Plus,
  Minus,
  ZoomIn,
  X,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/store/cart-store";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "next/navigation";

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
  name: string;
  code: string;
  price: number;
  images: string[];
  weight: number;
  enabled: boolean;
  hasVariants: boolean;
  category: {
    id: string;
    name: string;
  } | null;
  productVariants: ProductVariant[];
}

interface OfferPageClientProps {
  offer: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logic: string;
    quantity: number;
    price: number;
    offerProducts: Array<{
      id: string;
      selectedVariantOptionIds: string[];
      product: Product;
    }>;
  };
  config: {
    siteName: string;
    contactEmail: string | null;
  };
}

export function OfferPageClient({ offer, config }: OfferPageClientProps) {
  const [productQuantities, setProductQuantities] = useState<
    Map<string, number>
  >(new Map());
  // Map<productId, Map<variantTypeId, variantOptionId>>
  const [selectedVariants, setSelectedVariants] = useState<
    Map<string, Map<string, string>>
  >(new Map());
  const { addItem, getBundles, items, removeBundleItems } = useCartStore();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    productName: string;
  } | null>(null);

  // Get bundleId from URL if present (for adding to existing bundle)
  const searchParams = useSearchParams();
  const bundleIdFromUrl = searchParams.get('bundleId');
  const [existingBundleId, setExistingBundleId] = useState<string | null>(null);
  const [existingBundle, setExistingBundle] = useState<any>(null);

  useEffect(() => {
    if (bundleIdFromUrl) {
      console.log("Editing existing bundle:", bundleIdFromUrl);
      setExistingBundleId(bundleIdFromUrl);

      // Find the existing bundle from cart
      const bundles = getBundles();
      const bundle = bundles.find(b => b.bundleId === bundleIdFromUrl);

      if (bundle) {
        console.log("Found bundle with", bundle.currentQuantity, "items");
        setExistingBundle(bundle);

        // Pre-populate quantities from existing bundle items
        const quantities = new Map<string, number>();
        const variants = new Map<string, Map<string, string>>();

        bundle.items.forEach(item => {
          quantities.set(item.productId, item.quantity);

          // Parse variant info from size field (e.g., "Size: Large, Color: Red")
          if (item.size) {
            const offerProduct = offer.offerProducts.find(
              (op) => op.product.id === item.productId
            );

            if (offerProduct && offerProduct.product.hasVariants) {
              const productVariants = new Map<string, string>();

              // Split by comma to get individual variant selections
              const variantPairs = item.size.split(", ");

              variantPairs.forEach(pair => {
                // Split by colon to get type and value (e.g., "Size: Large")
                const [typeName, optionName] = pair.split(": ").map(s => s.trim());

                if (typeName && optionName) {
                  // Find the matching variant type and option IDs
                  const variant = offerProduct.product.productVariants.find(
                    pv =>
                      pv.variantOption.variantType.name === typeName &&
                      pv.variantOption.name === optionName
                  );

                  if (variant) {
                    productVariants.set(
                      variant.variantOption.variantType.id,
                      variant.variantOption.id
                    );
                  }
                }
              });

              if (productVariants.size > 0) {
                variants.set(item.productId, productVariants);
              }
            }
          }
        });

        setProductQuantities(quantities);
        setSelectedVariants(variants);
        console.log("Pre-populated variants:", variants);
      }
    }
  }, [bundleIdFromUrl, getBundles, offer.offerProducts]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedImage(null);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (selectedImage) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedImage]);

  // Check if all variants are selected for a product
  const areVariantsComplete = (productId: string): boolean => {
    const offerProduct = offer.offerProducts.find(
      (op) => op.product.id === productId
    );
    if (!offerProduct || !offerProduct.product.hasVariants) {
      return true; // No variants required
    }

    const variantTypes = getVariantsByType(offerProduct.product, offerProduct.selectedVariantOptionIds);
    const productVariants = selectedVariants.get(productId);
    return (
      productVariants !== undefined &&
      productVariants.size === variantTypes.length
    );
  };

  const updateQuantity = (productId: string, quantity: number) => {
    // For products with variants, check if all variants are selected
    if (quantity > 0) {
      const offerProduct = offer.offerProducts.find(
        (op) => op.product.id === productId
      );
      if (
        offerProduct &&
        offerProduct.product.hasVariants &&
        !areVariantsComplete(productId)
      ) {
        toast({
          title: "Please select variants first",
          description: `Select all variant options for ${offerProduct.product.name} before adding to cart`,
          variant: "destructive",
        });
        return;
      }
    }

    const newQuantities = new Map(productQuantities);
    if (quantity <= 0) {
      newQuantities.delete(productId);
    } else {
      newQuantities.set(productId, quantity);
    }
    setProductQuantities(newQuantities);
  };

  const incrementQuantity = (productId: string) => {
    const current = productQuantities.get(productId) || 0;
    updateQuantity(productId, current + 1);
  };

  const decrementQuantity = (productId: string) => {
    const current = productQuantities.get(productId) || 0;
    if (current > 0) {
      updateQuantity(productId, current - 1);
    }
  };

  const selectVariant = (
    productId: string,
    variantTypeId: string,
    variantOptionId: string
  ) => {
    const newVariants = new Map(selectedVariants);
    const productVariants = newVariants.get(productId) || new Map();
    productVariants.set(variantTypeId, variantOptionId);
    newVariants.set(productId, productVariants);
    setSelectedVariants(newVariants);
  };

  // Group variants by type for a product, filtered by admin's selection
  const getVariantsByType = (product: Product, selectedVariantOptionIds: string[]) => {
    const variantMap = new Map<
      string,
      { typeId: string; typeName: string; options: VariantOption[] }
    >();

    product.productVariants.forEach((pv) => {
      // Only include variants that were selected by admin
      // If no variants selected (empty array), show all variants
      if (selectedVariantOptionIds.length === 0 || selectedVariantOptionIds.includes(pv.variantOption.id)) {
        const typeId = pv.variantOption.variantType.id;
        const typeName = pv.variantOption.variantType.name;

        if (!variantMap.has(typeId)) {
          variantMap.set(typeId, { typeId, typeName, options: [] });
        }
        variantMap.get(typeId)!.options.push(pv.variantOption);
      }
    });

    return Array.from(variantMap.values());
  };

  const totalQuantity = Array.from(productQuantities.values()).reduce(
    (sum, qty) => sum + qty,
    0
  );
  const pricePerItem = offer.price / offer.quantity;
  const calculatedTotal = pricePerItem * totalQuantity;

  // Calculate average savings per item
  const avgRegularPrice =
    offer.offerProducts.reduce((sum, op) => sum + op.product.price, 0) /
    offer.offerProducts.length;
  const savingsPerItem = avgRegularPrice - pricePerItem;
  const totalSavings = savingsPerItem * totalQuantity;

  const handleAddToCart = () => {
    if (totalQuantity < offer.quantity) {
      toast({
        title: "Minimum quantity required",
        description: `Please select at least ${offer.quantity} items for this offer`,
        variant: "destructive",
      });
      return;
    }

    // Validate variants are selected for products with variants
    for (const [productId, quantity] of productQuantities.entries()) {
      if (quantity > 0) {
        const offerProduct = offer.offerProducts.find(
          (op) => op.product.id === productId
        );
        if (offerProduct && offerProduct.product.hasVariants) {
          const variantTypes = getVariantsByType(offerProduct.product, offerProduct.selectedVariantOptionIds);
          const productVariants = selectedVariants.get(productId);

          if (
            !productVariants ||
            productVariants.size !== variantTypes.length
          ) {
            toast({
              title: "Please select all variants",
              description: `Select all variant options for ${offerProduct.product.name}`,
              variant: "destructive",
            });
            return;
          }
        }
      }
    }

    setIsAdding(true);

    try {
      // Use existing bundleId if present, otherwise create new one
      const bundleId = existingBundleId || `${offer.id}-${Date.now()}`;

      console.log("Adding to cart with bundleId:", bundleId);
      console.log("Existing bundleId:", existingBundleId);
      console.log("Is editing:", !!existingBundleId);

      // If editing existing bundle, remove all old items first
      if (existingBundleId) {
        console.log("Removing old items from bundle:", existingBundleId);
        removeBundleItems(existingBundleId);
      }

      productQuantities.forEach((quantity, productId) => {
        const offerProduct = offer.offerProducts.find(
          (op) => op.product.id === productId
        );
        if (offerProduct && quantity > 0) {
          // Get selected variant info
          const productVariants = selectedVariants.get(productId);
          let variantInfo = "";

          if (productVariants && productVariants.size > 0) {
            const variantLabels: string[] = [];
            productVariants.forEach((optionId, typeId) => {
              const variant = offerProduct.product.productVariants.find(
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

          // Add product once with the selected quantity
          console.log("Adding item:", offerProduct.product.name, "with bundleId:", bundleId);
          addItem({
            productId: offerProduct.product.id,
            productCode: offerProduct.product.code,
            productName: offerProduct.product.name,
            productPrice: offerProduct.product.price,
            productImage: offerProduct.product.images[0] || "",
            weight: offerProduct.product.weight,
            quantity: quantity,
            size: variantInfo, // Store variant info in size field for display
            bundleId: bundleId,
            offerId: offer.id,
            offerName: offer.name,
            offerSlug: offer.slug,
            offerPrice: offer.price,
            offerQuantity: offer.quantity,
          });
        }
      });

      console.log("All items added. Final bundleId used:", bundleId);

      toast({
        title: existingBundleId ? "Items added to existing offer!" : "Bundle added to cart!",
        description: `${totalQuantity} items added to your cart (${formatPrice(
          calculatedTotal
        )})`,
      });

      // Reset selection and clear existingBundleId
      setProductQuantities(new Map());
      setSelectedVariants(new Map());

      // Clear the bundleId from URL after successful add
      if (existingBundleId) {
        window.history.replaceState({}, '', window.location.pathname);
        setExistingBundleId(null);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add bundle to cart",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNav siteName={config.siteName} />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 sm:mb-6 transition-colors text-sm sm:text-base"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Adding to existing bundle alert */}
        {existingBundleId && existingBundle && (
          <div className="mb-4 sm:mb-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm sm:text-base font-semibold text-blue-900 mb-1">
                  Editing Your Offer Bundle
                </p>
                <p className="text-xs sm:text-sm text-blue-700 mb-2">
                  You currently have <strong>{existingBundle.currentQuantity} of {existingBundle.requiredQuantity}</strong> items selected.
                  Add <strong>{existingBundle.requiredQuantity - existingBundle.currentQuantity} more</strong> to meet the minimum.
                </p>
                <p className="text-xs text-blue-600">
                  💡 Your previously selected items are shown below. Adjust quantities or add new items.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Offer Header */}
            <Card className="mb-3 sm:mb-6 overflow-hidden">
              <div
                className="h-1.5 sm:h-2"
                style={{ backgroundColor: "var(--primary)" }}
              />
              <CardContent className="pt-3 pb-3 sm:pt-6 sm:pb-6 px-3 sm:px-6">
                <div
                  className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-3"
                  style={{ color: "var(--primary)" }}
                >
                  <Tag className="h-4 w-4 sm:h-6 sm:w-6" />
                  <span className="font-semibold text-xs sm:text-lg">
                    SPECIAL OFFER
                  </span>
                </div>

                <h1 className="text-xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4">
                  {offer.name}
                </h1>

                {offer.description && (
                  <p className="text-gray-600 text-xs sm:text-base md:text-lg mb-3 sm:mb-6 line-clamp-2 sm:line-clamp-none">
                    {offer.description}
                  </p>
                )}

                <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2 sm:gap-6 p-2.5 sm:p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-[10px] sm:text-sm text-gray-500 mb-0.5 sm:mb-1">
                      Total Price
                    </p>
                    <p
                      className="text-base sm:text-3xl font-bold"
                      style={{ color: "var(--primary)" }}
                    >
                      {formatPrice(offer.price)}
                    </p>
                  </div>
                  <div className="hidden sm:block h-12 w-px bg-gray-300" />
                  <div>
                    <p className="text-[10px] sm:text-sm text-gray-500 mb-0.5 sm:mb-1">
                      Per Item
                    </p>
                    <p className="text-base sm:text-2xl font-semibold">
                      {formatPrice(pricePerItem)}
                    </p>
                  </div>
                  <div className="hidden sm:block h-12 w-px bg-gray-300" />
                  <div>
                    <p className="text-[10px] sm:text-sm text-gray-500 mb-0.5 sm:mb-1">
                      Min Qty
                    </p>
                    <p
                      className="text-base sm:text-2xl font-bold"
                      style={{ color: "var(--primary)" }}
                    >
                      {offer.quantity}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products Selection */}
            <Card>
              <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-xl sm:text-2xl font-bold">
                    Select Products ({totalQuantity})
                  </h2>
                  {totalQuantity >= offer.quantity && (
                    <span className="flex items-center gap-1 sm:gap-2 text-green-600 font-semibold text-sm sm:text-base">
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="hidden sm:inline">Ready!</span>
                      <span className="sm:hidden">✓</span>
                    </span>
                  )}
                </div>

                <p className="text-gray-600 mb-4 sm:mb-6 text-xs sm:text-sm md:text-base">
                  Select minimum {offer.quantity} items. You can select more for
                  additional savings!
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {offer.offerProducts.map((op) => {
                    const quantity = productQuantities.get(op.product.id) || 0;
                    const isSelected = quantity > 0;

                    // No cart highlighting on offer page
                    const isInCart = false;
                    const totalInCartForProduct = 0;

                    return (
                      <div
                        key={op.id}
                        className={`relative flex flex-col p-3 border-2 rounded-lg transition-all ${
                          isSelected
                            ? "border-[var(--primary)] bg-blue-50 shadow-md"
                            : isInCart
                            ? "border-green-400 bg-green-50 shadow-md"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {/* In Cart Badge */}
                        {isInCart && !isSelected && (
                          <div className="absolute -top-2 -right-2 z-10 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="bg-green-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-lg">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              <span>{totalInCartForProduct} in cart</span>
                            </div>
                          </div>
                        )}

                        {/* Product Header with Image */}
                        <div className="flex gap-3 mb-3">
                          {op.product.images[0] && (
                            <div
                              className={`relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 group cursor-pointer rounded-md ${
                                isInCart && !isSelected ? "ring-2 ring-green-400" : ""
                              }`}
                              onClick={() =>
                                setSelectedImage({
                                  url: op.product.images[0],
                                  productName: op.product.name,
                                })
                              }
                            >
                              <img
                                src={op.product.images[0]}
                                alt={op.product.name}
                                className="w-full h-full object-cover rounded-md"
                              />
                              <div className={`absolute inset-0 bg-opacity-0 active:bg-opacity-20 sm:group-hover:bg-opacity-40 transition-all duration-200 rounded-md flex items-center justify-center ${
                                isInCart && !isSelected ? "bg-green-500" : "bg-black"
                              }`}>
                                <ZoomIn className="h-5 w-5 sm:h-6 sm:w-6 text-white opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200" />
                              </div>
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <h3 className={`font-semibold text-sm sm:text-base mb-1 line-clamp-2 ${
                              isInCart && !isSelected ? "text-green-700" : ""
                            }`}>
                              {op.product.name}
                            </h3>
                            <p className={`text-xs ${isInCart && !isSelected ? "text-green-600" : "text-gray-500"}`}>
                              {op.product.category?.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs line-through text-gray-400">
                                {formatPrice(op.product.price)}
                              </span>
                              <span
                                className="text-sm font-bold"
                                style={{ color: isInCart && !isSelected ? "#059669" : "var(--primary)" }}
                              >
                                {formatPrice(pricePerItem)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Variant Selection */}
                        {op.product.hasVariants &&
                          op.product.productVariants.length > 0 && (
                            <div className="space-y-2 mb-3 pb-3 border-b">
                              <p className="text-xs font-semibold text-red-600">
                                ⚠️ Select options:
                              </p>
                              {getVariantsByType(op.product, op.selectedVariantOptionIds).map(
                                (variantType) => {
                                  const selectedOption = selectedVariants
                                    .get(op.product.id)
                                    ?.get(variantType.typeId);
                                  return (
                                    <div
                                      key={variantType.typeId}
                                      className="flex items-center gap-2"
                                    >
                                      {/* Variant Name */}
                                      <p className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                                        {variantType.typeName}:
                                      </p>

                                      {/* Options (same line) */}
                                      <div className="flex flex-nowrap gap-1.5 overflow-x-auto">
                                        {variantType.options.map((option) => {
                                          const isSelected =
                                            selectedOption === option.id;
                                          return (
                                            <label
                                              key={option.id}
                                              className={`cursor-pointer px-3 py-1.5 rounded-md border text-xs font-medium transition-all active:scale-95 ${
                                                isSelected
                                                  ? "border-[var(--primary)] bg-blue-100 text-[var(--primary)] shadow-sm"
                                                  : "border-gray-300 bg-white hover:border-gray-400"
                                              }`}
                                            >
                                              <input
                                                type="radio"
                                                name={`variant-${op.product.id}-${variantType.typeId}`}
                                                checked={isSelected}
                                                onChange={() =>
                                                  selectVariant(
                                                    op.product.id,
                                                    variantType.typeId,
                                                    option.id
                                                  )
                                                }
                                                className="sr-only"
                                              />
                                              {option.name}
                                            </label>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          )}

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => decrementQuantity(op.product.id)}
                              disabled={quantity === 0}
                              className={`h-9 w-9 p-0 touch-manipulation ${
                                isInCart && !isSelected ? "border-green-400 hover:bg-green-50" : ""
                              }`}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                              type="number"
                              min="0"
                              value={quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                updateQuantity(op.product.id, val);
                              }}
                              className={`h-9 w-14 text-center text-sm ${
                                isInCart && !isSelected ? "border-green-400 focus:ring-green-400" : ""
                              }`}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => incrementQuantity(op.product.id)}
                              className={`h-9 w-9 p-0 touch-manipulation ${
                                isInCart && !isSelected ? "border-green-400 hover:bg-green-50" : ""
                              }`}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          {isInCart && !isSelected && (
                            <span className="text-[10px] font-semibold text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Already added
                            </span>
                          )}
                          {quantity > 0 && (
                            <span className="text-xs font-semibold text-gray-700">
                              = {formatPrice(pricePerItem * quantity)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Hidden on mobile, shown on desktop */}
          <div className="hidden lg:block">
            <div className="sticky top-8">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-bold mb-4">Bundle Summary</h3>

                  {/* Selected Products with Variants */}
                  {totalQuantity > 0 && (
                    <div className="mb-4 space-y-2 pb-4 border-b">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                        Selected Items:
                      </p>
                      {Array.from(productQuantities.entries()).map(
                        ([productId, qty]) => {
                          if (qty === 0) return null;
                          const offerProduct = offer.offerProducts.find(
                            (op) => op.product.id === productId
                          );
                          if (!offerProduct) return null;

                          // Get selected variants
                          const productVariants =
                            selectedVariants.get(productId);
                          let variantLabels: string[] = [];

                          if (productVariants && productVariants.size > 0) {
                            productVariants.forEach((optionId) => {
                              const variant =
                                offerProduct.product.productVariants.find(
                                  (pv) => pv.variantOption.id === optionId
                                );
                              if (variant) {
                                variantLabels.push(
                                  `${variant.variantOption.name}`
                                );
                              }
                            });
                          }

                          return (
                            <div key={productId} className="text-sm">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-700">
                                    {offerProduct.product.name}
                                  </p>
                                  {variantLabels.length > 0 && (
                                    <p className="text-xs text-gray-500 italic">
                                      {variantLabels.join(", ")}
                                    </p>
                                  )}
                                </div>
                                <span
                                  className="font-semibold ml-2"
                                  style={{ color: "var(--primary)" }}
                                >
                                  ×{qty}
                                </span>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Available products:</span>
                      <span className="font-semibold">
                        {offer.offerProducts.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total quantity:</span>
                      <span
                        className="font-bold"
                        style={{
                          color:
                            totalQuantity >= offer.quantity
                              ? "var(--primary)"
                              : "inherit",
                        }}
                      >
                        {totalQuantity} / {offer.quantity} min
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price per item:</span>
                      <span className="font-semibold">
                        {formatPrice(pricePerItem)}
                      </span>
                    </div>
                    <div className="pt-3 border-t">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Subtotal:</span>
                        <span
                          className="text-2xl font-bold"
                          style={{ color: "var(--primary)" }}
                        >
                          {formatPrice(calculatedTotal)}
                        </span>
                      </div>
                      {totalSavings > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Total savings:
                          </span>
                          <span className="text-lg font-bold text-green-600">
                            {formatPrice(totalSavings)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleAddToCart}
                    disabled={totalQuantity < offer.quantity || isAdding}
                    className="w-full"
                    size="lg"
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    {isAdding
                      ? "Adding..."
                      : totalQuantity < offer.quantity
                      ? `Add ${offer.quantity - totalQuantity} More Items`
                      : "Add to Cart"}
                  </Button>

                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-600 text-center">
                      💡 You can add this offer multiple times with different
                      product combinations!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Bottom Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-30 safe-area-inset-bottom">
          <div className="px-3 py-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1">
                <p className="text-xs text-gray-500">Total Quantity</p>
                <p
                  className="text-lg font-bold"
                  style={{
                    color:
                      totalQuantity >= offer.quantity
                        ? "var(--primary)"
                        : "inherit",
                  }}
                >
                  {totalQuantity} / {offer.quantity} min
                </p>
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Subtotal</p>
                <p
                  className="text-lg font-bold"
                  style={{ color: "var(--primary)" }}
                >
                  {formatPrice(calculatedTotal)}
                </p>
              </div>
            </div>
            <Button
              onClick={handleAddToCart}
              disabled={totalQuantity < offer.quantity || isAdding}
              className="w-full h-12 text-base font-semibold touch-manipulation"
              size="lg"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              {isAdding
                ? "Adding..."
                : totalQuantity < offer.quantity
                ? `Add ${offer.quantity - totalQuantity} More`
                : "Add to Cart"}
            </Button>
          </div>
        </div>

        {/* Add padding to bottom on mobile to account for sticky bar */}
        <div className="lg:hidden h-32" />
      </main>

      {/* Footer */}
      <footer
        className="mt-20 py-8 text-white"
        style={{ backgroundColor: "var(--secondary)" }}
      >
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2024 {config.siteName}. All rights reserved.</p>
          {config.contactEmail && (
            <p className="mt-2 text-sm opacity-75">{config.contactEmail}</p>
          )}
        </div>
      </footer>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black bg-opacity-90 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[95vh] sm:max-h-[90vh] animate-in fade-in zoom-in duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 sm:-top-12 right-0 text-white hover:text-gray-300 transition-colors touch-manipulation"
              aria-label="Close"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm hidden sm:inline">
                  Press ESC or tap outside
                </span>
                <X className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
            </button>

            {/* Product Name */}
            <div className="absolute -top-10 sm:-top-12 left-0 text-white">
              <h3 className="text-base sm:text-xl font-semibold truncate max-w-[70vw]">
                {selectedImage.productName}
              </h3>
            </div>

            {/* Image Container */}
            <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
              <img
                src={selectedImage.url}
                alt={selectedImage.productName}
                className="w-full h-auto max-h-[80vh] sm:max-h-[85vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}

      <CartDrawer />
    </div>
  );
}
