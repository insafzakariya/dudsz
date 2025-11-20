import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { getSiteConfig } from '@/lib/actions/site-config';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();

  return {
    title: config.siteName,
    description: config.siteDescription || 'Premium T-Shirts Online Store',
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = await getSiteConfig();

  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider
          primaryColor={config.primaryColor}
          secondaryColor={config.secondaryColor}
          accentColor={config.accentColor}
          buttonColor={config.buttonColor}
          textColor={config.textColor}
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
