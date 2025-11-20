import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const offer = await db.offer.findUnique({
      where: { id: params.id },
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

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    return NextResponse.json(offer);
  } catch (error) {
    console.error('Error fetching offer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch offer' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, description, logic, quantity, price, enabled, featured, products } = body;

    // Validate required fields
    if (products && products.length === 0) {
      return NextResponse.json(
        { error: 'At least one product must be selected' },
        { status: 400 }
      );
    }

    // Update offer and product associations in a transaction
    const offer = await db.$transaction(async (tx) => {
      // Update offer details
      const updatedOffer = await tx.offer.update({
        where: { id: params.id },
        data: {
          name,
          slug,
          description,
          logic,
          quantity: parseInt(quantity),
          price: parseFloat(price),
          enabled,
          featured,
        },
      });

      // If products are provided, update the product associations
      if (products) {
        // Delete all existing product associations
        await tx.offerProduct.deleteMany({
          where: { offerId: params.id },
        });

        // Create new product associations with variant selections
        // Using individual creates instead of createMany to support array fields
        for (const product of products) {
          await tx.offerProduct.create({
            data: {
              offerId: params.id,
              productId: product.productId,
              selectedVariantOptionIds: product.selectedVariantOptionIds || [],
            },
          });
        }
      }

      // Return offer with updated product associations
      return tx.offer.findUnique({
        where: { id: params.id },
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

    return NextResponse.json({ success: true, offer });
  } catch (error) {
    console.error('Error updating offer:', error);
    console.error('Error details:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'Failed to update offer', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db.offer.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting offer:', error);
    return NextResponse.json(
      { error: 'Failed to delete offer' },
      { status: 500 }
    );
  }
}
