'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { generateProductCode } from '@/lib/utils';

export async function bulkCreateProducts(images: string[], variantOptionIds: string[] = []) {
  try {
    const products = [];

    for (const imageUrl of images) {
      const code = generateProductCode();

      const product = await db.product.create({
        data: {
          code,
          name: `Product ${code}`,
          price: 800,
          stock: 0,
          weight: 200,
          images: [imageUrl],
          enabled: false,
          hasVariants: variantOptionIds.length > 0,
          sizes: ['S', 'M', 'L', 'XL', 'XXL'],
          colors: [],
          productVariants: variantOptionIds.length > 0 ? {
            create: variantOptionIds.map(optionId => ({
              variantOptionId: optionId,
              stock: 0,
              priceAdjustment: 0,
            })),
          } : undefined,
        },
      });

      products.push(product);
    }

    revalidatePath('/admin/products');

    return { success: true, products };
  } catch (error) {
    console.error('Error creating products:', error);
    return { success: false, error: 'Failed to create products' };
  }
}

export async function updateProduct(id: string, data: {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  weight?: number;
  enabled?: boolean;
  featured?: boolean;
  categoryId?: string | null;
  sizes?: string[];
  colors?: string[];
}) {
  try {
    const product = await db.product.update({
      where: { id },
      data,
    });

    revalidatePath('/admin/products');
    revalidatePath('/');

    return { success: true, product };
  } catch (error) {
    console.error('Error updating product:', error);
    return { success: false, error: 'Failed to update product' };
  }
}

export async function deleteProduct(id: string) {
  try {
    await db.product.delete({
      where: { id },
    });

    revalidatePath('/admin/products');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { success: false, error: 'Failed to delete product' };
  }
}

export async function getProducts() {
  try {
    const products = await db.product.findMany({
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function getProduct(id: string) {
  try {
    const product = await db.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    return product;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}
