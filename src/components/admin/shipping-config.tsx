'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { updateSiteConfig } from '@/lib/actions/site-config';
import { useRouter } from 'next/navigation';

interface ShippingConfigProps {
  config: {
    baseShippingRate: number;
    discountEnabled: boolean;
    discountPercent: number;
  };
}

export function ShippingConfig({ config }: ShippingConfigProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [shippingRate, setShippingRate] = useState(config.baseShippingRate);
  const [discountEnabled, setDiscountEnabled] = useState(config.discountEnabled);
  const [discountPercent, setDiscountPercent] = useState(config.discountPercent);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await updateSiteConfig({
        baseShippingRate: shippingRate,
        discountEnabled,
        discountPercent,
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Shipping configuration updated successfully',
        });
        router.refresh();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update shipping config',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipping Configuration</CardTitle>
        <CardDescription>
          Configure shipping rates and discounts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="shippingRate">Base Shipping Rate (per KG)</Label>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Rs.</span>
              <Input
                id="shippingRate"
                type="number"
                min="0"
                step="10"
                value={shippingRate}
                onChange={(e) => setShippingRate(Number(e.target.value))}
                className="max-w-xs"
              />
            </div>
            <p className="text-sm text-gray-500">
              This is the base rate charged per kilogram for shipping
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="discountEnabled"
                checked={discountEnabled}
                onChange={(e) => setDiscountEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="discountEnabled" className="cursor-pointer">
                Enable Global Discount
              </Label>
            </div>

            {discountEnabled && (
              <div className="space-y-2 ml-6">
                <Label htmlFor="discountPercent">Discount Percentage</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="discountPercent"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="max-w-xs"
                  />
                  <span className="text-gray-600">%</span>
                </div>
              </div>
            )}
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Configuration'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
