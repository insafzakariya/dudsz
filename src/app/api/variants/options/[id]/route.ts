import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { enabled } = body;

    const variantOption = await db.variantOption.update({
      where: { id: params.id },
      data: { enabled },
    });

    return NextResponse.json(variantOption);
  } catch (error) {
    console.error('Error updating variant option:', error);
    return NextResponse.json(
      { error: 'Failed to update variant option' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.variantOption.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting variant option:', error);
    return NextResponse.json(
      { error: 'Failed to delete variant option' },
      { status: 500 }
    );
  }
}
