import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { getServerSession } from '@/lib/auth/server-session';

export const metadata: Metadata = {
  title: 'PitStop — Every rider deserves a place to stop.',
  description: 'Connect delivery riders and gig workers with verified rest stops, exclusive deals, clean facilities, and local micro-job opportunities across India.',
  keywords: ['gig workers', 'delivery riders', 'rest stops', 'Zomato', 'Swiggy', 'charging points', 'micro jobs', 'India'],
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
        <AuthProvider initialUser={initialUser}>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

