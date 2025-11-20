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

export async function getProducts(options?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  try {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const search = options?.search || '';
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { code: { contains: search, mode: 'insensitive' as const } },
            { category: { name: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : {};

    const [products, totalCount] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          category: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      db.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    return {
      products: [],
      pagination: { page: 1, limit: 20, totalCount: 0, totalPages: 0 },
    };
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
