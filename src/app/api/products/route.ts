import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Allow both authenticated users and admin access
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const products = await db.product.findMany({
      where: {
        deletedAt: null, // Exclude soft-deleted products
      },
      include: {
        category: true,
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
      orderBy: [
        { enabled: 'desc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
