import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tag } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface OfferCardProps {
  offer: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    logic: string;
    quantity: number;
    price: number;
    offerProducts: Array<{
      product: {
        id: string;
        name: string;
        images: string[];
      };
    }>;
  };
}

export function OfferCard({ offer }: OfferCardProps) {
  // No cart highlighting
  const hasIncompleteBundle = false;
  const hasCompleteBundle = false;
  const isInCart = false;

  return (
    <Link href={`/offers/${offer.slug}`}>
      <Card className="h-full hover:shadow-xl transition-all cursor-pointer overflow-hidden relative group active:scale-[0.98] duration-150">
        {/* Beautiful gradient background */}
        <div
          className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
          style={{
            background: `linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)`
          }}
        />

        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-5" style={{ backgroundColor: 'var(--primary)' }} />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full opacity-5" style={{ backgroundColor: 'var(--secondary)' }} />

        <CardContent className="pt-4 sm:pt-6 pb-3 sm:pb-6 px-4 sm:px-6 relative z-10">
          <div className="flex items-center gap-2 mb-2 sm:mb-3" style={{ color: 'var(--primary)' }}>
            <Tag className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="font-semibold text-xs sm:text-sm">SPECIAL OFFER</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 group-hover:text-[var(--primary)] transition-colors">
            {offer.name}
          </h3>

          {offer.description && (
            <p className="text-gray-600 text-xs sm:text-sm mb-4 sm:mb-6 line-clamp-2">
              {offer.description}
            </p>
          )}

          {/* Offer highlight box */}
          <div
            className="rounded-lg p-3 sm:p-4 mb-3 sm:mb-4"
            style={{
              backgroundColor: 'var(--primary)',
              opacity: 0.1
            }}
          >
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: 'var(--primary)', opacity: 1 }}>
                {formatPrice(offer.price)}
              </div>
              <p className="text-xs sm:text-sm font-medium" style={{ color: 'var(--primary)', opacity: 0.8 }}>
                {offer.logic}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
            <span>{offer.offerProducts.length} Products</span>
            <span className="font-medium" style={{ color: 'var(--primary)' }}>
              Save Big →
            </span>
          </div>
        </CardContent>

        <CardFooter className="relative z-10 px-4 sm:px-6 pb-4 sm:pb-6">
          <Button className="w-full group-hover:shadow-lg transition-shadow text-sm sm:text-base h-10 sm:h-11">
            View Offer
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
