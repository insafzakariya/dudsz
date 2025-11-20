import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const offers = await db.offer.findMany({
      include: {
        offerProducts: {
          include: {
            product: {
              include: {
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
            },
          },
        },
      },
      orderBy: [
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(offers);
  } catch (error) {
    console.error('Error fetching offers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch offers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, description, logic, quantity, price, enabled, featured, products } = body;

    // Validate required fields
    if (!name || !slug || !logic || quantity === undefined || price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!products || products.length === 0) {
      return NextResponse.json(
        { error: 'At least one product must be selected' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingOffer = await db.offer.findUnique({
      where: { slug },
    });

    if (existingOffer) {
      return NextResponse.json(
        { error: 'An offer with this slug already exists' },
        { status: 400 }
      );
    }

    // Create offer with product associations in a transaction
    const offer = await db.$transaction(async (tx) => {
      // Create the offer first
      const newOffer = await tx.offer.create({
        data: {
          name,
          slug,
          description: description || '',
          logic,
          quantity: parseInt(quantity),
          price: parseFloat(price),
          enabled: enabled || false,
          featured: featured || false,
        },
      });

      // Create product associations with variant selections
      for (const product of products) {
        await tx.offerProduct.create({
          data: {
            offerId: newOffer.id,
            productId: product.productId,
            selectedVariantOptionIds: product.selectedVariantOptionIds || [],
          },
        });
      }

      // Return the complete offer with all associations
      return tx.offer.findUnique({
        where: { id: newOffer.id },
        include: {
          offerProducts: {
            include: {
              product: {
                include: {
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
              },
            },
          },
        },
      });
    });

    return NextResponse.json({ success: true, offer }, { status: 201 });
  } catch (error) {
    console.error('Error creating offer:', error);
    return NextResponse.json(
      { error: 'Failed to create offer' },
      { status: 500 }
    );
  }
}
