import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeEditor } from '@/components/admin/theme-editor';
import { ShippingConfig } from '@/components/admin/shipping-config';
import { getSiteConfig } from '@/lib/actions/site-config';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const config = await getSiteConfig();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-600">Manage your store configuration</p>
      </div>

      <Tabs defaultValue="theme" className="space-y-6">
        <TabsList>
          <TabsTrigger value="theme">Theme & Branding</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>

        <TabsContent value="theme" className="space-y-4">
          <ThemeEditor config={config} />
        </TabsContent>

        <TabsContent value="shipping" className="space-y-4">
          <ShippingConfig config={config} />
        </TabsContent>

        <TabsContent value="general" className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">General Settings</h3>
            <p className="text-gray-500">Coming soon...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
