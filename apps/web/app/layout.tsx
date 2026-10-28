import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { LanguageProvider } from '@/lib/i18n';
import { getServerSession } from '@/lib/auth/server-session';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#F7B928',
};

export const metadata: Metadata = {
  title: 'PitStop — Every rider deserves a place to stop.',
  description: 'Connect delivery riders and gig workers with verified rest stops, exclusive deals, clean facilities, and local micro-job opportunities across India.',
  keywords: ['gig workers', 'delivery riders', 'rest stops', 'Zomato', 'Swiggy', 'charging points', 'micro jobs', 'India'],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PitStop',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialUser = await getServerSession();

  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col bg-pitstop-bg text-pitstop-charcoal antialiased">
        <LanguageProvider>
          <AuthProvider initialUser={initialUser}>
            {children}
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

