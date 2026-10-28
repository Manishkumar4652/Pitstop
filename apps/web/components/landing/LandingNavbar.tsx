'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navigation, ArrowRight, X } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { LanguageToggle } from '@/components/common/LanguageToggle';

export const LandingNavbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { isHindi } = useLanguage();

  // Trigger desktop entrance transitions on mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sticky navbar with blur and border after 20px scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Lock body scroll while mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const navLinks = [
    { label: isHindi ? 'यह कैसे काम करता है' : 'How it Works', href: '#how-it-works' },
    { label: isHindi ? 'राइडर्स' : 'Riders', href: '#riders' },
    { label: isHindi ? 'मर्चेंट्स' : 'Merchants', href: '#merchants' },
    { label: isHindi ? 'सवाल-जवाब' : 'FAQ', href: '#faq' },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ease-out ${
          isScrolled
            ? 'border-b border-black/[0.08] bg-[#FAFAF7]/90 backdrop-blur-md shadow-xs'
            : 'border-b border-transparent bg-[#FAFAF7]/60'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Brand Logo - slides in from left on desktop */}
          <Link
            href="/"
            className={`flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-[#FBBF24] rounded-lg p-1 transition-all duration-500 ease-out ${
              mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-5'
            }`}
            aria-label="PitStop Homepage"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FBBF24] text-[#0B0B0F] font-black shadow-sm transition-transform duration-200 hover:scale-105 active:scale-95">
              <Navigation className="h-5 w-5 fill-[#0B0B0F] stroke-[#0B0B0F]" />
            </div>
            <span className="text-xl font-black tracking-tight text-[#0B0B0F]">
              PitStop
            </span>
          </Link>

          {/* Desktop Navigation Links - slide in from RIGHT with 70ms stagger */}
          <nav className="hidden items-center gap-7 md:flex" aria-label="Main Navigation">
            {navLinks.map((link, idx) => (
              <a
                key={link.href}
                href={link.href}
                style={{
                  transitionDelay: `${70 + idx * 70}ms`,
                  transitionDuration: '450ms',
                }}
                className={`text-sm font-semibold text-[#0B0B0F]/70 transition-all hover:text-[#0B0B0F] focus:outline-none focus:ring-2 focus:ring-[#FBBF24] rounded px-1.5 py-0.5 ${
                  mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTAs & Language Switcher */}
          <div className="hidden items-center gap-3 md:flex">
            {/* Language Switcher Pill Button */}
            <LanguageToggle isDark={false} />

            <Link
              href="/rider/login"
              style={{
                transitionDelay: `${70 + navLinks.length * 70}ms`,
                transitionDuration: '450ms',
              }}
              className={`min-h-[44px] inline-flex items-center text-sm font-bold text-[#0B0B0F] hover:text-[#0B0B0F]/80 transition-all focus:outline-none focus:ring-2 focus:ring-[#FBBF24] rounded-xl px-3.5 py-2 active:scale-[0.97] ${
                mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
              }`}
            >
              {isHindi ? 'लॉग इन' : 'Log In'}
            </Link>

            <div
              style={{
                transitionDelay: `${70 + (navLinks.length + 1) * 70}ms`,
                transitionDuration: '450ms',
              }}
              className={`transition-all ${
                mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
              }`}
            >
              <Link href="/explore">
                <button className="min-h-[44px] group inline-flex items-center gap-2 rounded-xl bg-[#FBBF24] px-5 py-2.5 text-sm font-extrabold text-[#0B0B0F] shadow-sm transition-all duration-200 hover:bg-amber-400 active:scale-[0.97]">
                  <span>{isHindi ? 'रेस्ट स्टॉप खोजें' : 'Find a Rest Stop'}</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </Link>
            </div>
          </div>

          {/* Mobile Right Controls: Hamburger Button */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-white text-[#0B0B0F] shadow-sm active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-[#FBBF24] transition-transform duration-200"
              aria-label={isOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              aria-expanded={isOpen}
            >
              <div className="relative flex h-4 w-5 flex-col justify-between" aria-hidden="true">
                <span
                  className={`h-0.5 w-full bg-[#0B0B0F] rounded-full transition-all duration-300 ease-out origin-center ${
                    isOpen ? 'translate-y-[7px] rotate-45' : ''
                  }`}
                />
                <span
                  className={`h-0.5 w-full bg-[#0B0B0F] rounded-full transition-opacity duration-200 ${
                    isOpen ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                <span
                  className={`h-0.5 w-full bg-[#0B0B0F] rounded-full transition-all duration-300 ease-out origin-center ${
                    isOpen ? '-translate-y-[7px] -rotate-45' : ''
                  }`}
                />
              </div>
            </button>
          </div>

        </div>
      </header>

      {/* ── MOBILE SLIDING DRAWER FROM THE RIGHT (85% Width, Dark Blurred Backdrop) ── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Blurred Dark Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Sliding Panel from Right */}
          <div
            className="fixed inset-y-0 right-0 w-[85%] max-w-sm bg-[#0B0B0F] p-6 shadow-2xl flex flex-col justify-between text-white transition-transform duration-300 ease-out animate-slide-in-right"
            role="dialog"
            aria-modal="true"
          >
            <div>
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between pb-6 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FBBF24] text-black font-black">
                    <Navigation className="h-4 w-4 fill-black stroke-black" />
                  </div>
                  <span className="text-lg font-black text-white">PitStop</span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-300 hover:text-white active:scale-[0.97] transition-all duration-200"
                  aria-label="Close Navigation Menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Language Switcher inside Drawer */}
              <div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-xs font-bold text-gray-300">
                  {isHindi ? 'भाषा चुनें:' : 'Language:'}
                </span>
                <LanguageToggle isDark={true} />
              </div>

              {/* Nav Links with 50ms Stagger Fade-in Effect */}
              <nav className="mt-6 flex flex-col gap-1.5" aria-label="Mobile Navigation Links">
                {navLinks.map((link, idx) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    style={{
                      animation: `landingFadeUp 260ms cubic-bezier(0.22, 1, 0.36, 1) ${idx * 50}ms both`,
                    }}
                    className="min-h-[44px] flex items-center rounded-xl px-4 py-2.5 text-base font-bold text-gray-200 transition-colors hover:bg-white/10 hover:text-[#FBBF24] active:scale-[0.98]"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-white/10 flex flex-col gap-3">
              <Link
                href="/rider/login"
                onClick={() => setIsOpen(false)}
                className="min-h-[48px] flex items-center justify-center w-full rounded-xl border border-white/15 bg-white/5 text-sm font-bold text-white hover:bg-white/10 active:scale-[0.97] transition-all duration-200"
              >
                {isHindi ? 'राइडर लॉग इन' : 'Rider Log In'}
              </Link>

              <Link
                href="/merchant/login"
                onClick={() => setIsOpen(false)}
                className="min-h-[48px] flex items-center justify-center w-full rounded-xl border border-white/15 bg-white/5 text-sm font-bold text-gray-300 hover:text-white hover:bg-white/10 active:scale-[0.97] transition-all duration-200"
              >
                {isHindi ? 'मर्चेंट पोर्टल' : 'Merchant Portal'}
              </Link>

              <Link
                href="/explore"
                onClick={() => setIsOpen(false)}
                className="min-h-[48px] group flex items-center justify-center gap-2 w-full rounded-xl bg-[#FBBF24] text-sm font-extrabold text-black shadow-md hover:bg-amber-400 active:scale-[0.97] transition-all duration-200"
              >
                <span>{isHindi ? 'रेस्ट स्टॉप खोजें' : 'Find a Rest Stop'}</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
