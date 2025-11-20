import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await db.order.findUnique({
      where: { id: params.id },
      include: {
        city: true,
        items: {
          include: {
            product: true,
          },
        },
        user: true,
        activities: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, trackingCode, packageImage, note, cancellationReason } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['PENDING', 'ONGOING', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Get current order to track old status
    const currentOrder = await db.order.findUnique({
      where: { id: params.id },
    });

    if (!currentOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update order and create activity in a transaction
    const order = await db.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: params.id },
        data: {
          status,
          trackingCode: trackingCode || currentOrder.trackingCode,
          packageImage: packageImage || currentOrder.packageImage,
        },
        include: {
          city: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Build activity description
      let description = `Order status changed from ${currentOrder.status} to ${status}`;
      if (trackingCode) {
        description += ` (Tracking: ${trackingCode})`;
      }
      if (cancellationReason && status === 'CANCELLED') {
        description += ` - Reason: ${cancellationReason}`;
      }

      const activityMetadata: any = {
        oldStatus: currentOrder.status,
        newStatus: status,
      };

      if (trackingCode) {
        activityMetadata.trackingCode = trackingCode;
      }

      if (packageImage) {
        activityMetadata.packageImage = packageImage;
      }

      if (note) {
        activityMetadata.note = note;
        description += ` - Note: ${note}`;
      }

      if (cancellationReason) {
        activityMetadata.cancellationReason = cancellationReason;
      }

      // Log status change activity
      await tx.orderActivity.create({
        data: {
          orderId: params.id,
          action: 'STATUS_CHANGED',
          description,
          metadata: activityMetadata,
          createdBy: 'ADMIN',
        },
      });

      return updatedOrder;
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
