'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { Image as ImageIcon, Save, RefreshCw } from 'lucide-react';

interface ImageSettingsProps {
  config: {
    watermarkText: string | null;
  };
}

export function ImageSettings({ config }: ImageSettingsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [watermarkText, setWatermarkText] = useState(config.watermarkText || 'DUDSZ.lk');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/site-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watermarkText }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Watermark settings updated successfully',
        });
        router.refresh();
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update watermark settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setWatermarkText(config.watermarkText || 'DUDSZ.lk');
  };

  return (
    <Card className="overflow-hidden border-2 border-gray-100">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <ImageIcon className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <CardTitle className="text-xl">Image Configuration</CardTitle>
            <CardDescription className="text-gray-600 mt-1">
              Configure watermark settings for uploaded images
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Watermark Text */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="watermark" className="text-base font-semibold text-gray-700">
              Watermark Text
            </Label>
            <p className="text-sm text-gray-500 mt-1">
              This text will appear as a watermark on all uploaded product images
            </p>
          </div>
          <Input
            id="watermark"
            value={watermarkText}
            onChange={(e) => setWatermarkText(e.target.value)}
            placeholder="Enter watermark text"
            className="border-2 border-gray-200 focus:border-purple-500 transition-colors text-lg"
          />
        </div>

        {/* Preview */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-lg border-2 border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-3">Preview</p>
          <div className="bg-white p-8 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center min-h-[200px] relative">
            <div className="text-center">
              <ImageIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-sm text-gray-400 mb-2">Product Image</p>
            </div>
            {watermarkText && (
              <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-300 shadow-lg">
                <p className="text-lg font-bold text-gray-700">{watermarkText}</p>
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <div className="flex items-start gap-3">
            <ImageIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">How it works</p>
              <p>The watermark will be automatically added to the bottom-right corner of all new product images during upload.</p>
              <p className="mt-2">Existing images will not be affected. Only newly uploaded images will have the watermark.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            disabled={isSaving}
            className="border-2"
          >
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
