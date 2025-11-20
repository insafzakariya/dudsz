import { db } from '@/lib/db';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Package, Tag, ShoppingBag, Star, Edit, Eye, Layers } from 'lucide-react';
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

  const activeOffers = offers.filter(o => o.enabled).length;
  const featuredOffers = offers.filter(o => o.featured).length;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Offers & Bundles</h1>
          <p className="text-gray-600">Create and manage special bundle offers for customers</p>
        </div>
        <Link href="/admin/offers/create">
          <Button size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-shadow">
            <Plus className="h-5 w-5" />
            Create New Offer
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      {offers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Offers</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{offers.length}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Offers</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{activeOffers}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Featured Offers</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{featuredOffers}</p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Offers Grid */}
      {offers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <Card key={offer.id} className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-200 overflow-hidden">
              {/* Card Header with Status Badges */}
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Tag className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{offer.name}</h3>
                      <p className="text-xs text-gray-500 uppercase font-medium">{offer.logic}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                      offer.enabled
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-400 text-white'
                    }`}
                  >
                    {offer.enabled ? '● Active' : '○ Inactive'}
                  </span>
                  {offer.featured && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-yellow-400 text-gray-900">
                      <Star className="h-3 w-3 fill-current" />
                      Featured
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-4">
                {/* Description */}
                <p className="text-sm text-gray-600 line-clamp-2 min-h-[40px]">
                  {offer.description || 'No description provided'}
                </p>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Layers className="h-4 w-4" />
                      <span className="text-xs font-medium">Quantity</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{offer.quantity}</p>
                    <p className="text-xs text-gray-500">items</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Tag className="h-4 w-4" />
                      <span className="text-xs font-medium">Price</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">Rs. {offer.price.toFixed(0)}</p>
                    <p className="text-xs text-gray-500">bundle price</p>
                  </div>
                </div>

                {/* Products Count */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Linked Products</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{offer.offerProducts.length}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <Link href={`/admin/offers/${offer.id}/edit`} className="flex-1">
                    <Button variant="default" size="sm" className="w-full gap-2">
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                  </Link>
                  <Link href={`/admin/offers/${offer.id}`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // Empty State
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Package className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No offers created yet</h3>
            <p className="text-gray-500 mb-6 text-center max-w-md">
              Create your first bundle offer to provide special deals and increase sales
            </p>
            <Link href="/admin/offers/create">
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Create Your First Offer
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
