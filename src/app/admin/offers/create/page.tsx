'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';
import { formatPrice } from '@/lib/utils';
import { ProductVariantSelector } from '@/components/admin/product-variant-selector';

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

export default function CreateOfferPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [tempSelectedIds, setTempSelectedIds] = useState<Set<string>>(new Set());
  // Map of productId -> array of selected variant option IDs
  const [productVariantSelections, setProductVariantSelections] = useState<Map<string, string[]>>(new Map());

  const [offer, setOffer] = useState({
    name: '',
    slug: '',
    description: '',
    logic: '',
    quantity: 4,
    price: 2000,
    enabled: false,
    featured: false,
  });

  useEffect(() => {
    // Fetch all products
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => setAllProducts(data))
      .catch((error) => {
        toast({
          title: 'Error',
          description: 'Failed to load products',
          variant: 'destructive',
        });
      });
  }, [toast]);

  const filteredProducts = allProducts.filter(
    (product) =>
      !selectedProducts.find((p) => p.id === product.id) &&
      (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.code.includes(searchTerm))
  );

  const toggleTempSelection = (productId: string) => {
    const newTempSelected = new Set(tempSelectedIds);
    if (newTempSelected.has(productId)) {
      newTempSelected.delete(productId);
    } else {
      newTempSelected.add(productId);
    }
    setTempSelectedIds(newTempSelected);
  };

  const addSelectedProducts = () => {
    const productsToAdd = allProducts.filter(p => tempSelectedIds.has(p.id));
    setSelectedProducts([...selectedProducts, ...productsToAdd]);

    // Initialize variant selections for new products (select all by default)
    const newVariantSelections = new Map(productVariantSelections);
    productsToAdd.forEach((product) => {
      if (product.hasVariants && product.productVariants) {
        const allVariantIds = product.productVariants.map(pv => pv.variantOption.id);
        newVariantSelections.set(product.id, allVariantIds);
      }
    });
    setProductVariantSelections(newVariantSelections);

    setTempSelectedIds(new Set());
    setSearchTerm('');
  };

  const handleVariantSelectionChange = (productId: string, variantIds: string[]) => {
    const newSelections = new Map(productVariantSelections);
    newSelections.set(productId, variantIds);
    setProductVariantSelections(newSelections);
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== productId));
    // Remove variant selections for this product
    const newSelections = new Map(productVariantSelections);
    newSelections.delete(productId);
    setProductVariantSelections(newSelections);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedProducts.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one product for this offer',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Build products array with variant selections
      const productsWithVariants = selectedProducts.map((product) => ({
        productId: product.id,
        selectedVariantOptionIds: productVariantSelections.get(product.id) || [],
      }));

      const response = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...offer,
          products: productsWithVariants,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Offer created successfully',
        });
        router.push('/admin/offers');
      } else {
        throw new Error('Failed to create offer');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create offer',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center gap-4">
        <Link href="/admin/offers">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold mb-2">Create New Offer</h1>
          <p className="text-gray-600">Set up a bundle offer with selected products</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Offer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Offer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Offer Name *</Label>
                  <Input
                    id="name"
                    value={offer.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setOffer({
                        ...offer,
                        name,
                        slug: generateSlug(name)
                      });
                    }}
                    placeholder="e.g., Buy 4 T-Shirts for Rs. 2000"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={offer.slug}
                    onChange={(e) => setOffer({ ...offer, slug: e.target.value })}
                    placeholder="buy-4-for-2000"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    URL: /offers/{offer.slug || 'slug'}
                  </p>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={offer.description}
                    onChange={(e) => setOffer({ ...offer, description: e.target.value })}
                    placeholder="Describe your offer..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="logic">Offer Logic *</Label>
                  <Input
                    id="logic"
                    value={offer.logic}
                    onChange={(e) => setOffer({ ...offer, logic: e.target.value })}
                    placeholder="e.g., Buy 4 for 2000"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">Quantity Required *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={offer.quantity}
                      onChange={(e) =>
                        setOffer({ ...offer, quantity: parseInt(e.target.value) })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Bundle Price (Rs.) *</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={offer.price}
                      onChange={(e) =>
                        setOffer({ ...offer, price: parseFloat(e.target.value) })
                      }
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Products for This Offer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Selected Products */}
                {selectedProducts.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Products ({selectedProducts.length})</Label>
                    <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-2">
                      {selectedProducts.map((product) => (
                        <ProductVariantSelector
                          key={product.id}
                          product={product}
                          selectedVariantIds={productVariantSelections.get(product.id) || []}
                          onVariantSelectionChange={handleVariantSelectionChange}
                          onRemoveProduct={removeProduct}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Search & Add Products */}
                <div>
                  <Label htmlFor="search">Add Products</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search products by name or code..."
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Available Products */}
                {searchTerm && (
                  <div>
                    <div className="max-h-64 overflow-y-auto border rounded-lg p-2 space-y-2 mb-3">
                      {filteredProducts.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">No products found</p>
                      ) : (
                        filteredProducts.map((product) => {
                          const isChecked = tempSelectedIds.has(product.id);
                          return (
                            <div
                              key={product.id}
                              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                isChecked ? 'bg-blue-50 border border-blue-300' : 'hover:bg-gray-50 border border-transparent'
                              }`}
                              onClick={() => toggleTempSelection(product.id)}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleTempSelection(product.id)}
                                className="h-4 w-4 rounded border-gray-300"
                                onClick={(e) => e.stopPropagation()}
                              />
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
                              </div>
                              <span
                                className={`text-xs px-2 py-1 rounded ${
                                  product.enabled
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {product.enabled ? 'Enabled' : 'Disabled'}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                    {tempSelectedIds.size > 0 && (
                      <Button
                        type="button"
                        onClick={addSelectedProducts}
                        className="w-full"
                      >
                        Add {tempSelectedIds.size} Selected Product{tempSelectedIds.size > 1 ? 's' : ''}
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={offer.enabled}
                    onChange={(e) => setOffer({ ...offer, enabled: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="enabled" className="cursor-pointer">
                    Enable this offer
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={offer.featured}
                    onChange={(e) => setOffer({ ...offer, featured: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="featured" className="cursor-pointer">
                    Featured (show on homepage)
                  </Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Products:</span>
                  <span className="font-semibold">{selectedProducts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-semibold">{offer.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bundle Price:</span>
                  <span className="font-semibold">{formatPrice(offer.price)}</span>
                </div>
                {selectedProducts.length > 0 && (
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-gray-600">Avg. Savings:</span>
                    <span className="font-semibold text-green-600">
                      {formatPrice(
                        (selectedProducts.reduce((sum, p) => sum + p.price, 0) /
                        selectedProducts.length * offer.quantity) - offer.price
                      )}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col gap-2">
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Creating...' : 'Create Offer'}
              </Button>
              <Link href="/admin/offers">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
