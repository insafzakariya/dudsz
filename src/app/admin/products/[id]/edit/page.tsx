'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
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
    <div>
      <div className="mb-8 flex items-center gap-4">
        <Link href="/admin/products">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold mb-2">Edit Product</h1>
          <p className="text-gray-600">Update product details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Product Information */}
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={product.name}
                    onChange={(e) => setProduct({ ...product, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={product.description}
                    onChange={(e) => setProduct({ ...product, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price (Rs.) *</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={product.price}
                      onChange={(e) => setProduct({ ...product, price: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="stock">Stock</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={product.stock}
                      onChange={(e) => setProduct({ ...product, stock: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="weight">Weight (grams) *</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="0"
                    value={product.weight}
                    onChange={(e) => setProduct({ ...product, weight: parseFloat(e.target.value) })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={product.categoryId}
                    onChange={(e) => setProduct({ ...product, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">No Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Variants */}
            {variantTypes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Product Variants (Optional)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {variantTypes.map((variantType) => (
                    <div key={variantType.id}>
                      <Label className="text-base font-semibold mb-2 block">
                        {variantType.name}
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {variantType.options.map((option) => (
                          <label
                            key={option.id}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                              selectedVariants.has(option.id)
                                ? 'bg-blue-50 border-blue-500'
                                : 'bg-white border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedVariants.has(option.id)}
                              onChange={() => toggleVariant(option.id)}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                            <span className="font-medium">{option.name}</span>
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
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={product.enabled}
                    onChange={(e) => setProduct({ ...product, enabled: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="enabled" className="cursor-pointer">
                    Enable this product
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={product.featured}
                    onChange={(e) => setProduct({ ...product, featured: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="featured" className="cursor-pointer">
                    Featured product
                  </Label>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-2">
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Link href="/admin/products">
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
