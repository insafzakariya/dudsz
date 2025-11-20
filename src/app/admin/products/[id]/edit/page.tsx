'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Package, DollarSign, Weight, Image as ImageIcon, Star, Eye, Tag, Box } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';
import { updateProduct } from '@/lib/actions/products';

interface Category {
  id: string;
  name: string;
}

interface VariantOption {
  id: string;
  name: string;
}

interface VariantType {
  id: string;
  name: string;
  options: VariantOption[];
}

interface Product {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  weight: number;
  images: string[];
  enabled: boolean;
  featured: boolean;
  hasVariants: boolean;
  category: Category | null;
  productVariants: Array<{
    id: string;
    variantOptionId: string;
  }>;
}

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [variantTypes, setVariantTypes] = useState<VariantType[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set());

  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    weight: 200,
    enabled: false,
    featured: false,
    hasVariants: false,
    categoryId: '',
    images: [] as string[],
    code: '',
  });

  useEffect(() => {
    fetchProduct();
    fetchCategories();
    fetchVariants();
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${params.id}`);
      if (response.ok) {
        const data: Product = await response.json();
        setProduct({
          name: data.name,
          description: data.description || '',
          price: data.price,
          stock: data.stock,
          weight: data.weight,
          enabled: data.enabled,
          featured: data.featured,
          hasVariants: data.hasVariants,
          categoryId: data.category?.id || '',
          images: data.images || [],
          code: data.code,
        });

        // Set selected variants
        const variantIds = new Set(data.productVariants.map(pv => pv.variantOptionId));
        setSelectedVariants(variantIds);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load product',
        variant: 'destructive',
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchVariants = async () => {
    try {
      const response = await fetch('/api/variants');
      if (response.ok) {
        const data = await response.json();
        const enabledVariants = data
          .filter((vt: any) => vt.enabled)
          .map((vt: any) => ({
            ...vt,
            options: vt.options.filter((opt: any) => opt.enabled),
          }));
        setVariantTypes(enabledVariants);
      }
    } catch (error) {
      console.error('Error fetching variants:', error);
    }
  };

  const toggleVariant = (optionId: string) => {
    const newSelected = new Set(selectedVariants);
    if (newSelected.has(optionId)) {
      newSelected.delete(optionId);
    } else {
      newSelected.add(optionId);
    }
    setSelectedVariants(newSelected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...product,
          categoryId: product.categoryId || null,
          hasVariants: selectedVariants.size > 0,
          variantOptionIds: Array.from(selectedVariants),
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Product updated successfully',
        });
        router.push('/admin/products');
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update product',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/admin/products">
            <Button variant="outline" size="icon" className="h-10 w-10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Edit Product
            </h1>
            <p className="text-gray-600 mt-1">Update product details and settings</p>
          </div>
          {product.code && (
            <div className="bg-gray-100 px-4 py-2 rounded-lg">
              <span className="text-xs text-gray-500">Product Code</span>
              <p className="font-mono font-semibold text-gray-900">{product.code}</p>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Product Images */}
            <Card className="overflow-hidden border-2 border-gray-100">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <ImageIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">Product Images</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {product.images.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {product.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Product ${index + 1}`}
                          className="w-full h-40 object-cover rounded-lg border-2 border-gray-200 group-hover:border-purple-400 transition-colors"
                        />
                        <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-500">No images uploaded</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Product Information */}
            <Card className="overflow-hidden border-2 border-gray-100">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                <div>
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-blue-600" />
                    Product Name *
                  </Label>
                  <Input
                    id="name"
                    value={product.name}
                    onChange={(e) => setProduct({ ...product, name: e.target.value })}
                    required
                    className="border-2 border-gray-200 focus:border-blue-500 transition-colors"
                    placeholder="Enter product name"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm font-semibold text-gray-700 mb-2 block">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={product.description}
                    onChange={(e) => setProduct({ ...product, description: e.target.value })}
                    rows={4}
                    className="border-2 border-gray-200 focus:border-blue-500 transition-colors resize-none"
                    placeholder="Detailed product description..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="price" className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      Price (Rs.) *
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={product.price}
                      onChange={(e) => setProduct({ ...product, price: parseFloat(e.target.value) })}
                      required
                      className="border-2 border-gray-200 focus:border-green-500 transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="stock" className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Box className="h-4 w-4 text-orange-600" />
                      Stock Quantity
                    </Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={product.stock}
                      onChange={(e) => setProduct({ ...product, stock: parseInt(e.target.value) })}
                      className="border-2 border-gray-200 focus:border-orange-500 transition-colors"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="weight" className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Weight className="h-4 w-4 text-purple-600" />
                      Weight (grams) *
                    </Label>
                    <Input
                      id="weight"
                      type="number"
                      min="0"
                      value={product.weight}
                      onChange={(e) => setProduct({ ...product, weight: parseFloat(e.target.value) })}
                      required
                      className="border-2 border-gray-200 focus:border-purple-500 transition-colors"
                      placeholder="200"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Category
                    </Label>
                    <select
                      id="category"
                      value={product.categoryId}
                      onChange={(e) => setProduct({ ...product, categoryId: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-md focus:border-blue-500 focus:outline-none transition-colors"
                    >
                      <option value="">No Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Variants */}
            {variantTypes.length > 0 && (
              <Card className="overflow-hidden border-2 border-gray-100">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Box className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Product Variants</CardTitle>
                      <p className="text-sm text-gray-500 mt-0.5">Optional variant configurations</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {variantTypes.map((variantType) => (
                    <div key={variantType.id}>
                      <Label className="text-base font-semibold mb-3 block text-gray-700">
                        {variantType.name}
                      </Label>
                      <div className="flex flex-wrap gap-3">
                        {variantType.options.map((option) => (
                          <label
                            key={option.id}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                              selectedVariants.has(option.id)
                                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-500 shadow-sm'
                                : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedVariants.has(option.id)}
                              onChange={() => toggleVariant(option.id)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className={`font-medium ${selectedVariants.has(option.id) ? 'text-blue-700' : 'text-gray-700'}`}>
                              {option.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card className="overflow-hidden border-2 border-gray-100">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Eye className="h-5 w-5 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">Visibility & Status</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <label className="flex items-start gap-3 p-3 rounded-lg border-2 border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={product.enabled}
                    onChange={(e) => setProduct({ ...product, enabled: e.target.checked })}
                    className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500 mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Enable Product</div>
                    <p className="text-xs text-gray-500 mt-1">Make this product visible to customers</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-lg border-2 border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={product.featured}
                    onChange={(e) => setProduct({ ...product, featured: e.target.checked })}
                    className="h-5 w-5 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500 mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                      Featured Product
                      <Star className="h-4 w-4 text-yellow-500" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Highlight on homepage and featured sections</p>
                  </div>
                </label>

                {/* Status Indicators */}
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Product Status:</span>
                    <span className={`font-semibold ${product.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                      {product.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Stock Level:</span>
                    <span className={`font-semibold ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving Changes...
                  </div>
                ) : (
                  'Save Changes'
                )}
              </Button>
              <Link href="/admin/products" className="block">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 text-base font-semibold border-2 hover:bg-gray-50"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </Link>
            </div>

            {/* Quick Info */}
            <Card className="overflow-hidden border-2 border-gray-100">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200">
                <CardTitle className="text-sm">Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium text-gray-900">
                      {categories.find(c => c.id === product.categoryId)?.name || 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Variants:</span>
                    <span className="font-medium text-gray-900">
                      {selectedVariants.size > 0 ? `${selectedVariants.size} selected` : 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Images:</span>
                    <span className="font-medium text-gray-900">
                      {product.images.length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
