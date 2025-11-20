import { db } from '@/lib/db';
import { getSiteConfig } from '@/lib/actions/site-config';
import { CustomerNav } from '@/components/customer/customer-nav';
import { OfferCard } from '@/components/customer/offer-card';
import { ProductCard } from '@/components/customer/product-card';
import { CartDrawer } from '@/components/customer/cart-drawer';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const config = await getSiteConfig();

  // Fetch featured offers (max 3)
  const featuredOffers = await db.offer.findMany({
    where: {
      enabled: true,
      featured: true,
    },
    include: {
      offerProducts: {
        include: {
          product: true,
        },
      },
    },
    take: 3,
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Fetch enabled products
  const products = await db.product.findMany({
    where: {
      enabled: true,
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
      { featured: 'desc' },
      { createdAt: 'desc' },
    ],
    take: 12,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNav siteName={config.siteName} />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-xl mb-8 sm:mb-10 shadow-lg">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
              backgroundSize: '32px 32px',
            }}
          />
          <div
            className="relative px-6 py-8 sm:py-10 flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            <div className="text-center sm:text-left">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-3">
                <span className="text-white text-xs sm:text-sm font-medium">
                  ✨ Premium Quality
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
                {config.siteName}
              </h1>
              <p className="text-sm sm:text-base text-white/90 max-w-md">
                {config.siteDescription || 'Premium T-Shirts Online Store'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center sm:justify-end">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                <div className="text-white font-bold text-lg sm:text-xl">100+</div>
                <div className="text-white/80 text-xs">Products</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                <div className="text-white font-bold text-lg sm:text-xl">Fast</div>
                <div className="text-white/80 text-xs">Delivery</div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Offers */}
        {featuredOffers.length > 0 && (
          <section className="mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Special Offers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {featuredOffers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          </section>
        )}

        {/* Products */}
        <section>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Our Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {products.length === 0 && featuredOffers.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">
              No products available at the moment. Check back soon!
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        className="mt-20 py-8 text-white"
        style={{ backgroundColor: 'var(--secondary)' }}
      >
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2024 {config.siteName}. All rights reserved.</p>
          {config.contactEmail && (
            <p className="mt-2 text-sm opacity-75">{config.contactEmail}</p>
          )}
        </div>
      </footer>

      <CartDrawer />
    </div>
  );
}
