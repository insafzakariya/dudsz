import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { ArrowLeft, Edit } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface OfferDetailPageProps {
  params: {
    id: string;
  };
}

export default async function OfferDetailPage({ params }: OfferDetailPageProps) {
  const offer = await db.offer.findUnique({
    where: { id: params.id },
    include: {
      offerProducts: {
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });

  if (!offer) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/offers">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold mb-2">{offer.name}</h1>
            <p className="text-gray-600">Offer Details</p>
          </div>
        </div>
        <Link href={`/admin/offers/${offer.id}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit Offer
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Offer Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Offer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Offer Name</label>
                <p className="text-lg font-semibold">{offer.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Description</label>
                <p className="text-gray-800">{offer.description || 'No description'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Slug</label>
                <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded inline-block">
                  {offer.slug}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Logic</label>
                  <p className="text-lg font-semibold">{offer.logic}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Quantity</label>
                  <p className="text-lg font-semibold">{offer.quantity} items</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Bundle Price</label>
                  <p className="text-lg font-semibold">{formatPrice(offer.price)}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        offer.enabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {offer.enabled ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                {offer.featured && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Featured</label>
                    <div className="mt-1">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        Featured Offer
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Linked Products */}
          <Card>
            <CardHeader>
              <CardTitle>Linked Products ({offer.offerProducts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {offer.offerProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No products linked to this offer</p>
              ) : (
                <div className="space-y-4">
                  {offer.offerProducts.map((op) => (
                    <div
                      key={op.id}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50"
                    >
                      {op.product.images[0] && (
                        <img
                          src={op.product.images[0]}
                          alt={op.product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold">{op.product.name}</h4>
                        <p className="text-sm text-gray-600">
                          Code: {op.product.code} | {op.product.category?.name}
                        </p>
                        <p className="text-sm font-semibold text-gray-800">
                          {formatPrice(op.product.price)}
                        </p>
                      </div>
                      <div>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            op.product.enabled
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {op.product.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold">{offer.offerProducts.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Savings per Bundle</p>
                <p className="text-2xl font-bold text-green-600">
                  {offer.offerProducts.length > 0 && (
                    <>
                      {formatPrice(
                        offer.offerProducts.reduce((sum, op) => sum + op.product.price, 0) *
                        (offer.quantity / offer.offerProducts.length) - offer.price
                      )}
                    </>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="text-sm">
                  {new Date(offer.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="text-sm">
                  {new Date(offer.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer View</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/offers/${offer.slug}`} target="_blank">
                <Button variant="outline" className="w-full">
                  View on Website
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
