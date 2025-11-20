'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { formatPrice } from '@/lib/utils';
import {
  ArrowLeft,
  Package,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  User,
  Upload,
  FileImage,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerMobile: string;
  customerEmail: string | null;
  customerAddress: string;
  total: number;
  subtotal: number;
  shippingCost: number;
  discount: number;
  status: string;
  trackingCode: string | null;
  packageImage: string | null;
  createdAt: string;
  updatedAt: string;
  items: {
    id: string;
    quantity: number;
    price: number;
    size: string | null;
    bundleId: string | null;
    bundleName: string | null;
    bundlePrice: number | null;
    bundleQuantity: number | null;
    product: {
      id: string;
      name: string;
      images: string[];
      code: string;
    };
  }[];
  city: {
    id: string;
    name: string;
  };
  activities: {
    id: string;
    action: string;
    description: string;
    createdAt: string;
    createdBy: string | null;
    metadata?: any;
  }[];
}

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [itemsToRemove, setItemsToRemove] = useState<string[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [itemsToAdd, setItemsToAdd] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentlyAddedItemIds, setRecentlyAddedItemIds] = useState<string[]>([]);
  const [showOngoingDialog, setShowOngoingDialog] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const [packageImage, setPackageImage] = useState<File | null>(null);
  const [packageImagePreview, setPackageImagePreview] = useState<string>('');
  const [ongoingNote, setOngoingNote] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  const fetchOrder = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/orders/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data);

        // Extract recently added items from the most recent ORDER_EDITED activity
        const recentActivity = data.activities?.find(
          (activity: any) => activity.action === 'ORDER_EDITED' && activity.metadata?.addedItems
        );

        if (recentActivity && recentActivity.metadata?.addedItems) {
          const addedIds = recentActivity.metadata.addedItems.map((item: any) => item.itemId);
          setRecentlyAddedItemIds(addedIds);
        } else {
          setRecentlyAddedItemIds([]);
        }
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch order details',
          variant: 'destructive',
        });
        router.push('/admin/orders');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch order details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPackageImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPackageImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPackageImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    return data.url;
  };

  const handleMarkAsOngoing = async () => {
    setIsUpdating(true);
    setIsUploadingImage(true);

    try {
      let imageUrl = '';

      // Upload image if provided
      if (packageImage) {
        imageUrl = await uploadPackageImage(packageImage);
      }

      const response = await fetch(`/api/admin/orders/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ONGOING',
          trackingCode: trackingCode || null,
          packageImage: imageUrl || null,
          note: ongoingNote || null,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Order marked as ongoing',
        });
        setShowOngoingDialog(false);
        setTrackingCode('');
        setPackageImage(null);
        setPackageImagePreview('');
        setOngoingNote('');
        fetchOrder();
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update order status',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
      setIsUploadingImage(false);
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Order status updated to ${newStatus}`,
        });
        fetchOrder();
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleRemoveItem = (itemId: string) => {
    if (itemsToRemove.includes(itemId)) {
      setItemsToRemove(itemsToRemove.filter(id => id !== itemId));
    } else {
      setItemsToRemove([...itemsToRemove, itemId]);
    }
  };

  const cancelEdit = () => {
    setIsEditMode(false);
    setItemsToRemove([]);
    setItemsToAdd([]);
    setShowAddProduct(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const searchProducts = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/admin/products/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Search results:', data);
        setSearchResults(data);
      } else {
        const errorData = await response.json();
        console.error('Search API error:', errorData);
        toast({
          title: 'Search Error',
          description: `Failed to search products: ${errorData.error || 'Unknown error'}`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error searching products:', error);
      toast({
        title: 'Search Error',
        description: 'Failed to search products. Check console for details.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const addProductToOrder = (product: any, productVariant?: any) => {
    const newItem = {
      id: `new-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      productImage: product.images[0],
      price: product.price,
      quantity: 1,
      size: productVariant?.variantOption?.name || null,
    };

    setItemsToAdd([...itemsToAdd, newItem]);
    setShowAddProduct(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeNewItem = (itemId: string) => {
    setItemsToAdd(itemsToAdd.filter(item => item.id !== itemId));
  };

  const updateNewItemQuantity = (itemId: string, quantity: number) => {
    setItemsToAdd(itemsToAdd.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    ));
  };

  const updateNewItemPrice = (itemId: string, price: number) => {
    setItemsToAdd(itemsToAdd.map(item =>
      item.id === itemId ? { ...item, price } : item
    ));
  };

  const saveChanges = async () => {
    if (itemsToRemove.length === 0 && itemsToAdd.length === 0) {
      toast({
        title: 'No changes',
        description: 'No changes to save',
      });
      return;
    }

    const changes = [];
    if (itemsToRemove.length > 0) changes.push(`remove ${itemsToRemove.length} item(s)`);
    if (itemsToAdd.length > 0) changes.push(`add ${itemsToAdd.length} item(s)`);

    if (!confirm(`Are you sure you want to ${changes.join(' and ')}?`)) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/orders/${params.id}/update-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemsToRemove,
          itemsToAdd: itemsToAdd.map(item => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            size: item.size,
            price: item.price,
          })),
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Order updated successfully',
        });
        setItemsToRemove([]);
        setItemsToAdd([]);
        setIsEditMode(false);
        fetchOrder();
      } else {
        throw new Error('Failed to update order');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update order',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  // Group bundles by bundleId
  const bundleMap = new Map<string, any>();

  order.items.forEach((item) => {
    if (item.bundleId) {
      if (!bundleMap.has(item.bundleId)) {
        bundleMap.set(item.bundleId, {
          bundleId: item.bundleId,
          bundleName: item.bundleName,
          pricePerItem: item.price, // This is already the pricePerItem
          items: [],
          totalQuantity: 0,
          totalPrice: 0,
        });
      }

      const bundle = bundleMap.get(item.bundleId)!;
      bundle.items.push(item);
      bundle.totalQuantity += item.quantity;
      bundle.totalPrice += item.price * item.quantity;
    }
  });

  const bundles = Array.from(bundleMap.values());

  // Regular items (without bundleId)
  const directItems = order.items.filter((item) => !item.bundleId);

  const statusConfig = {
    PENDING: { color: 'yellow', icon: Clock, label: 'Pending' },
    ONGOING: { color: 'orange', icon: Package, label: 'Ongoing' },
    DELIVERED: { color: 'green', icon: CheckCircle, label: 'Delivered' },
    CANCELLED: { color: 'red', icon: XCircle, label: 'Cancelled' },
  };

  const currentStatus = statusConfig[order.status as keyof typeof statusConfig];
  const StatusIcon = currentStatus?.icon || Clock;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/orders">
          <Button variant="ghost" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Button>
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Order Details</h1>
            <p className="text-gray-600">Order #{order.orderNumber}</p>
          </div>
          <div className="flex items-center gap-3">
            {order.status === 'PENDING' && !isEditMode && (
              <Button
                variant="outline"
                onClick={() => setIsEditMode(true)}
                className="gap-2"
              >
                <Package className="h-4 w-4" />
                Edit Order
              </Button>
            )}
            {isEditMode && (
              <>
                <Button
                  variant="default"
                  onClick={saveChanges}
                  disabled={isSaving || (itemsToRemove.length === 0 && itemsToAdd.length === 0)}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4" />
                  Save Changes
                  {(itemsToRemove.length > 0 || itemsToAdd.length > 0) &&
                    ` (${itemsToAdd.length > 0 ? `+${itemsToAdd.length}` : ''}${itemsToAdd.length > 0 && itemsToRemove.length > 0 ? '/' : ''}${itemsToRemove.length > 0 ? `-${itemsToRemove.length}` : ''})`
                  }
                </Button>
                <Button
                  variant="outline"
                  onClick={cancelEdit}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </>
            )}
            <StatusIcon className="h-6 w-6" style={{ color: getStatusColor(order.status) }} />
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                order.status === 'PENDING'
                  ? 'bg-yellow-100 text-yellow-800'
                  : order.status === 'ONGOING'
                  ? 'bg-orange-100 text-orange-800'
                  : order.status === 'DELIVERED'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {currentStatus?.label || order.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Order Items ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Bundle Offers Section */}
              {bundles.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <div className="flex-1 border-b border-gray-300"></div>
                    <span className="px-2">🎁 Bundle Offers</span>
                    <div className="flex-1 border-b border-gray-300"></div>
                  </div>

                  {bundles.map((bundle) => (
                    <div
                      key={bundle.bundleId}
                      className="border-2 border-blue-200 rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50"
                    >
                      {/* Bundle Header */}
                      <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          <span className="font-semibold">{bundle.bundleName}</span>
                        </div>
                        <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                          {bundle.totalQuantity} items
                        </span>
                      </div>

                      {/* Bundle Items */}
                      <div className="p-4 space-y-3">
                        {bundle.items.map((item: any) => {
                          const isMarkedForRemoval = itemsToRemove.includes(item.id);
                          const isRecentlyAdded = recentlyAddedItemIds.includes(item.id);
                          return (
                            <div
                              key={item.id}
                              className={`flex gap-4 p-3 bg-white rounded-lg shadow-sm transition-all ${
                                isMarkedForRemoval ? 'opacity-50 bg-red-50 border-2 border-red-300' : ''
                              } ${
                                isRecentlyAdded && !isMarkedForRemoval ? 'border-2 border-green-300 bg-green-50' : ''
                              }`}
                            >
                              {item.product.images[0] && (
                                <img
                                  src={item.product.images[0]}
                                  alt={item.product.name}
                                  className={`w-16 h-16 object-cover rounded-md ${isMarkedForRemoval ? 'grayscale' : ''}`}
                                />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className={`font-semibold ${isMarkedForRemoval ? 'line-through' : ''}`}>
                                    {item.product.name}
                                  </h3>
                                  {isMarkedForRemoval && (
                                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                                      REMOVE
                                    </span>
                                  )}
                                  {isRecentlyAdded && !isMarkedForRemoval && (
                                    <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                                      NEW
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">Code: {item.product.code}</p>
                                {item.size && (
                                  <p className="text-sm text-gray-600">Size: {item.size}</p>
                                )}
                                <p className="text-xs text-gray-600 mt-1">
                                  {formatPrice(item.price)} × {item.quantity} = {formatPrice(item.price * item.quantity)}
                                </p>
                              </div>
                              {isEditMode && (
                                <Button
                                  variant={isMarkedForRemoval ? 'outline' : 'destructive'}
                                  size="sm"
                                  onClick={() => toggleRemoveItem(item.id)}
                                >
                                  {isMarkedForRemoval ? 'Undo' : 'Remove'}
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Bundle Total */}
                      <div className="bg-blue-100 px-4 py-3 flex items-center justify-between border-t-2 border-blue-200">
                        <span className="text-sm font-semibold text-blue-900">Bundle Total:</span>
                        <span className="text-lg font-bold text-blue-700">
                          {formatPrice(bundle.totalPrice)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Direct Items Section */}
              {directItems.length > 0 && (
                <div className="space-y-4">
                  {bundles.length > 0 && (
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <div className="flex-1 border-b border-gray-300"></div>
                      <span className="px-2">🛍️ Individual Items</span>
                      <div className="flex-1 border-b border-gray-300"></div>
                    </div>
                  )}

                  {directItems.map((item) => {
                    const isMarkedForRemoval = itemsToRemove.includes(item.id);
                    const isRecentlyAdded = recentlyAddedItemIds.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        className={`flex gap-4 pb-4 border-b last:border-b-0 p-3 bg-gray-50 rounded-lg transition-all ${
                          isMarkedForRemoval ? 'opacity-50 bg-red-50 border-2 border-red-300' : ''
                        } ${
                          isRecentlyAdded && !isMarkedForRemoval ? 'border-2 border-green-300 bg-green-50' : ''
                        }`}
                      >
                        {item.product.images[0] && (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className={`w-20 h-20 object-cover rounded-lg shadow-md ${isMarkedForRemoval ? 'grayscale' : ''}`}
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-semibold text-lg ${isMarkedForRemoval ? 'line-through' : ''}`}>
                              {item.product.name}
                            </h3>
                            {isMarkedForRemoval && (
                              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                                REMOVE
                              </span>
                            )}
                            {isRecentlyAdded && !isMarkedForRemoval && (
                              <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                                NEW
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">Code: {item.product.code}</p>
                          {item.size && (
                            <p className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">Size:</span> {item.size}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Quantity:</span> {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Unit Price</p>
                          <p className="font-semibold text-lg">{formatPrice(item.price)}</p>
                          <p className="text-sm text-gray-600 mt-2">
                            <span className="font-medium">Subtotal:</span>{' '}
                            {formatPrice(item.price * item.quantity)}
                          </p>
                          {isEditMode && (
                            <Button
                              variant={isMarkedForRemoval ? 'outline' : 'destructive'}
                              size="sm"
                              onClick={() => toggleRemoveItem(item.id)}
                              className="mt-2"
                            >
                              {isMarkedForRemoval ? 'Undo' : 'Remove'}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* New Items to Add */}
              {isEditMode && itemsToAdd.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-green-700 pt-4 bg-green-50 px-4 py-2 rounded-lg">
                    <div className="flex-1 border-b-2 border-green-300"></div>
                    <span className="px-2 text-base">➕ Items to Add ({itemsToAdd.length})</span>
                    <div className="flex-1 border-b-2 border-green-300"></div>
                  </div>

                  {itemsToAdd.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 pb-4 border-b last:border-b-0 p-3 bg-green-50 rounded-lg border-2 border-green-300"
                    >
                      {item.productImage && (
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-20 h-20 object-cover rounded-lg shadow-md"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{item.productName}</h3>
                          <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                            NEW
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">Code: {item.productCode}</p>
                        {item.size && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Size:</span> {item.size}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">Quantity:</label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateNewItemQuantity(item.id, parseInt(e.target.value) || 1)}
                              className="w-20 px-2 py-1 border rounded"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">Price:</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.price}
                              onChange={(e) => updateNewItemPrice(item.id, parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 border rounded"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Unit Price</p>
                        <p className="font-semibold text-lg">{formatPrice(item.price)}</p>
                        <p className="text-sm text-gray-600 mt-2">
                          <span className="font-medium">Subtotal:</span>{' '}
                          {formatPrice(item.price * item.quantity)}
                        </p>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeNewItem(item.id)}
                          className="mt-2"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Product Button */}
              {isEditMode && (
                <div className="pt-4">
                  <Button
                    onClick={() => setShowAddProduct(!showAddProduct)}
                    variant="outline"
                    className="w-full gap-2 border-dashed border-2"
                  >
                    <Package className="h-4 w-4" />
                    {showAddProduct ? 'Hide Product Search' : 'Add Product to Order'}
                  </Button>

                  {/* Product Search */}
                  {showAddProduct && (
                    <div className="mt-4 p-4 border-2 border-dashed rounded-lg bg-gray-50">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Search Products</label>
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              searchProducts(e.target.value);
                            }}
                            placeholder="Search by product name or code..."
                            className="w-full px-4 py-2 border rounded-lg"
                          />
                        </div>

                        {isSearching && (
                          <p className="text-sm text-gray-500">Searching...</p>
                        )}

                        {searchResults.length > 0 && (
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {searchResults.map((product) => (
                              <div key={product.id} className="p-3 bg-white border rounded-lg">
                                <div className="flex gap-3">
                                  {product.images[0] && (
                                    <img
                                      src={product.images[0]}
                                      alt={product.name}
                                      className="w-16 h-16 object-cover rounded"
                                    />
                                  )}
                                  <div className="flex-1">
                                    <h4 className="font-semibold">{product.name}</h4>
                                    <p className="text-xs text-gray-500">Code: {product.code}</p>
                                    <p className="text-sm font-semibold text-blue-600 mt-1">
                                      {formatPrice(product.price)}
                                    </p>

                                    {/* Variants */}
                                    {product.productVariants && product.productVariants.length > 0 ? (
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {product.productVariants.map((pv: any) => (
                                          <Button
                                            key={pv.id}
                                            size="sm"
                                            variant="outline"
                                            onClick={() => addProductToOrder(product, pv)}
                                            className="text-xs"
                                          >
                                            Add {pv.variantOption.name}
                                          </Button>
                                        ))}
                                      </div>
                                    ) : (
                                      <Button
                                        size="sm"
                                        onClick={() => addProductToOrder(product)}
                                        className="mt-2"
                                      >
                                        Add to Order
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                          <p className="text-sm text-gray-500 text-center py-4">
                            No products found
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-green-600" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-semibold">{order.customerName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-semibold">{order.customerMobile}</p>
                    </div>
                  </div>
                  {order.customerEmail && (
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-semibold">{order.customerEmail}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Delivery Address</p>
                      <p className="font-semibold">{order.customerAddress}</p>
                      <p className="text-sm text-gray-600 mt-1">{order.city.name}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tracking & Shipment Details - Only show if order is ONGOING or DELIVERED and has tracking info */}
          {(order.status === 'ONGOING' || order.status === 'DELIVERED') && (order.trackingCode || order.packageImage) && (
            <Card>
              <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-orange-600" />
                  Tracking & Shipment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Tracking Code */}
                {order.trackingCode && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-blue-200">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Truck className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700 mb-1">Tracking Code</p>
                        <p className="text-2xl font-bold text-blue-600 tracking-wider">{order.trackingCode}</p>
                        <p className="text-xs text-gray-500 mt-1">Use this code to track your shipment</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Package Image */}
                {order.packageImage && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-3">
                      <FileImage className="h-5 w-5 text-gray-600" />
                      <p className="text-sm font-semibold text-gray-700">Package Photo</p>
                    </div>
                    <div className="relative rounded-lg overflow-hidden border-2 border-gray-200 shadow-lg">
                      <img
                        src={order.packageImage}
                        alt="Package"
                        className="w-full h-auto max-h-96 object-contain bg-gray-50"
                      />
                    </div>
                  </div>
                )}

                {/* Notes from Activity */}
                {order.activities && order.activities.length > 0 && (() => {
                  const ongoingActivity = order.activities.find(
                    (activity: any) => activity.action === 'STATUS_CHANGED' && activity.metadata?.note
                  );
                  if (ongoingActivity?.metadata?.note) {
                    return (
                      <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200">
                        <div className="flex items-start gap-3">
                          <Mail className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-gray-700 mb-2">Admin Note</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{ongoingActivity.metadata.note}</p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Shipment Status */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-orange-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-gray-700">
                        {order.status === 'DELIVERED' ? 'Delivered' : 'In Transit'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      Updated {new Date(order.updatedAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-purple-600" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 flex items-center gap-1">
                  <Truck className="h-4 w-4" />
                  Shipping:
                </span>
                <span className="font-semibold">{formatPrice(order.shippingCost)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount:</span>
                  <span className="font-semibold">-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-3 border-t">
                <span>Total:</span>
                <span className="text-blue-600">{formatPrice(order.total)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Order Timeline */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-600" />
                Order Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="font-semibold">
                    {new Date(order.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Last Updated</p>
                  <p className="font-semibold">
                    {new Date(order.updatedAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Update */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-orange-600" />
                Update Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              {order.status === 'PENDING' && (
                <>
                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    onClick={() => setShowOngoingDialog(true)}
                    disabled={isUpdating}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Mark as Ongoing
                  </Button>
                  <Button
                    className="w-full bg-red-500 hover:bg-red-600"
                    onClick={() => updateOrderStatus('CANCELLED')}
                    disabled={isUpdating}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Order
                  </Button>
                </>
              )}
              {order.status === 'ONGOING' && (
                <>
                  <Button
                    className="w-full bg-green-500 hover:bg-green-600"
                    onClick={() => updateOrderStatus('DELIVERED')}
                    disabled={isUpdating}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Delivered
                  </Button>
                  <Button
                    className="w-full bg-red-500 hover:bg-red-600"
                    onClick={() => updateOrderStatus('CANCELLED')}
                    disabled={isUpdating}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Order
                  </Button>
                </>
              )}
              {(order.status === 'DELIVERED' || order.status === 'CANCELLED') && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">
                    Order is {order.status.toLowerCase()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          {order.activities && order.activities.length > 0 && (
            <Card>
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-indigo-600" />
                  Activity Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {order.activities.map((activity, index) => (
                    <div key={activity.id} className="relative pl-8">
                      {index !== order.activities.length - 1 && (
                        <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-gray-200"></div>
                      )}
                      <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.createdAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        {activity.createdBy && (
                          <p className="text-xs text-gray-400 mt-1">
                            By: {activity.createdBy}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Mark as Ongoing Dialog */}
      <Dialog open={showOngoingDialog} onOpenChange={setShowOngoingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Package className="h-6 w-6 text-orange-600" />
              Mark Order as Ongoing
            </DialogTitle>
            <DialogDescription>
              Add tracking information and package details (all fields are optional)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Tracking Code */}
            <div className="space-y-2">
              <Label htmlFor="trackingCode" className="text-sm font-semibold flex items-center gap-2">
                <Truck className="h-4 w-4 text-gray-500" />
                Tracking Code
                <span className="text-xs text-gray-500 font-normal">(Optional)</span>
              </Label>
              <Input
                id="trackingCode"
                type="text"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                placeholder="Enter tracking code"
                className="h-11 border-2"
              />
            </div>

            {/* Package Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="packageImage" className="text-sm font-semibold flex items-center gap-2">
                <FileImage className="h-4 w-4 text-gray-500" />
                Package Image
                <span className="text-xs text-gray-500 font-normal">(Optional)</span>
              </Label>
              <div className="border-2 border-dashed rounded-lg p-4 hover:border-orange-400 transition-colors">
                <input
                  id="packageImage"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label
                  htmlFor="packageImage"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  {packageImagePreview ? (
                    <div className="relative w-full">
                      <img
                        src={packageImagePreview}
                        alt="Package preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={(e) => {
                          e.preventDefault();
                          setPackageImage(null);
                          setPackageImagePreview('');
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <Upload className="h-10 w-10" />
                      <p className="text-sm font-medium">Click to upload package image</p>
                      <p className="text-xs text-gray-400">PNG, JPG up to 10MB</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="ongoingNote" className="text-sm font-semibold flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                Note
                <span className="text-xs text-gray-500 font-normal">(Optional)</span>
              </Label>
              <Textarea
                id="ongoingNote"
                value={ongoingNote}
                onChange={(e) => setOngoingNote(e.target.value)}
                placeholder="Add any additional notes..."
                rows={4}
                className="border-2 resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowOngoingDialog(false);
                setTrackingCode('');
                setPackageImage(null);
                setPackageImagePreview('');
                setOngoingNote('');
              }}
              className="flex-1"
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMarkAsOngoing}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
              disabled={isUpdating || isUploadingImage}
            >
              {isUpdating ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {isUploadingImage ? 'Uploading...' : 'Updating...'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Confirm & Mark as Ongoing
                </span>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'PENDING':
      return '#d97706';
    case 'ONGOING':
      return '#ea580c';
    case 'DELIVERED':
      return '#16a34a';
    case 'CANCELLED':
      return '#dc2626';
    default:
      return '#6b7280';
  }
}
