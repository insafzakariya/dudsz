import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Generate order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp}${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerMobile,
      customerEmail,
      customerAddress,
      cityId,
      items,
    } = body;

    // Validate required fields
    if (!customerName || !customerMobile || !customerAddress || !cityId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // Get city to calculate shipping
    const city = await db.city.findUnique({
      where: { id: cityId },
    });

    if (!city) {
      return NextResponse.json(
        { error: 'Invalid city selected' },
        { status: 400 }
      );
    }

    // Calculate totals (matching shopping cart logic)
    // Separate bundle and regular items
    const bundleItems = items.filter((item: any) => item.bundleName);
    const regularItems = items.filter((item: any) => !item.bundleName);

    // Calculate bundle subtotals
    const bundleSubtotal = bundleItems.reduce(
      (sum: number, item: any) => sum + (item.price || 0) * item.quantity,
      0
    );

    // Calculate regular items subtotal
    const regularSubtotal = regularItems.reduce(
      (sum: number, item: any) => sum + (item.price || 0) * item.quantity,
      0
    );

    const subtotal = bundleSubtotal + regularSubtotal;
    const shippingCost = city.shippingCost;
    const total = subtotal + shippingCost;

    // Generate unique order number
    let orderNumber = generateOrderNumber();
    let exists = await db.order.findUnique({ where: { orderNumber } });
    while (exists) {
      orderNumber = generateOrderNumber();
      exists = await db.order.findUnique({ where: { orderNumber } });
    }

    // Create order with items
    const order = await db.order.create({
      data: {
        orderNumber,
        customerName,
        customerMobile,
        customerAddress,
        cityId,
        subtotal,
        shippingCost,
        discount: 0,
        total,
        status: 'PENDING',
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            size: item.size || null,
            color: item.color || null,
            price: item.price,
            bundleId: item.bundleId || null,
            bundleName: item.bundleName || null,
            bundlePrice: item.bundlePrice || null,
            bundleQuantity: item.bundleQuantity || null,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        city: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        orderNumber: order.orderNumber,
        order,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
