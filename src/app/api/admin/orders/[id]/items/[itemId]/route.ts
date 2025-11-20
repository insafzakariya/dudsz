import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    // Get the item before deleting to log it
    const item = await db.orderItem.findUnique({
      where: { id: params.itemId },
      include: {
        product: true,
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Order item not found' },
        { status: 404 }
      );
    }

    if (item.orderId !== params.id) {
      return NextResponse.json(
        { error: 'Item does not belong to this order' },
        { status: 400 }
      );
    }

    // Delete item and log activity in a transaction
    await db.$transaction(async (tx) => {
      // Delete the item
      await tx.orderItem.delete({
        where: { id: params.itemId },
      });

      // Recalculate order totals
      const remainingItems = await tx.orderItem.findMany({
        where: { orderId: params.id },
      });

      const subtotal = remainingItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      const order = await tx.order.findUnique({
        where: { id: params.id },
      });

      const total = subtotal + (order?.shippingCost || 0) - (order?.discount || 0);

      // Update order totals
      await tx.order.update({
        where: { id: params.id },
        data: {
          subtotal,
          total,
        },
      });

      // Log activity
      await tx.orderActivity.create({
        data: {
          orderId: params.id,
          action: 'ITEM_REMOVED',
          description: `Removed ${item.product.name} (Qty: ${item.quantity}) from order`,
          metadata: {
            itemId: item.id,
            productId: item.productId,
            productName: item.product.name,
            quantity: item.quantity,
            price: item.price,
            size: item.size,
            bundleId: item.bundleId,
            bundleName: item.bundleName,
            reason: 'Out of stock',
          },
          createdBy: 'ADMIN',
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing order item:', error);
    return NextResponse.json(
      { error: 'Failed to remove order item' },
      { status: 500 }
    );
  }
}
