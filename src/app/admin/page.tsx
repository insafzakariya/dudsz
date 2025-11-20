import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, Package, TrendingUp, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  // Fetch statistics
  const [
    enabledProductsCount,
    totalProductsCount,
    pendingOrders,
    ongoingOrders,
    deliveredOrders,
  ] = await Promise.all([
    db.product.count({ where: { enabled: true } }),
    db.product.count(),
    db.order.count({ where: { status: 'PENDING' } }),
    db.order.count({ where: { status: 'ONGOING' } }),
    db.order.count({ where: { status: 'DELIVERED' } }),
  ]);

  const stats = [
    {
      title: 'Enabled Products',
      value: enabledProductsCount,
      icon: ShoppingBag,
      description: `${totalProductsCount} total products`,
      color: 'text-blue-600',
    },
    {
      title: 'Pending Orders',
      value: pendingOrders,
      icon: Clock,
      description: 'Awaiting processing',
      color: 'text-yellow-600',
    },
    {
      title: 'Ongoing Orders',
      value: ongoingOrders,
      icon: Package,
      description: 'In delivery',
      color: 'text-orange-600',
    },
    {
      title: 'Delivered Orders',
      value: deliveredOrders,
      icon: TrendingUp,
      description: 'Successfully completed',
      color: 'text-green-600',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">Overview of your store</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-sm">
              Activity feed coming soon...
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/admin/products/bulk-upload"
              className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="font-medium">Bulk Upload Products</div>
              <div className="text-sm text-gray-500">
                Upload multiple product images at once
              </div>
            </a>
            <a
              href="/admin/offers"
              className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="font-medium">Create New Offer</div>
              <div className="text-sm text-gray-500">
                Set up bundle deals and promotions
              </div>
            </a>
            <a
              href="/admin/settings"
              className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="font-medium">Update Theme Colors</div>
              <div className="text-sm text-gray-500">
                Customize your store's appearance
              </div>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
