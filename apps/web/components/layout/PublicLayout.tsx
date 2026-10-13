import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export interface PublicLayoutProps {
  children: React.ReactNode;
  theme?: 'light' | 'dark';
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children, theme = 'light' }) => {
  const isDark = theme === 'dark';
  return (
    <div className={`flex min-h-screen flex-col ${isDark ? 'bg-[#12131C] text-white' : 'bg-pitstop-bg text-pitstop-charcoal'} antialiased`}>
      <Navbar theme={theme} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};
