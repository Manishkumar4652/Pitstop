'use client';

import React from 'react';
import Link from 'next/link';
import { Droplet, Zap, ShieldCheck, Briefcase, Clock, ArrowRight } from 'lucide-react';
import { useScrollReveal } from './useScrollReveal';

export const LandingBenefits: React.FC = () => {
  const [sectionRef, isRevealed] = useScrollReveal();

  return (
    <section
      id="riders"
      ref={sectionRef}
      className="relative scroll-mt-20 sm:scroll-mt-24 bg-[#FAFAF7] py-16 sm:py-24 text-[#0B0B0F]"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading - Fade & translateY 16px */}
        <div
          style={{
            transitionDuration: '500ms',
            transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          className={`text-center max-w-xl mx-auto mb-12 sm:mb-16 transition-all ${
            isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <span className="text-xs font-black uppercase tracking-widest text-[#FBBF24]">
            BENEFITS FOR RIDERS
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-[#0B0B0F]">
            Everything You Need on the Road
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#0B0B0F]/70">
            Dignified, clean facilities verified by our field team across Bengaluru.
          </p>
        </div>

        {/* ── 2x2 BENTO GRID (stagger 80ms, fade + translateY 14px) ── */}
        <div className="grid gap-6 sm:grid-cols-2 max-w-5xl mx-auto">
          
          {/* Card 1: RO Water (stagger 0ms) */}
          <div
            style={{
              transitionDelay: '0ms',
              transitionDuration: '450ms',
              transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
            }}
            className={`group rounded-2xl sm:rounded-3xl border border-black/[0.08] bg-white p-6 sm:p-8 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-black/20 active:scale-[0.98] flex flex-col justify-between ${
              isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3.5'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 transition-transform duration-200 group-hover:scale-105">
                  <Droplet className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                  100% Free
                </span>
              </div>

              <h3 className="mt-5 text-xl font-bold text-[#0B0B0F]">
                Clean RO Drinking Water
              </h3>

              <p className="mt-2 text-sm text-[#0B0B0F]/70 leading-relaxed font-normal">
                Pure, cold RO drinking water to keep you refreshed and hydrated throughout long shifts without spending money on disposable plastic bottles.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-black/[0.06] flex items-center gap-1.5 text-xs text-[#0B0B0F]/60 font-semibold">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span>Chilled &amp; Filtered • Refill Anytime</span>
            </div>
          </div>

          {/* Card 2: Fast Charging (stagger 80ms) */}
          <div
            style={{
              transitionDelay: '80ms',
              transitionDuration: '450ms',
              transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
            }}
            className={`group rounded-2xl sm:rounded-3xl border border-black/[0.08] bg-white p-6 sm:p-8 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-black/20 active:scale-[0.98] flex flex-col justify-between ${
              isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3.5'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 transition-transform duration-200 group-hover:scale-105">
                  <Zap className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                  Fast Ports
                </span>
              </div>

              <h3 className="mt-5 text-xl font-bold text-[#0B0B0F]">
                Fast Charging (Phones &amp; EV)
              </h3>

              <p className="mt-2 text-sm text-[#0B0B0F]/70 leading-relaxed font-normal">
                Dedicated 65W fast-charging sockets for smartphones, power banks, and electric two-wheeler battery top-ups so you never miss surge hours.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-black/[0.06] flex items-center gap-1.5 text-xs text-[#0B0B0F]/60 font-semibold">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>Type-C &amp; Multi-Pin Sockets</span>
            </div>
          </div>

          {/* Card 3: Clean Washroom (stagger 160ms) */}
          <div
            style={{
              transitionDelay: '160ms',
              transitionDuration: '450ms',
              transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
            }}
            className={`group rounded-2xl sm:rounded-3xl border border-black/[0.08] bg-white p-6 sm:p-8 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-black/20 active:scale-[0.98] flex flex-col justify-between ${
              isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3.5'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 transition-transform duration-200 group-hover:scale-105">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                  Hygienic
                </span>
              </div>

              <h3 className="mt-5 text-xl font-bold text-[#0B0B0F]">
                Clean Washroom
              </h3>

              <p className="mt-2 text-sm text-[#0B0B0F]/70 leading-relaxed font-normal">
                Hygienic, well-maintained restrooms with soap and running water. Accessible to on-duty delivery partners with dignity and respect.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-black/[0.06] flex items-center gap-1.5 text-xs text-[#0B0B0F]/60 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Regularly Sanitized &amp; Audited</span>
            </div>
          </div>

          {/* ── CARD 4: OFF-PEAK MICRO-JOBS (stagger 240ms, faint yellow glow once on enter) ── */}
          <div
            style={{
              transitionDelay: '240ms',
              transitionDuration: '450ms',
              transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
            }}
            className={`group rounded-2xl sm:rounded-3xl border border-[#FBBF24]/40 bg-[#0B0B0F] p-6 sm:p-8 text-white shadow-xl transition-all duration-200 hover:-translate-y-1 hover:border-[#FBBF24] active:scale-[0.98] flex flex-col justify-between ${
              isRevealed
                ? 'opacity-100 translate-y-0 animate-micro-jobs-glow'
                : 'opacity-0 translate-y-3.5'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FBBF24]/15 text-[#FBBF24] border border-[#FBBF24]/30 transition-transform duration-200 group-hover:scale-105">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div className="inline-flex items-center gap-1 rounded-full bg-[#FBBF24]/15 px-2.5 py-1 text-[11px] font-bold text-[#FBBF24] border border-[#FBBF24]/30">
                  <Clock className="h-3 w-3" />
                  <span>2 PM – 5 PM</span>
                </div>
              </div>

              <h3 className="mt-5 text-xl font-bold text-white">
                Off-Peak Micro-Jobs
              </h3>

              {/* Exact Line Requested */}
              <div className="mt-2 inline-block rounded-xl bg-white/10 px-3 py-1 text-xs font-black text-[#FBBF24] border border-white/10">
                Earn ₹150 to ₹350 in 2 to 5 PM lull hours
              </div>

              <p className="mt-3 text-sm text-gray-400 leading-relaxed font-normal">
                Turn quiet afternoon delivery hours into guaranteed extra income by assisting neighborhood merchants with package sorting, packing, or express local drops.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
              <Link
                href="/jobs"
                className="group/btn min-h-[44px] inline-flex items-center gap-2 text-xs font-extrabold text-[#FBBF24] hover:underline active:scale-[0.97] transition-all duration-200"
              >
                <span>Browse Afternoon Jobs</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
              </Link>
              <span className="text-[10px] text-gray-500 font-semibold">Instant payout</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
