'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { updateSiteConfig } from '@/lib/actions/site-config';
import { useRouter } from 'next/navigation';

interface ThemeEditorProps {
  config: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    buttonColor: string;
    textColor: string;
  };
}

export function ThemeEditor({ config }: ThemeEditorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [colors, setColors] = useState({
    primaryColor: config.primaryColor,
    secondaryColor: config.secondaryColor,
    accentColor: config.accentColor,
    buttonColor: config.buttonColor,
    textColor: config.textColor,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await updateSiteConfig(colors);

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Theme colors updated successfully',
        });
        router.refresh();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update theme',
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

  const resetToDefaults = () => {
    setColors({
      primaryColor: '#2596be',
      secondaryColor: '#0b1120',
      accentColor: '#ffffff',
      buttonColor: '#2596be',
      textColor: '#000000',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dynamic Theme Editor</CardTitle>
        <CardDescription>
          Customize your store's branding colors. Changes will reflect instantly across the entire site.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Brand Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={colors.primaryColor}
                  onChange={(e) =>
                    setColors({ ...colors, primaryColor: e.target.value })
                  }
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={colors.primaryColor}
                  onChange={(e) =>
                    setColors({ ...colors, primaryColor: e.target.value })
                  }
                  className="flex-1"
                  placeholder="#2596be"
                />
              </div>
              <div
                className="h-12 rounded-md border"
                style={{ backgroundColor: colors.primaryColor }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Secondary Brand Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={colors.secondaryColor}
                  onChange={(e) =>
                    setColors({ ...colors, secondaryColor: e.target.value })
                  }
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={colors.secondaryColor}
                  onChange={(e) =>
                    setColors({ ...colors, secondaryColor: e.target.value })
                  }
                  className="flex-1"
                  placeholder="#0b1120"
                />
              </div>
              <div
                className="h-12 rounded-md border"
                style={{ backgroundColor: colors.secondaryColor }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accentColor">Accent Color</Label>
              <div className="flex gap-2">
                <Input
                  id="accentColor"
                  type="color"
                  value={colors.accentColor}
                  onChange={(e) =>
                    setColors({ ...colors, accentColor: e.target.value })
                  }
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={colors.accentColor}
                  onChange={(e) =>
                    setColors({ ...colors, accentColor: e.target.value })
                  }
                  className="flex-1"
                  placeholder="#ffffff"
                />
              </div>
              <div
                className="h-12 rounded-md border"
                style={{ backgroundColor: colors.accentColor }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="buttonColor">Button Color</Label>
              <div className="flex gap-2">
                <Input
                  id="buttonColor"
                  type="color"
                  value={colors.buttonColor}
                  onChange={(e) =>
                    setColors({ ...colors, buttonColor: e.target.value })
                  }
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={colors.buttonColor}
                  onChange={(e) =>
                    setColors({ ...colors, buttonColor: e.target.value })
                  }
                  className="flex-1"
                  placeholder="#2596be"
                />
              </div>
              <div
                className="h-12 rounded-md border"
                style={{ backgroundColor: colors.buttonColor }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="textColor">Text Color</Label>
              <div className="flex gap-2">
                <Input
                  id="textColor"
                  type="color"
                  value={colors.textColor}
                  onChange={(e) =>
                    setColors({ ...colors, textColor: e.target.value })
                  }
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={colors.textColor}
                  onChange={(e) =>
                    setColors({ ...colors, textColor: e.target.value })
                  }
                  className="flex-1"
                  placeholder="#000000"
                />
              </div>
              <div
                className="h-12 rounded-md border"
                style={{ backgroundColor: colors.textColor }}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Theme'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={resetToDefaults}
              disabled={isLoading}
            >
              Reset to Defaults
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
