import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { itemsToRemove = [], itemsToAdd = [] } = body;

    if (itemsToRemove.length === 0 && itemsToAdd.length === 0) {
      return NextResponse.json(
        { error: 'No changes to apply' },
        { status: 400 }
      );
    }

    // Get items before deleting to log them
    const itemsToDelete = itemsToRemove.length > 0
      ? await db.orderItem.findMany({
          where: {
            id: { in: itemsToRemove },
            orderId: params.id,
          },
          include: {
            product: true,
          },
        })
      : [];

    // Batch delete and add items, then update order in transaction
    const result = await db.$transaction(async (tx) => {
      // Delete items marked for removal
      if (itemsToRemove.length > 0) {
        await tx.orderItem.deleteMany({
          where: {
            id: { in: itemsToRemove },
            orderId: params.id,
          },
        });
      }

      // Add new items
      let addedItems = [];
      if (itemsToAdd.length > 0) {
        for (const item of itemsToAdd) {
          const createdItem = await tx.orderItem.create({
            data: {
              orderId: params.id,
              productId: item.productId,
              quantity: item.quantity,
              size: item.size || null,
              price: item.price,
              bundleId: null,
              bundleName: null,
              bundlePrice: null,
              bundleQuantity: null,
            },
          });
          addedItems.push({
            ...createdItem,
            productName: item.productName,
          });
        }
      }

      // Recalculate order totals with all current items
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

      // Create activity log
      const changes = [];
      if (itemsToDelete.length > 0) {
        const removedItemsList = itemsToDelete.map(item =>
          `${item.product.name} (Qty: ${item.quantity}${item.size ? `, Size: ${item.size}` : ''})`
        ).join(', ');
        changes.push(`Removed ${itemsToDelete.length} item(s): ${removedItemsList}`);
      }

      if (addedItems.length > 0) {
        const addedItemsList = addedItems.map(item =>
          `${item.productName} (Qty: ${item.quantity}${item.size ? `, Size: ${item.size}` : ''})`
        ).join(', ');
        changes.push(`Added ${addedItems.length} item(s): ${addedItemsList}`);
      }

      const description = changes.join('; ');

      await tx.orderActivity.create({
        data: {
          orderId: params.id,
          action: 'ORDER_EDITED',
          description,
          metadata: {
            removedItems: itemsToDelete.map(item => ({
              itemId: item.id,
              productId: item.productId,
              productName: item.product.name,
              quantity: item.quantity,
              price: item.price,
              size: item.size,
              bundleId: item.bundleId,
              bundleName: item.bundleName,
            })),
            addedItems: addedItems.map(item => ({
              itemId: item.id,
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              price: item.price,
              size: item.size,
            })),
            newSubtotal: subtotal,
            newTotal: total,
          },
          createdBy: 'ADMIN',
        },
      });

      return {
        success: true,
        removedCount: itemsToDelete.length,
        addedCount: addedItems.length,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating order items:', error);
    return NextResponse.json(
      { error: 'Failed to update order items' },
      { status: 500 }
    );
  }
}
