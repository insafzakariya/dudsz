import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { variantTypeId, name } = body;

    if (!variantTypeId || !name) {
      return NextResponse.json(
        { error: 'Variant type ID and name are required' },
        { status: 400 }
      );
    }

    const variantOption = await db.variantOption.create({
      data: {
        variantTypeId,
        name,
        enabled: true,
      },
    });

    return NextResponse.json(variantOption);
  } catch (error) {
    console.error('Error creating variant option:', error);
    return NextResponse.json(
      { error: 'Failed to create variant option' },
      { status: 500 }
    );
  }
}
