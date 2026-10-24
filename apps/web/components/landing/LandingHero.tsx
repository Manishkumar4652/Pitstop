'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Bike, Store, ShieldCheck } from 'lucide-react';
import { HeroPhone } from './HeroPhone';
import { RideStrip } from './RideStrip';

export const LandingHero: React.FC = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative overflow-hidden bg-[#FAFAF7] pt-8 pb-14 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24 text-[#0B0B0F]">
      
      {/* Soft yellow glow behind the hero that slowly breathes (opacity 0.6 to 0.9, 6s loop) */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-80 w-full max-w-4xl rounded-full bg-[#FBBF24]/15 blur-3xl animate-hero-glow"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Desktop 2-column layout (1024px+) / Mobile stacked layout (<1024px) */}
        <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
          
          {/* Left Column: Headline, subtext, role buttons, stat line */}
          <div className="text-center lg:text-left lg:col-span-7 xl:col-span-7">
            
            {/* Headline */}
            <h1
              style={{
                transitionDuration: '500ms',
                transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
              }}
              className={`text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-black tracking-tight text-[#0B0B0F] leading-[1.1] transition-all ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              Every Rider Deserves <br />
              <span className="inline-block mt-1">a Place to Stop</span>
            </h1>

            {/* Small Animated RideStrip directly below headline */}
            <RideStrip />

            {/* 3. Subtext (stagger index 2: 180ms) */}
            <p
              style={{
                transitionDelay: '180ms',
                transitionDuration: '500ms',
                transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
              }}
              className={`mt-4 sm:mt-5 text-base sm:text-lg text-[#0B0B0F]/70 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal transition-all ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              Connecting India&apos;s food and parcel delivery riders with verified neighborhood rest stops: free clean RO water, fast phone charging, hygienic washrooms, and afternoon earnings.
            </p>

            {/* 4. Two Role Buttons (stagger index 3: 270ms) */}
            <div
              style={{
                transitionDelay: '270ms',
                transitionDuration: '500ms',
                transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
              }}
              className={`mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3.5 sm:gap-4 max-w-xl mx-auto lg:mx-0 transition-all ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              
              {/* Button 1: Delivery Rider (Primary Yellow) */}
              <Link href="/explore" className="w-full sm:w-1/2">
                <button className="min-h-[50px] sm:min-h-[52px] w-full group inline-flex items-center justify-between gap-3 rounded-2xl bg-[#FBBF24] px-4 sm:px-5 py-3 text-left text-sm font-extrabold text-[#0B0B0F] shadow-sm transition-all duration-200 hover:bg-amber-400 hover:-translate-y-1 hover:shadow-md active:scale-[0.97]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/10 text-black">
                      <Bike className="h-5 w-5 stroke-[2.2]" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-black/60">
                        FOR RIDERS
                      </div>
                      <div className="text-sm font-black text-black leading-tight">
                        I am a Delivery Rider
                      </div>
                    </div>
                  </div>
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/10 transition-transform duration-200 group-hover:translate-x-1">
                    <ArrowRight className="h-4 w-4 text-black" />
                  </div>
                </button>
              </Link>

              {/* Button 2: Merchant Host (Secondary White with subtle border) */}
              <Link href="/for-merchants" className="w-full sm:w-1/2">
                <button className="min-h-[50px] sm:min-h-[52px] w-full group inline-flex items-center justify-between gap-3 rounded-2xl border border-black/15 bg-white px-4 sm:px-5 py-3 text-left text-sm font-extrabold text-[#0B0B0F] shadow-sm transition-all duration-200 hover:bg-gray-50 hover:border-black/30 hover:-translate-y-1 hover:shadow-md active:scale-[0.97]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                      <Store className="h-5 w-5 stroke-[2.2]" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-[#0B0B0F]/50">
                        FOR HOSTS
                      </div>
                      <div className="text-sm font-black text-[#0B0B0F] leading-tight">
                        I am a Merchant Host
                      </div>
                    </div>
                  </div>
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 transition-transform duration-200 group-hover:translate-x-1">
                    <ArrowRight className="h-4 w-4 text-[#0B0B0F]" />
                  </div>
                </button>
              </Link>

            </div>

            {/* 5. Network Stat Line (stagger index 4: 360ms) */}
            <div
              style={{
                transitionDelay: '360ms',
                transitionDuration: '500ms',
                transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
              }}
              className={`mt-6 sm:mt-8 flex items-center justify-center lg:justify-start gap-2 text-xs font-semibold text-[#0B0B0F]/60 transition-all ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Over 1,200+ active riders across 40+ verified stops in Bengaluru • 100% Free for riders</span>
            </div>

            {/* Mobile (under 1024px): Phone sits below role buttons and stat line, centered */}
            <div className="mt-8 flex justify-center lg:hidden">
              <HeroPhone />
            </div>

          </div>

          {/* Right Column (Desktop 1024px+): Phone sits to the right */}
          <div className="hidden lg:col-span-5 lg:flex lg:justify-end">
            <HeroPhone />
          </div>

        </div>

      </div>
    </section>
  );
};
