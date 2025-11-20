'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCartStore } from '@/store/cart-store';
import { formatPrice } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, ShoppingBag, User, Phone, Mail, MapPin, Package, CreditCard, CheckCircle2, Truck } from 'lucide-react';
import Link from 'next/link';

interface City {
  id: string;
  name: string;
  shippingCost: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [isLoading, setIsLoading] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [mounted, setMounted] = useState(false);

  const [formData, setFormData] = useState({
    customerName: '',
    customerMobile: '',
    customerEmail: '',
    customerAddress: '',
    cityId: '',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Fetch cities
    fetch('/api/public/cities')
      .then((res) => res.json())
      .then((data) => setCities(data))
      .catch((error) => console.error('Error loading cities:', error));
  }, []);

  // Redirect if cart is empty
  useEffect(() => {
    if (mounted && items.length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Please add items to your cart before checkout',
        variant: 'destructive',
      });
      router.push('/');
    }
  }, [items, mounted, router, toast]);

  const selectedCity = cities.find((c) => c.id === formData.cityId);
  const subtotal = getTotalPrice();
  const shippingCost = selectedCity?.shippingCost || 0;
  const total = subtotal + shippingCost;

  // Separate bundle items and direct items
  const bundleItems = items.filter(item => item.bundleId);
  const directItems = items.filter(item => !item.bundleId);

  // Group bundle items by bundleId and bundleName
  const bundleGroups = bundleItems.reduce((acc, item) => {
    const key = item.bundleId || 'unknown';
    if (!acc[key]) {
      // Calculate pricePerItem just like the cart store does
      const pricePerItem = (item.offerPrice && item.offerQuantity)
        ? item.offerPrice / item.offerQuantity
        : 0;

      acc[key] = {
        bundleId: item.bundleId,
        bundleName: item.offerName || 'Bundle Offer',
        bundlePrice: item.offerPrice,
        pricePerItem: pricePerItem,
        items: [],
        totalQuantity: 0,
        totalPrice: 0,
      };
    }
    acc[key].items.push(item);
    acc[key].totalQuantity += item.quantity;
    // Use pricePerItem from the bundle, not individual item price
    acc[key].totalPrice = acc[key].pricePerItem * (acc[key].totalQuantity);
    return acc;
  }, {} as Record<string, any>);

  const bundles = Object.values(bundleGroups);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.customerName || !formData.customerMobile || !formData.customerAddress || !formData.cityId) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items: items.map((item) => {
            // For bundle items, calculate pricePerItem from offerPrice/offerQuantity
            // For regular items, use the product price
            let itemPrice = item.price || item.productPrice;
            if (item.bundleId && item.offerPrice && item.offerQuantity) {
              itemPrice = item.offerPrice / item.offerQuantity;
            }

            return {
              productId: item.productId,
              quantity: item.quantity,
              size: item.size,
              color: item.color,
              price: itemPrice,
              bundleId: item.bundleId,
              bundleName: item.offerName,
              bundlePrice: item.offerPrice,
              bundleQuantity: item.offerQuantity,
            };
          }),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        clearCart();
        toast({
          title: 'Order placed successfully!',
          description: `Your order number is ${data.orderNumber}. We'll contact you soon.`,
          duration: 5000,
        });
        router.push('/');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to place order');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to place order',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-medium">Continue Shopping</span>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium hidden sm:inline">Cart</span>
            </div>
            <div className="w-12 sm:w-20 h-1 bg-blue-600"></div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                <Package className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium hidden sm:inline">Checkout</span>
            </div>
            <div className="w-12 sm:w-20 h-1 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 font-semibold">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-gray-500 hidden sm:inline">Complete</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <User className="h-5 w-5 text-blue-600" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="customerName" className="text-sm font-semibold flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        Full Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="customerName"
                        value={formData.customerName}
                        onChange={(e) =>
                          setFormData({ ...formData, customerName: e.target.value })
                        }
                        required
                        placeholder="John Doe"
                        className="h-11 border-2 focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customerMobile" className="text-sm font-semibold flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        Phone Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="customerMobile"
                        type="tel"
                        value={formData.customerMobile}
                        onChange={(e) =>
                          setFormData({ ...formData, customerMobile: e.target.value })
                        }
                        required
                        placeholder="07xxxxxxxx"
                        className="h-11 border-2 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerEmail" className="text-sm font-semibold flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      Email <span className="text-gray-400 text-xs">(Optional)</span>
                    </Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, customerEmail: e.target.value })
                      }
                      placeholder="your.email@example.com"
                      className="h-11 border-2 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  {/* Delivery Information */}
                  <div className="pt-6 border-t">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Truck className="h-5 w-5 text-blue-600" />
                      Delivery Information
                    </h3>

                    <div className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="customerAddress" className="text-sm font-semibold flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          Delivery Address <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id="customerAddress"
                          value={formData.customerAddress}
                          onChange={(e) =>
                            setFormData({ ...formData, customerAddress: e.target.value })
                          }
                          required
                          placeholder="House number, street name, area..."
                          rows={3}
                          className="border-2 focus:border-blue-500 transition-colors resize-none"
                        />
                        <p className="text-xs text-gray-500">
                          Please provide a complete address including landmarks
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cityId" className="text-sm font-semibold flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          City <span className="text-red-500">*</span>
                        </Label>
                        <select
                          id="cityId"
                          value={formData.cityId}
                          onChange={(e) =>
                            setFormData({ ...formData, cityId: e.target.value })
                          }
                          required
                          className="w-full h-11 px-4 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                        >
                          <option value="">Select your city</option>
                          {cities.map((city) => (
                            <option key={city.id} value={city.id}>
                              {city.name} - {formatPrice(city.shippingCost)} shipping
                            </option>
                          ))}
                        </select>
                        {selectedCity && (
                          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Shipping cost: {formatPrice(selectedCity.shippingCost)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t">
                    <Button
                      type="submit"
                      className="w-full h-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                      size="lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5" />
                          Place Order - {formatPrice(total || 0)}
                        </span>
                      )}
                    </Button>
                    <p className="text-center text-xs text-gray-500 mt-3">
                      By placing your order, you agree to our terms and conditions
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <ShoppingBag className="h-5 w-5 text-green-600" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {/* Items Count Badge */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-blue-50 text-blue-700 px-4 py-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <span className="text-sm font-semibold">
                      {items.length} Item{items.length > 1 ? 's' : ''} in Cart
                    </span>
                  </div>
                  {bundles.length > 0 && (
                    <span className="text-xs bg-white px-2 py-1 rounded-full font-medium">
                      {bundles.length} Bundle{bundles.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Items - Organized by Bundles and Direct Items */}
                <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                  {/* Bundle Offers Section */}
                  {bundles.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 sticky top-0 bg-white pb-2">
                        <div className="flex-1 border-b border-gray-300"></div>
                        <span className="px-2">🎁 Bundle Offers</span>
                        <div className="flex-1 border-b border-gray-300"></div>
                      </div>

                      {bundles.map((bundle, index) => (
                        <div
                          key={bundle.bundleId || index}
                          className="border-2 border-blue-200 rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50"
                        >
                          {/* Bundle Header */}
                          <div className="bg-blue-600 text-white px-3 py-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              <span className="text-sm font-semibold">{bundle.bundleName}</span>
                            </div>
                            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                              {bundle.totalQuantity} items
                            </span>
                          </div>

                          {/* Bundle Items */}
                          <div className="p-2 space-y-2">
                            {bundle.items.map((item: any) => (
                              <div
                                key={item.id}
                                className="flex gap-2 p-2 bg-white rounded-md"
                              >
                                {item.productImage && (
                                  <img
                                    src={item.productImage}
                                    alt={item.productName}
                                    className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded shadow-sm flex-shrink-0"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-xs sm:text-sm truncate text-gray-900">
                                    {item.productName}
                                  </p>
                                  {item.size && (
                                    <p className="text-gray-600 text-xs">{item.size}</p>
                                  )}
                                  <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs text-gray-500">
                                      Qty: {item.quantity || 0}
                                    </span>
                                    <span className="text-xs sm:text-sm font-bold text-blue-600">
                                      {formatPrice((bundle.pricePerItem * (item.quantity || 0)))}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Bundle Total */}
                          <div className="bg-blue-100 px-3 py-2 flex items-center justify-between border-t-2 border-blue-200">
                            <span className="text-sm font-semibold text-blue-900">Bundle Total:</span>
                            <span className="text-base font-bold text-blue-700">
                              {formatPrice(bundle.totalPrice || 0)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Direct Items Section */}
                  {directItems.length > 0 && (
                    <div className="space-y-3">
                      {bundles.length > 0 && (
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 pt-2">
                          <div className="flex-1 border-b border-gray-300"></div>
                          <span className="px-2">🛍️ Individual Items</span>
                          <div className="flex-1 border-b border-gray-300"></div>
                        </div>
                      )}

                      {directItems.map((item) => (
                        <div
                          key={item.productId}
                          className="flex gap-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:from-gray-100 hover:to-gray-150 transition-colors border border-gray-200"
                        >
                          {item.productImage && (
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-md shadow-sm flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate text-gray-900">
                              {item.productName}
                            </p>
                            {item.size && (
                              <p className="text-gray-600 text-xs mt-1">{item.size}</p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-500">
                                Qty: {item.quantity || 0}
                              </span>
                              <span className="text-sm sm:text-base font-bold" style={{ color: 'var(--primary)' }}>
                                {formatPrice(((item.price || item.productPrice || 0) * (item.quantity || 0)))}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-medium">Subtotal:</span>
                    <span className="font-bold text-gray-900 text-base">{formatPrice(subtotal || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-medium flex items-center gap-1">
                      <Truck className="h-4 w-4" />
                      Shipping:
                    </span>
                    <span className="font-bold">
                      {selectedCity ? (
                        <span className="text-green-600 text-base">
                          {formatPrice(shippingCost || 0)}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Select city</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-3 border-t bg-gradient-to-r from-blue-50 to-indigo-50 -mx-6 px-6 py-3 rounded-lg">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-2xl" style={{ color: 'var(--primary)' }}>{formatPrice(total || 0)}</span>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="pt-4 border-t space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Secure checkout</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Fast delivery</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Quality guaranteed</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
