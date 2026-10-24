'use client';

import React from 'react';
import Link from 'next/link';
import { Navigation, Bike, Store, ShieldCheck, Droplet, Zap, Briefcase } from 'lucide-react';

export interface AuthCardLayoutProps {
  mode: 'login' | 'register';
  role: 'rider' | 'merchant' | 'admin';
  loginUrl?: string;
  registerUrl?: string;
  title: string;
  subtitle?: string;
  error?: string | null;
  children: React.ReactNode;
  footerContent?: React.ReactNode;
}

export const AuthCardLayout: React.FC<AuthCardLayoutProps> = ({
  mode,
  role,
  loginUrl,
  registerUrl,
  title,
  subtitle,
  error,
  children,
  footerContent,
}) => {
  const isRider = role === 'rider';
  const isMerchant = role === 'merchant';
  const isAdmin = role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-400 via-[#F7B928] to-amber-500 py-4 sm:py-10 px-3 sm:px-6 lg:px-8 flex flex-col items-center justify-center relative overflow-hidden">

      {/* Background Ambient Radial Accents */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-white/20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-amber-600/20 blur-3xl" aria-hidden="true" />

      {/* Top Brand Logo (Centered Header matching Loginpage.png) */}
      <div className="mb-4 sm:mb-6 flex items-center justify-center">
        <Link href="/" className="flex items-center gap-2.5 group focus:outline-none">
          <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-white text-pitstop-charcoal font-black shadow-lg transition-transform group-hover:scale-105">
            <Navigation className="h-5 w-5 sm:h-6 sm:w-6 fill-pitstop-charcoal stroke-pitstop-charcoal" />
          </div>
          <span className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-sm">
            PitStop
          </span>
        </Link>
      </div>

      {/* Main Split Card (Exact Loginpage.png geometry) */}
      <div className="w-full max-w-4xl rounded-3xl sm:rounded-[36px] bg-white shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 border border-amber-300/40 relative z-10">

        {/* ── LEFT PANEL: Warm Gradient Yellow Panel (NO SHOE IMAGE) ── */}
        <div className="md:col-span-5 bg-gradient-to-br from-amber-400 via-[#F7B928] to-[#F5A623] p-5 sm:p-8 md:p-10 flex flex-col justify-between text-pitstop-charcoal relative overflow-hidden">

          {/* Subtle Ambient Light Ray */}
          <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-white/15 blur-2xl pointer-events-none"></div>

          {/* Top: Pill Tabs Switch (LOGIN / SIGN UP as in Loginpage.png) */}
          {!isAdmin && loginUrl && registerUrl && (
            <div className="flex items-center justify-center p-1 rounded-full bg-amber-500/25 border border-white/30 backdrop-blur-xs mb-3 md:mb-8 w-fit mx-auto shadow-inner">
              <Link
                href={loginUrl}
                className={`rounded-full px-5 sm:px-6 py-2 text-xs font-black uppercase tracking-wider transition-all min-h-[36px] flex items-center justify-center ${mode === 'login'
                    ? 'bg-white text-pitstop-charcoal shadow-md scale-100'
                    : 'text-white/90 hover:text-white'
                  }`}
              >
                Login
              </Link>
              <Link
                href={registerUrl}
                className={`rounded-full px-5 sm:px-6 py-2 text-xs font-black uppercase tracking-wider transition-all min-h-[36px] flex items-center justify-center ${mode === 'register'
                    ? 'bg-white text-pitstop-charcoal shadow-md scale-100'
                    : 'text-white/90 hover:text-white'
                  }`}
              >
                Sign Up
              </Link>
            </div>
          )}

          {isAdmin && (
            <div className="mb-3 md:mb-6 inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-amber-500/30 text-white text-xs font-bold uppercase tracking-wider mx-auto">
              Admin Portal
            </div>
          )}

          {/* Center: Pure Vector Identity Showcase (Prominent on desktop, streamlined on mobile) */}
          <div className="hidden md:block my-auto py-6 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-pitstop-charcoal shadow-xl">
              {isRider && <Bike className="h-10 w-10 text-pitstop-charcoal stroke-[2.2]" />}
              {isMerchant && <Store className="h-10 w-10 text-pitstop-charcoal stroke-[2.2]" />}
              {isAdmin && <ShieldCheck className="h-10 w-10 text-pitstop-charcoal stroke-[2.2]" />}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-pitstop-charcoal leading-snug">
              {isRider && 'Every Rider Deserves a Place to Stop.'}
              {isMerchant && 'Partner With India\'s Gig Economy.'}
              {isAdmin && 'PitStop Control & Moderation.'}
            </h2>

            <p className="mt-2 text-xs sm:text-sm text-pitstop-charcoal/80 max-w-xs mx-auto leading-relaxed font-medium">
              {isRider && 'Verified rest zones, free clean drinking water, fast phone charging, and off-peak micro-jobs.'}
              {isMerchant && 'List verified rest facilities, drive off-peak foot traffic, and hire reliable gig workers.'}
              {isAdmin && 'Secure access for verified administrators only.'}
            </p>

            {/* Feature Pills */}
            {isRider && (
              <div className="mt-6 flex flex-wrap justify-center gap-2 text-[11px] font-bold text-pitstop-charcoal">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 shadow-2xs">
                  <Droplet className="h-3.5 w-3.5 text-blue-600" /> Free Water
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 shadow-2xs">
                  <Zap className="h-3.5 w-3.5 text-amber-600" /> Fast Charging
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 shadow-2xs">
                  <Briefcase className="h-3.5 w-3.5 text-emerald-600" /> Micro-Jobs
                </span>
              </div>
            )}
          </div>

          {/* Bottom Trust Assurance */}
          <div className="hidden md:flex pt-4 border-t border-pitstop-charcoal/15 items-center justify-center gap-1.5 text-xs font-semibold text-pitstop-charcoal/80">
            <ShieldCheck className="h-4 w-4 text-emerald-800" />
            <span>Secure HttpOnly Sessions</span>
          </div>

        </div>

        {/* ── RIGHT PANEL: Clean White Form Panel ── */}
        <div className="md:col-span-7 bg-white p-5 sm:p-8 md:p-10 flex flex-col justify-center">

          {/* Top Yellow Brand Swoosh Accent */}
          <div className="mb-4 sm:mb-6 flex justify-center">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-pitstop-yellow-light text-pitstop-yellow-dark shadow-sm">
              <Navigation className="h-5 w-5 sm:h-6 sm:w-6 fill-pitstop-yellow-dark stroke-pitstop-yellow-dark" />
            </div>
          </div>

          {/* Original Form Title & Subtitle */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-black tracking-tight text-pitstop-charcoal">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-xs text-pitstop-muted">
                {subtitle}
              </p>
            )}
          </div>

          {/* Error Alert Box */}
          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 flex items-start gap-2.5 animate-in fade-in"
            >
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* Form Content */}
          <div className="space-y-4">
            {children}
          </div>

          {/* Bottom Supplementary Links / Footer */}
          {footerContent && (
            <div className="mt-6 pt-4 border-t border-pitstop-border/60 text-center">
              {footerContent}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
