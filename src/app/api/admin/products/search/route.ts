import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    const products = await db.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { code: { contains: query, mode: 'insensitive' } },
        ],
        enabled: true,
        deletedAt: null, // Exclude soft-deleted products
      },
      select: {
        id: true,
        name: true,
        code: true,
        price: true,
        images: true,
        productVariants: {
          include: {
            variantOption: {
              include: {
                variantType: true,
              },
            },
          },
        },
      },
      take: 10,
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error searching products:', error);
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    );
  }
}
