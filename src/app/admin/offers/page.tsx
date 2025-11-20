import { db } from '@/lib/db';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function OffersPage() {
  const offers = await db.offer.findMany({
    include: {
      offerProducts: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Offers & Bundles</h1>
          <p className="text-gray-600">Manage your bundle offers</p>
        </div>
        <Link href="/admin/offers/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Offer
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offers.map((offer) => (
          <Card key={offer.id} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  offer.enabled
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {offer.enabled ? 'Active' : 'Inactive'}
              </span>
              {offer.featured && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Featured
                </span>
              )}
            </div>

            <h3 className="text-xl font-bold mb-2">{offer.name}</h3>
            <p className="text-gray-600 text-sm mb-4">{offer.description}</p>

            <div className="space-y-2 mb-4">
              <div className="text-sm">
                <span className="text-gray-500">Logic:</span>{' '}
                <span className="font-medium">{offer.logic}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Quantity:</span>{' '}
                <span className="font-medium">{offer.quantity} items</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Price:</span>{' '}
                <span className="font-medium">Rs. {offer.price.toFixed(2)}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Products:</span>{' '}
                <span className="font-medium">{offer.offerProducts.length} linked</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Link href={`/admin/offers/${offer.id}/edit`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  Edit
                </Button>
              </Link>
              <Link href={`/admin/offers/${offer.id}`}>
                <Button variant="outline" size="sm">
                  View
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {offers.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-gray-500 mb-4">No offers created yet</p>
          <Link href="/admin/offers/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Offer
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
