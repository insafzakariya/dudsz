import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const variantTypes = await db.variantType.findMany({
      include: {
        options: {
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(variantTypes);
  } catch (error) {
    console.error('Error fetching variants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch variants' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const variantType = await db.variantType.create({
      data: {
        name,
        enabled: true,
      },
    });

    return NextResponse.json(variantType);
  } catch (error) {
    console.error('Error creating variant type:', error);
    return NextResponse.json(
      { error: 'Failed to create variant type' },
      { status: 500 }
    );
  }
}
