'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Pencil, Trash2, Eye, EyeOff, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
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

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

interface ProductTableProps {
  products: Product[];
  pagination: Pagination;
}

export function ProductTable({ products, pagination }: ProductTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery.trim()) {
      params.set('search', searchQuery);
      params.set('page', '1'); // Reset to first page on new search
    } else {
      params.delete('search');
      params.delete('page');
    }
    router.push(`/admin/products?${params.toString()}`);
  };

  const clearSearch = () => {
    setSearchQuery('');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('search');
    params.delete('page');
    router.push(`/admin/products?${params.toString()}`);
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`/admin/products?${params.toString()}`);
  };

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

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, code, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </form>
        {pagination.totalCount > 0 && (
          <p className="text-sm text-gray-500 mt-2">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
            {pagination.totalCount} product{pagination.totalCount !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">
            {searchParams.get('search') ? 'No products match your search' : 'No products found'}
          </p>
          {searchParams.get('search') ? (
            <Button variant="outline" onClick={clearSearch}>
              Clear Search
            </Button>
          ) : (
            <Button onClick={() => router.push('/admin/products/bulk-upload')}>
              Upload Products
            </Button>
          )}
        </div>
      ) : (
        <>
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

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => goToPage(pageNum)}
                        className="min-w-[40px]"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
