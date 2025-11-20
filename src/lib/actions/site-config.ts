'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getSiteConfig() {
  try {
    let config = await db.siteConfig.findUnique({
      where: { id: 'site_config' },
    });

    // If config doesn't exist, create default
    if (!config) {
      config = await db.siteConfig.create({
        data: {
          id: 'site_config',
          siteName: 'DUDSZ.lk',
          primaryColor: '#2596be',
          secondaryColor: '#0b1120',
          accentColor: '#ffffff',
          buttonColor: '#2596be',
          textColor: '#000000',
        },
      });
    }

    return config;
  } catch (error) {
    console.error('Error fetching site config:', error);
    // Return default config if database fails
    return {
      id: 'site_config',
      siteName: 'DUASZ.LK',
      primaryColor: '#2596be',
      secondaryColor: '#0b1120',
      accentColor: '#ffffff',
      buttonColor: '#2596be',
      textColor: '#000000',
      baseShippingRate: 300,
      freeShippingMin: null,
      discountEnabled: false,
      discountPercent: 0,
      siteDescription: null,
      contactEmail: null,
      contactPhone: null,
      facebookUrl: null,
      whatsappNumber: null,
      instagramUrl: null,
      updatedAt: new Date(),
    };
  }
}

export async function updateSiteConfig(data: {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  buttonColor?: string;
  textColor?: string;
  baseShippingRate?: number;
  discountEnabled?: boolean;
  discountPercent?: number;
  siteName?: string;
  contactEmail?: string;
  contactPhone?: string;
  whatsappNumber?: string;
  facebookUrl?: string;
  instagramUrl?: string;
}) {
  try {
    const config = await db.siteConfig.upsert({
      where: { id: 'site_config' },
      update: data,
      create: {
        id: 'site_config',
        ...data,
      },
    });

    revalidatePath('/');
    revalidatePath('/admin');

    return { success: true, config };
  } catch (error) {
    console.error('Error updating site config:', error);
    return { success: false, error: 'Failed to update site configuration' };
  }
}
