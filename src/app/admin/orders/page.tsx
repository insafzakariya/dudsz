'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import { Package, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerMobile: string;
  customerEmail: string | null;
  customerAddress: string;
  total: number;
  subtotal: number;
  shippingCost: number;
  discount: number;
  status: string;
  createdAt: string;
  items: {
    id: string;
    quantity: number;
    price: number;
    size: string | null;
    bundleId: string | null;
    bundleName: string | null;
    bundlePrice: number | null;
    bundleQuantity: number | null;
    product: {
      id: string;
      name: string;
      images: string[];
    };
  }[];
  city: {
    id: string;
    name: string;
  };
}

type OrderStatus = 'PENDING' | 'ONGOING' | 'DELIVERED' | 'CANCELLED';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<OrderStatus>('PENDING');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/orders');
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = {
    PENDING: orders.filter((o) => o.status === 'PENDING').length,
    ONGOING: orders.filter((o) => o.status === 'ONGOING').length,
    DELIVERED: orders.filter((o) => o.status === 'DELIVERED').length,
    CANCELLED: orders.filter((o) => o.status === 'CANCELLED').length,
  };

  const filteredOrders = orders.filter((order) => order.status === activeTab);

  const tabs = [
    { status: 'PENDING' as OrderStatus, label: 'Pending', icon: Clock, color: 'yellow' },
    { status: 'ONGOING' as OrderStatus, label: 'Ongoing', icon: Package, color: 'orange' },
    { status: 'DELIVERED' as OrderStatus, label: 'Delivered', icon: CheckCircle, color: 'green' },
    { status: 'CANCELLED' as OrderStatus, label: 'Cancelled', icon: XCircle, color: 'red' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Orders</h1>
        <p className="text-gray-600">Manage customer orders</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Card
              key={tab.status}
              className={`p-6 cursor-pointer transition-all ${
                activeTab === tab.status
                  ? 'ring-2 ring-blue-500 shadow-lg'
                  : 'hover:shadow-md'
              }`}
              onClick={() => setActiveTab(tab.status)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{tab.label}</p>
                  <p className="text-3xl font-bold">{stats[tab.status]}</p>
                </div>
                <Icon
                  className={`h-8 w-8 text-${tab.color}-600`}
                  style={{
                    color:
                      tab.color === 'yellow'
                        ? '#d97706'
                        : tab.color === 'orange'
                        ? '#ea580c'
                        : tab.color === 'green'
                        ? '#16a34a'
                        : '#dc2626',
                  }}
                />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Orders Table */}
      <Card className="p-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 mb-2">No {activeTab.toLowerCase()} orders</p>
            <p className="text-sm text-gray-400">
              {activeTab === 'PENDING'
                ? 'New orders will appear here'
                : `Orders marked as ${activeTab.toLowerCase()} will appear here`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold">Order #</th>
                  <th className="text-left py-3 px-4 font-semibold">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold">Items</th>
                  <th className="text-left py-3 px-4 font-semibold">Total</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Date</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <span className="font-mono text-sm font-medium text-blue-600">
                        {order.orderNumber}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium">{order.customerName}</div>
                        <div className="text-xs text-gray-500">
                          {order.customerMobile}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-600">
                        {order.items.length} item{order.items.length > 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-semibold">
                      {formatPrice(order.total)}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : order.status === 'ONGOING'
                            ? 'bg-orange-100 text-orange-800'
                            : order.status === 'DELIVERED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-500">
                      <div>
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Link href={`/admin/orders/${order.id}`}>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
