'use client';

import { useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cart-store';

interface CustomerNavProps {
  siteName: string;
}

export function CustomerNav({ siteName }: CustomerNavProps) {
  const [mounted, setMounted] = useState(false);
  const totalItems = useCartStore((state) => state.getTotalItems());

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
          {siteName}
        </h1>

        <Button
          variant="outline"
          className="relative"
          onClick={() => {
            const event = new CustomEvent('toggle-cart');
            window.dispatchEvent(event);
          }}
        >
          <ShoppingCart className="h-5 w-5" />
          <span
            className={`absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ${
              mounted && totalItems > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {mounted ? totalItems : 0}
          </span>
        </Button>
      </div>
    </nav>
  );
}
