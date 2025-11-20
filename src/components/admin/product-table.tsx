'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { updateProduct, deleteProduct } from '@/lib/actions/products';
import { formatPrice } from '@/lib/utils';

interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  stock: number;
  weight: number;
  enabled: boolean;
  featured: boolean;
  images: string[];
  category: { name: string } | null;
}

interface ProductTableProps {
  products: Product[];
}

export function ProductTable({ products }: ProductTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const toggleEnabled = async (productId: string, currentState: boolean) => {
    setLoading(productId);
    const result = await updateProduct(productId, { enabled: !currentState });

    if (result.success) {
      toast({
        title: 'Success',
        description: `Product ${!currentState ? 'enabled' : 'disabled'} successfully`,
      });
      router.refresh();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to update product',
        variant: 'destructive',
      });
    }
    setLoading(null);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    setLoading(productId);
    const result = await deleteProduct(productId);

    if (result.success) {
      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      });
      router.refresh();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to delete product',
        variant: 'destructive',
      });
    }
    setLoading(null);
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No products found</p>
        <Button onClick={() => router.push('/admin/products/bulk-upload')}>
          Upload Products
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4">Image</th>
            <th className="text-left py-3 px-4">Code</th>
            <th className="text-left py-3 px-4">Name</th>
            <th className="text-left py-3 px-4">Price</th>
            <th className="text-left py-3 px-4">Stock</th>
            <th className="text-left py-3 px-4">Weight</th>
            <th className="text-left py-3 px-4">Status</th>
            <th className="text-left py-3 px-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-b hover:bg-gray-50">
              <td className="py-3 px-4">
                {product.images[0] && (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
              </td>
              <td className="py-3 px-4 font-mono text-sm">{product.code}</td>
              <td className="py-3 px-4">
                <div>
                  <div className="font-medium">{product.name}</div>
                  {product.category && (
                    <div className="text-xs text-gray-500">{product.category.name}</div>
                  )}
                </div>
              </td>
              <td className="py-3 px-4">{formatPrice(product.price)}</td>
              <td className="py-3 px-4">{product.stock}</td>
              <td className="py-3 px-4">{product.weight}g</td>
              <td className="py-3 px-4">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    product.enabled
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {product.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                    disabled={loading === product.id}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleEnabled(product.id, product.enabled)}
                    disabled={loading === product.id}
                  >
                    {product.enabled ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(product.id)}
                    disabled={loading === product.id}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
