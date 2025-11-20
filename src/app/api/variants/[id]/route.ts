import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { enabled } = body;

    const variantType = await db.variantType.update({
      where: { id: params.id },
      data: { enabled },
    });

    return NextResponse.json(variantType);
  } catch (error) {
    console.error('Error updating variant type:', error);
    return NextResponse.json(
      { error: 'Failed to update variant type' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.variantType.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting variant type:', error);
    return NextResponse.json(
      { error: 'Failed to delete variant type' },
      { status: 500 }
    );
  }
}
