'use client';

import React, { useState, useEffect } from 'react';
import { Droplet, Search } from 'lucide-react';

interface HeroPhoneProps {
  className?: string;
}

export const HeroPhone: React.FC<HeroPhoneProps> = ({ className = '' }) => {
  const [mounted, setMounted] = useState(false);
  const [animationStage, setAnimationStage] = useState(0);

  useEffect(() => {
    setMounted(true);

    // Staged animation timeline (subtle, calm, non-blocking)
    // Stage 1: Phone enters (200ms)
    const t1 = setTimeout(() => setAnimationStage(1), 200);
    // Stage 2: Pins drop in (550ms)
    const t2 = setTimeout(() => setAnimationStage(2), 550);
    // Stage 3: Route line draws (1000ms)
    const t3 = setTimeout(() => setAnimationStage(3), 1000);
    // Stage 4: Card slides up & interactive loops start (2000ms)
    const t4 = setTimeout(() => setAnimationStage(4), 2000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`relative select-none pointer-events-none flex items-center justify-center ${className}`}
    >
      {/* Subtle Yellow Ambient Glow behind phone */}
      <div
        className="pointer-events-none absolute -inset-6 sm:-inset-8 rounded-[48px] bg-[#FBBF24]/20 blur-2xl -z-10"
        aria-hidden="true"
      />

      {/* Whole Phone Outer Container with Slow Float (6s loop) */}
      <div
        className={`w-[230px] h-[460px] sm:w-[250px] sm:h-[500px] lg:w-[270px] lg:h-[540px] rounded-[36px] sm:rounded-[40px] p-2 sm:p-2.5 bg-[#0B0B0F] shadow-2xl ring-1 ring-white/10 transition-all duration-700 ease-out will-change-transform ${
          mounted
            ? 'opacity-100 translate-x-0 translate-y-0'
            : 'opacity-0 translate-y-6 lg:translate-y-0 lg:translate-x-10'
        } ${animationStage >= 4 ? 'animate-phone-float' : ''}`}
      >
        {/* Phone Screen Container */}
        <div className="relative w-full h-full overflow-hidden rounded-[28px] sm:rounded-[32px] bg-[#F4F5F2] flex flex-col justify-between border border-black/10 shadow-inner">
          
          {/* Top Notch / Speaker Pill */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center">
            <div className="h-3.5 w-20 rounded-full bg-[#0B0B0F] flex items-center justify-end px-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
            </div>
          </div>

          {/* Top Header Bar on Phone Screen */}
          <div className="relative z-20 pt-6 px-3.5 pb-2 bg-gradient-to-b from-[#F4F5F2] via-[#F4F5F2]/90 to-transparent">
            <div className="flex items-center justify-between mt-1 mb-1.5">
              <span className="text-[11px] font-black tracking-tight text-[#0B0B0F]">
                Nearby PitStops
              </span>
              <span className="text-[9px] font-bold text-[#0B0B0F]/50">
                Bengaluru
              </span>
            </div>

            {/* Tiny Search Pill */}
            <div className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 shadow-2xs border border-black/5 text-[#0B0B0F]/60">
              <Search className="h-3 w-3 shrink-0 text-[#0B0B0F]/40" />
              <span className="text-[10px] font-medium truncate">
                Koramangala, 4th Block
              </span>
            </div>
          </div>

          {/* ── VECTOR MAP CANVAS (Background SVG Roads & City Blocks) ── */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="w-full h-full"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* City Blocks (Muted off-white/gray) */}
              <rect x="8" y="15" width="30" height="18" rx="3" fill="#E8ECE5" />
              <rect x="52" y="12" width="42" height="16" rx="3" fill="#EFF1EC" />
              <rect x="6" y="38" width="28" height="24" rx="3" fill="#EFF1EC" />
              <rect x="42" y="34" width="52" height="18" rx="3" fill="#E8ECE5" />
              <rect x="8" y="68" width="32" height="22" rx="3" fill="#E8ECE5" />
              <rect x="50" y="58" width="44" height="30" rx="3" fill="#EFF1EC" />

              {/* Secondary Roads */}
              <path d="M -5 35 Q 30 33 105 30" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" />
              <path d="M 44 -5 L 44 105" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" />
              <path d="M -5 65 Q 40 63 105 60" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
              <path d="M -5 18 L 105 50" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />

              {/* Main Avenue Arteries */}
              <path d="M -5 35 Q 30 33 105 30" stroke="#DFE3DC" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M 44 -5 L 44 105" stroke="#DFE3DC" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M -5 65 Q 40 63 105 60" stroke="#DFE3DC" strokeWidth="2" strokeLinecap="round" />

              {/* 4. DOTTED ROUTE LINE (Draws from Rider dot at 28,48 to Nearest Pin at 64,40) */}
              <path
                d="M 28 48 C 36 43, 50 46, 64 40"
                stroke="#0B0B0F"
                strokeWidth="0.85"
                strokeLinecap="round"
                strokeDasharray="1.5 1.5"
                style={{
                  strokeDashoffset: animationStage >= 3 ? 0 : 45,
                  transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              />
            </svg>
          </div>

          {/* ── MAP OVERLAYS: RIDER DOT & PITSTOP PINS ── */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            
            {/* 2. RIDER LOCATION DOT (Blue dot with soft pulsing ring loop) at 28% left, 48% top */}
            <div className="absolute left-[28%] top-[48%] -translate-x-1/2 -translate-y-1/2">
              <div className="relative flex items-center justify-center">
                <span className="absolute h-7 w-7 rounded-full bg-blue-500/30 animate-ping opacity-75" />
                <span className="relative flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-600 ring-2 ring-white shadow-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                </span>
              </div>
            </div>

            {/* 3. PIN 1: NEAREST PITSTOP (Yellow #FBBF24 with dark center) at 64% left, 40% top */}
            <div
              style={{
                transitionDelay: '0ms',
                transitionDuration: '450ms',
                transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
              className={`absolute left-[64%] top-[40%] -translate-x-1/2 -translate-y-full transition-all ${
                animationStage >= 2
                  ? 'opacity-100 translate-y-0 scale-100'
                  : 'opacity-0 -translate-y-4 scale-75'
              }`}
            >
              <div className="relative flex flex-col items-center">
                {/* Nearest pin gentle pulse aura */}
                <span className="absolute -top-1.5 h-8 w-8 rounded-full bg-[#FBBF24]/35 animate-pulse" />
                
                {/* Pin Head */}
                <div className="relative flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-[#FBBF24] border-2 border-[#0B0B0F] shadow-md">
                  <div className="h-2 w-2 rounded-full bg-[#0B0B0F]" />
                </div>
                {/* Pin Point */}
                <div className="w-1.5 h-1.5 bg-[#0B0B0F] rotate-45 -mt-1 rounded-[1px]" />
                {/* Pin Shadow */}
                <div className="w-3.5 h-1 bg-black/20 rounded-full mt-0.5 blur-[0.5px]" />
              </div>
            </div>

            {/* PIN 2: North PitStop at 24% left, 22% top (stagger 250ms) */}
            <div
              style={{
                transitionDelay: '250ms',
                transitionDuration: '450ms',
                transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
              className={`absolute left-[24%] top-[22%] -translate-x-1/2 -translate-y-full transition-all ${
                animationStage >= 2
                  ? 'opacity-100 translate-y-0 scale-100'
                  : 'opacity-0 -translate-y-4 scale-75'
              }`}
            >
              <div className="relative flex flex-col items-center">
                <div className="relative flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-[#FBBF24] border-[1.5px] border-[#0B0B0F] shadow-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#0B0B0F]" />
                </div>
                <div className="w-1 h-1 bg-[#0B0B0F] rotate-45 -mt-0.5 rounded-[1px]" />
                <div className="w-3 h-0.5 bg-black/15 rounded-full mt-0.5 blur-[0.5px]" />
              </div>
            </div>

            {/* PIN 3: South PitStop at 74% left, 66% top (stagger 500ms) */}
            <div
              style={{
                transitionDelay: '500ms',
                transitionDuration: '450ms',
                transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
              className={`absolute left-[74%] top-[66%] -translate-x-1/2 -translate-y-full transition-all ${
                animationStage >= 2
                  ? 'opacity-100 translate-y-0 scale-100'
                  : 'opacity-0 -translate-y-4 scale-75'
              }`}
            >
              <div className="relative flex flex-col items-center">
                <div className="relative flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-[#FBBF24] border-[1.5px] border-[#0B0B0F] shadow-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#0B0B0F]" />
                </div>
                <div className="w-1 h-1 bg-[#0B0B0F] rotate-45 -mt-0.5 rounded-[1px]" />
                <div className="w-3 h-0.5 bg-black/15 rounded-full mt-0.5 blur-[0.5px]" />
              </div>
            </div>

          </div>

          {/* 5. FLOATING CARD AT THE BOTTOM OF THE SCREEN */}
          <div className="relative z-30 p-2.5 sm:p-3">
            <div
              style={{
                transitionDuration: '500ms',
                transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
              }}
              className={`rounded-2xl bg-white/95 backdrop-blur-md p-2.5 sm:p-3 shadow-lg border border-black/10 transition-all ${
                animationStage >= 4
                  ? 'opacity-100 translate-y-0 animate-card-float'
                  : 'opacity-0 translate-y-5'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl bg-[#FBBF24] text-[#0B0B0F] shadow-xs">
                    <Droplet className="h-3.5 w-3.5 fill-[#0B0B0F] stroke-[#0B0B0F]" />
                  </div>
                  <div className="text-left">
                    <div className="text-[11px] sm:text-xs font-black text-[#0B0B0F] leading-tight">
                      Cold RO Water
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-[#0B0B0F]/60 font-medium">
                      200m away • 4 min
                    </div>
                  </div>
                </div>

                {/* Tiny "Open" Chip */}
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200 shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Open
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
