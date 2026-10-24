'use client';

import React from 'react';
import Link from 'next/link';
import { Store, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { useScrollReveal, useCountUp } from './useScrollReveal';

export const LandingMerchants: React.FC = () => {
  const [sectionRef, isRevealed] = useScrollReveal();

  // Numbers count up once when section enters view
  const ridersCount = useCountUp(18, isRevealed, 700);
  const dealsCount = useCountUp(12, isRevealed, 700);
  const tasksCount = useCountUp(2, isRevealed, 700);

  return (
    <section
      id="merchants"
      ref={sectionRef}
      className="relative scroll-mt-20 sm:scroll-mt-24 bg-white py-16 sm:py-24 border-y border-black/[0.06] text-[#0B0B0F]"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14 max-w-6xl mx-auto">
          
          {/* Left Column: Text from the Left (translateX -24px to 0) */}
          <div
            style={{
              transitionDuration: '600ms',
              transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
            }}
            className={`lg:col-span-7 transition-all ${
              isRevealed ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6'
            }`}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-200/60 mb-4">
              <Store className="h-3.5 w-3.5" />
              <span>FOR LOCAL SHOPS, CAFES &amp; TEA STALLS</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0B0B0F] leading-tight">
              Turn your shop into a PitStop
            </h2>

            <p className="mt-3 text-base text-[#0B0B0F]/70 leading-relaxed font-normal">
              Welcome delivery partners, fill unused tables during afternoon lulls, and access dependable on-demand helper support on your terms.
            </p>

            {/* 3 Benefit Points */}
            <div className="mt-7 space-y-4">
              <div className="flex items-start gap-3.5 group">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FBBF24] text-black font-bold mt-0.5 shadow-sm transition-transform duration-200 group-hover:scale-105">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#0B0B0F]">
                    Steady Afternoon Foot Traffic
                  </h3>
                  <p className="text-xs sm:text-sm text-[#0B0B0F]/70">
                    Riders visiting for water and phone charging frequently buy chai, snacks, and meals at your counter.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 group">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FBBF24] text-black font-bold mt-0.5 shadow-sm transition-transform duration-200 group-hover:scale-105">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#0B0B0F]">
                    On-Demand Helper Support
                  </h3>
                  <p className="text-xs sm:text-sm text-[#0B0B0F]/70">
                    Post 1–2 hour helper tasks during slow hours for sorting, packing, and urgent local drops without fixed payroll.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 group">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FBBF24] text-black font-bold mt-0.5 shadow-sm transition-transform duration-200 group-hover:scale-105">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#0B0B0F]">
                    100% Free Onboarding &amp; QR Standee
                  </h3>
                  <p className="text-xs sm:text-sm text-[#0B0B0F]/70">
                    No listing fees, hardware setup, or commissions. Receive your customized QR standee kit upon verification.
                  </p>
                </div>
              </div>
            </div>

            {/* Button: Onboard Your Shop Free */}
            <div className="mt-8">
              <Link href="/for-merchants">
                <button className="min-h-[48px] group inline-flex items-center justify-center gap-2.5 rounded-2xl bg-[#0B0B0F] px-7 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-neutral-800 active:scale-[0.97]">
                  <span>Onboard Your Shop Free</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </Link>
            </div>
          </div>

          {/* Right Column: Dashboard Mockup Card from the RIGHT (translateX 30px to 0) */}
          <div
            style={{
              transitionDuration: '650ms',
              transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
            }}
            className={`lg:col-span-5 flex justify-center transition-all ${
              isRevealed ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-7'
            }`}
          >
            {/* Floating Card Gently Floats (6px, 4s loop) */}
            <div className="w-full max-w-sm rounded-3xl border border-black/[0.08] bg-[#FAFAF7] p-6 shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] animate-gentle-float">
              
              <div className="flex items-center justify-between border-b border-black/[0.06] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FBBF24]/20 text-black font-extrabold border border-[#FBBF24]/30">
                    <Store className="h-4 w-4 text-amber-800" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0B0B0F]">
                      PitStop Merchant Hub
                    </h4>
                    <p className="text-[11px] text-[#0B0B0F]/50">Koramangala Partner Hub</p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>

              {/* Stats Grid with Animated Count-Up Numbers */}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-white p-2.5 border border-black/[0.04] shadow-2xs">
                  <div className="text-base font-black text-[#0B0B0F] tabular-nums">
                    {ridersCount}
                  </div>
                  <div className="text-[10px] text-[#0B0B0F]/60 mt-0.5">Riders Today</div>
                </div>
                <div className="rounded-xl bg-white p-2.5 border border-black/[0.04] shadow-2xs">
                  <div className="text-base font-black text-[#0B0B0F] tabular-nums">
                    {dealsCount}
                  </div>
                  <div className="text-[10px] text-[#0B0B0F]/60 mt-0.5">Deals Claimed</div>
                </div>
                <div className="rounded-xl bg-white p-2.5 border border-black/[0.04] shadow-2xs">
                  <div className="text-base font-black text-[#0B0B0F] tabular-nums">
                    {tasksCount}
                  </div>
                  <div className="text-[10px] text-[#0B0B0F]/60 mt-0.5">Helper Tasks</div>
                </div>
              </div>

              {/* Live Task Banner */}
              <div className="mt-4 rounded-xl bg-amber-50/80 p-3 border border-amber-200/60">
                <div className="text-[11px] font-bold text-amber-900">
                  Active Helper Task (2:30 PM – 4:00 PM)
                </div>
                <div className="text-[11px] text-amber-800/80 mt-0.5">
                  Parcel Sorting • 1 Rider Assigned
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-black/[0.06] flex items-center justify-between text-[11px] text-[#0B0B0F]/60">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  QR Standee #KA-04 Active
                </span>
                <span className="font-bold text-[#0B0B0F]">Verified Host</span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
