import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { getSiteConfig } from '@/lib/actions/site-config';
import { OfferPageClient } from '@/components/customer/offer-page-client';

export const dynamic = 'force-dynamic';

interface OfferPageProps {
  params: {
    slug: string;
  };
}

export default async function OfferPage({ params }: OfferPageProps) {
  const config = await getSiteConfig();

  const offer = await db.offer.findUnique({
    where: {
      slug: params.slug,
      enabled: true,
    },
    include: {
      offerProducts: {
        include: {
          product: {
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
          },
        },
      },
    },
  });

  if (!offer) {
    notFound();
  }

  return <OfferPageClient offer={offer} config={config} />;
}
