import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PitStop — Every rider deserves a place to stop.',
  description: 'Connect delivery riders and gig workers with verified rest stops, exclusive deals, clean facilities, and local micro-job opportunities across India.',
  keywords: ['gig workers', 'delivery riders', 'rest stops', 'Zomato', 'Swiggy', 'charging points', 'micro jobs', 'India'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col bg-pitstop-bg text-pitstop-charcoal antialiased">
        {children}
      </body>
    </html>
  );
}
