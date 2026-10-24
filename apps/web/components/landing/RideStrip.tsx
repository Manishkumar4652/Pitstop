'use client';

import React, { useRef, useEffect, useState } from 'react';

// Exact SVG Paths provided by the user
const BIKE_PATH =
  'M400 160C426.5 160 448 138.5 448 112C448 85.5 426.5 64 400 64C373.5 64 352 85.5 352 112C352 138.5 373.5 160 400 160zM427.2 224L365.4 175.2C348.1 161.6 323.7 161.4 306.3 174.9L223.2 239.1C192.5 262.9 194.7 309.9 227.5 330.7L288 369.1L288 480C288 497.7 302.3 512 320 512C337.7 512 352 497.7 352 480L352 352C352 341.3 346.7 331.3 337.8 325.4L295 296.9L355.3 248.4L396 281C401.7 285.5 408.7 288 416 288L480 288C497.7 288 512 273.7 512 256C512 238.3 497.7 224 480 224L427.2 224zM144 576C205.9 576 256 525.9 256 464C256 402.1 205.9 352 144 352C82.1 352 32 402.1 32 464C32 525.9 82.1 576 144 576zM496 576C557.9 576 608 525.9 608 464C608 402.1 557.9 352 496 352C434.1 352 384 402.1 384 464C384 525.9 434.1 576 496 576z';

const MERCHANT_PATH =
  'M53.5 245.1L110.3 131.4C121.2 109.7 143.3 96 167.6 96L472.5 96C496.7 96 518.9 109.7 529.7 131.4L586.5 245.1C590.1 252.3 592 260.2 592 268.3C592 295.6 570.8 318 544 319.9L544 512C544 529.7 529.7 544 512 544C494.3 544 480 529.7 480 512L480 320L384 320L384 496C384 522.5 362.5 544 336 544L144 544C117.5 544 96 522.5 96 496L96 319.9C69.2 318 48 295.6 48 268.3C48 260.3 49.9 252.3 53.5 245.1zM160 320L160 432C160 440.8 167.2 448 176 448L304 448C312.8 448 320 440.8 320 432L320 320L160 320z';

export const RideStrip: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  // Pause animation when the strip is scrolled off screen
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Respect prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setIsPlaying(false);
      return;
    }

    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsPlaying(entry.isIntersecting);
      },
      { threshold: 0.05 }
    );

    const el = containerRef.current;
    if (el) observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  // 6 merchant shop icons with fixed coordinates, uneven gaps & varied scales (90% to 110%) across 720px track
  const shops = [
    { id: 1, x: 40, scale: 1.0, delay: -13.3 },
    { id: 2, x: 160, scale: 1.08, delay: -15.9 },
    { id: 3, x: 290, scale: 0.92, delay: -2.4 },
    { id: 4, x: 410, scale: 1.05, delay: -5.1 },
    { id: 5, x: 550, scale: 0.95, delay: -8.2 },
    { id: 6, x: 650, scale: 1.02, delay: -10.4 },
  ];

  const renderTrackSegment = (offset: number, keyPrefix: string) => (
    <g transform={`translate(${offset}, 0)`} key={keyPrefix}>
      {/* Bold Ground Line in #FBBF24 */}
      <line
        x1="0"
        y1="44"
        x2="720"
        y2="44"
        stroke="#FBBF24"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Ground Road Dappled Accent Dashes in #FBBF24 */}
      <line x1="85" y1="50" x2="110" y2="50" stroke="#FBBF24" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
      <line x1="215" y1="50" x2="240" y2="50" stroke="#FBBF24" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
      <line x1="350" y1="50" x2="375" y2="50" stroke="#FBBF24" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
      <line x1="480" y1="50" x2="510" y2="50" stroke="#FBBF24" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
      <line x1="605" y1="50" x2="630" y2="50" stroke="#FBBF24" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />

      {/* 6 Merchant Shops (User Provided FontAwesome SVG Path in #FBBF24) */}
      {shops.map((shop) => {
        // Merchant path: width=544, height=448, bottom at y=544
        const targetH = 26 * shop.scale;
        const s = targetH / 448; // scale factor

        return (
          <g
            key={`${keyPrefix}-shop-${shop.id}`}
            transform={`translate(${shop.x}, 44) scale(${s}) translate(-272, -544)`}
          >
            {/* Merchant Door Cutout Background (Glows as it passes the bike) */}
            <rect
              x="160"
              y="320"
              width="160"
              height="128"
              rx="12"
              fill="#0B0B0F"
              fillOpacity="0.25"
            />
            <rect
              x="160"
              y="320"
              width="160"
              height="128"
              rx="12"
              fill="#FFFFFF"
              className="animate-door-glow"
              style={{
                animationDelay: `${shop.delay}s`,
                animationPlayState: isPlaying ? 'running' : 'paused',
              }}
            />

            {/* Merchant Facade Path in #FBBF24 */}
            <path
              d={MERCHANT_PATH}
              fill="#FBBF24"
              fillRule="evenodd"
              stroke="#0B0B0F"
              strokeOpacity="0.15"
              strokeWidth="4"
            />
          </g>
        );
      })}
    </g>
  );

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="relative w-full max-w-[640px] mx-auto lg:mx-0 h-[46px] sm:h-[54px] lg:h-[60px] my-2 sm:my-3 select-none pointer-events-none overflow-hidden"
      style={{
        maskImage: 'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
      }}
    >
      {/* ── 1. SCROLLING TRACK: Endless Seamless Loop (Tracks A & B, translateX 0 to -50%) ── */}
      <div
        className="absolute top-0 left-0 h-full w-[1440px] animate-ride-track"
        style={{
          animationPlayState: isPlaying ? 'running' : 'paused',
        }}
      >
        <svg
          viewBox="0 0 1440 60"
          className="w-[1440px] h-full"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Track A (0px to 720px) */}
          {renderTrackSegment(0, 'track-a')}
          {/* Track B (720px to 1440px) - Exact Duplicate for 100% Seamless Jump-Free Loop */}
          {renderTrackSegment(720, 'track-b')}
        </svg>
      </div>

      {/* ── 2. STATIC BIKE: Stays in place horizontally at ~28% from left with gentle bob ── */}
      {/* Ground line is at 44/60 = 73.33% from the top */}
      <div
        className="absolute left-[26%] sm:left-[28%] top-[73.33%] -translate-y-full -translate-x-1/2 z-20 pointer-events-none"
      >
        <div
          className="animate-bike-bob"
          style={{
            animationPlayState: isPlaying ? 'running' : 'paused',
          }}
        >
          {/* User Provided Bike SVG Path in #FBBF24 */}
          <svg
            width="36"
            height="32"
            viewBox="32 64 576 512"
            fill="#FBBF24"
            xmlns="http://www.w3.org/2000/svg"
            className="overflow-visible drop-shadow-xs"
          >
            <path
              d={BIKE_PATH}
              fill="#FBBF24"
              stroke="#0B0B0F"
              strokeOpacity="0.15"
              strokeWidth="6"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
