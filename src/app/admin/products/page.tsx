import Link from 'next/link';
import { getProducts } from '@/lib/actions/products';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { ProductTable } from '@/components/admin/product-table';

export const dynamic = 'force-dynamic';

interface ProductsPageProps {
  searchParams: {
    page?: string;
    search?: string;
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const page = parseInt(searchParams.page || '1', 10);
  const search = searchParams.search || '';

  const { products, pagination } = await getProducts({
    page,
    limit: 20,
    search,
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Products</h1>
          <p className="text-gray-600">Manage your product catalog</p>
        </div>
        <Link href="/admin/products/bulk-upload">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Bulk Upload
          </Button>
        </Link>
      </div>

      <Card className="p-6">
        <ProductTable products={products} pagination={pagination} />
      </Card>
    </div>
  );
}
