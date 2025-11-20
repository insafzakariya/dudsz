import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await db.product.findUnique({
      where: { id: params.id },
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
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      price,
      stock,
      weight,
      enabled,
      featured,
      categoryId,
      hasVariants,
      variantOptionIds = [],
    } = body;

    // Update product and manage variants in a transaction
    const product = await db.$transaction(async (tx) => {
      // Update the product
      const updatedProduct = await tx.product.update({
        where: { id: params.id },
        data: {
          name,
          description,
          price,
          stock,
          weight,
          enabled,
          featured,
          hasVariants,
          categoryId: categoryId || null,
        },
      });

      // Delete existing product variants
      await tx.productVariant.deleteMany({
        where: { productId: params.id },
      });

      // Create new product variants if any selected
      if (variantOptionIds.length > 0) {
        await tx.productVariant.createMany({
          data: variantOptionIds.map((optionId: string) => ({
            productId: params.id,
            variantOptionId: optionId,
            stock: 0,
            priceAdjustment: 0,
          })),
        });
      }

      return updatedProduct;
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.product.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
