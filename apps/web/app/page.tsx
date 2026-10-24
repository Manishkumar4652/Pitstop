import React from 'react';
import { Metadata } from 'next';
import {
  LandingNavbar,
  LandingHero,
  LandingHowItWorks,
  LandingBenefits,
  LandingMerchants,
  LandingCtaAndFooter,
} from '@/components/landing';

export const metadata: Metadata = {
  title: 'PitStop — Every Rider Deserves a Place to Stop',
  description:
    'Verified rest stops, clean RO water, fast phone charging, hygienic washrooms, and off-peak micro-jobs for India’s gig delivery riders in Bengaluru.',
  keywords: [
    'PitStop',
    'gig delivery riders',
    'Zomato rest stops',
    'Swiggy rider facilities',
    'free RO water Bengaluru',
    'mobile charging stations',
    'clean washrooms for delivery riders',
    'off-peak micro-jobs',
  ],
  authors: [{ name: 'PitStop India' }],
  openGraph: {
    title: 'PitStop — Every Rider Deserves a Place to Stop',
    description:
      'Verified rest stops, clean RO water, fast phone charging, hygienic washrooms, and off-peak micro-jobs for India’s gig delivery riders in Bengaluru.',
    url: 'https://pitstop.in',
    siteName: 'PitStop',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PitStop — Every Rider Deserves a Place to Stop',
    description:
      'Verified rest stops, clean RO water, fast phone charging, hygienic washrooms, and off-peak micro-jobs for India’s gig delivery riders in Bengaluru.',
  },
};

// Landing-only scoped styles and keyframes (Zero leakage to global styles, zero new packages)
const landingStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

  .landing-scope {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    scroll-behavior: smooth;
  }

  @keyframes heroGlow {
    0%, 100% {
      opacity: 0.6;
      transform: translate(-50%, 0) scale(1);
    }
    50% {
      opacity: 0.9;
      transform: translate(-50%, 0) scale(1.08);
    }
  }

  .landing-scope .animate-hero-glow {
    animation: heroGlow 6s ease-in-out infinite;
    will-change: opacity, transform;
  }

  @keyframes gentleFloat {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-6px);
    }
  }

  .landing-scope .animate-gentle-float {
    animation: gentleFloat 4s ease-in-out infinite;
    will-change: transform;
  }

  @keyframes phoneFloat {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-8px);
    }
  }

  .landing-scope .animate-phone-float {
    animation: phoneFloat 6s ease-in-out infinite;
    will-change: transform;
  }

  @keyframes cardFloat {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-6px);
    }
  }

  .landing-scope .animate-card-float {
    animation: cardFloat 4s ease-in-out infinite;
    will-change: transform;
  }

  @keyframes riderPulse {
    0% {
      r: 4px;
      opacity: 0.8;
      stroke-width: 2px;
    }
    100% {
      r: 16px;
      opacity: 0;
      stroke-width: 0.5px;
    }
  }

  .landing-scope .animate-rider-pulse {
    animation: riderPulse 2s cubic-bezier(0.22, 1, 0.36, 1) infinite;
  }

  @keyframes pinPulse {
    0%, 100% {
      transform: scale(1);
      opacity: 0.25;
    }
    50% {
      transform: scale(1.4);
      opacity: 0.55;
    }
  }

  .landing-scope .animate-nearest-pin-pulse {
    animation: pinPulse 2.5s ease-in-out infinite;
    transform-origin: 0px -12px;
  }

  @keyframes microJobsGlow {
    0% {
      box-shadow: 0 0 0 0 rgba(251, 191, 36, 0);
      border-color: rgba(251, 191, 36, 0.4);
    }
    45% {
      box-shadow: 0 0 24px 2px rgba(251, 191, 36, 0.28);
      border-color: rgba(251, 191, 36, 0.95);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(251, 191, 36, 0);
      border-color: rgba(251, 191, 36, 0.4);
    }
  }

  .landing-scope .animate-micro-jobs-glow {
    animation: microJobsGlow 1.4s cubic-bezier(0.22, 1, 0.36, 1) 300ms 1 forwards;
  }

  @keyframes slideInRight {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }

  .landing-scope .animate-slide-in-right {
    animation: slideInRight 300ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .landing-scope .animate-fade-in {
    animation: fadeIn 300ms ease-out forwards;
  }

  @keyframes landingFadeUp {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes rideTrackScroll {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-50%);
    }
  }

  .landing-scope .animate-ride-track {
    animation: rideTrackScroll 16s linear infinite;
    will-change: transform;
  }

  @keyframes bikeBob {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-1.5px);
    }
  }

  .landing-scope .animate-bike-bob {
    animation: bikeBob 0.6s ease-in-out infinite;
    will-change: transform;
  }

  @keyframes wheelSpin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .landing-scope .animate-wheel-spin {
    animation: wheelSpin 0.8s linear infinite;
    transform-box: fill-box;
    transform-origin: center;
    will-change: transform;
  }

  @keyframes doorGlow {
    0%, 100% {
      opacity: 0;
    }
    1.5% {
      opacity: 0.85;
    }
    4.5% {
      opacity: 0;
    }
  }

  .landing-scope .animate-door-glow {
    animation: doorGlow 16s linear infinite;
    will-change: opacity;
  }

  /* Mobile responsiveness: reduce distances and slightly shorten transition times under 640px */
  @media (max-width: 640px) {
    .landing-scope .animate-gentle-float,
    .landing-scope .animate-phone-float,
    .landing-scope .animate-card-float {
      animation: none; /* Keep 60fps on mid-range Android by removing float loops */
    }
  }

  /* Accessibility: strictly respect prefers-reduced-motion */
  @media (prefers-reduced-motion: reduce) {
    .landing-scope,
    .landing-scope *,
    .landing-scope *::before,
    .landing-scope *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
      transform: none !important;
    }
  }
`;

export default function HomePage() {
  return (
    <div className="landing-scope min-h-screen bg-[#FAFAF7] text-[#0B0B0F] selection:bg-[#FBBF24] selection:text-black antialiased scroll-smooth">
      {/* Landing-scoped styles injecting animations & Plus Jakarta Sans typography */}
      <style dangerouslySetInnerHTML={{ __html: landingStyles }} />

      {/* 1. Landing Navbar (Slide-in Right Drawer, Scroll Lock, Scrolled Blur) */}
      <LandingNavbar />

      <main id="main-content">
        {/* Section 1: Hero (Breathing Glow, Stagger Sequence, Animated Phone Mockup) */}
        <LandingHero />

        {/* Section 2: How It Works (3 Steps, Pop Badges, Drawing Timeline Line) */}
        <LandingHowItWorks />

        {/* Section 3: Benefits (2x2 Grid with Glowing Micro-Jobs Card) */}
        <LandingBenefits />

        {/* Section 4: For Merchants (Split Section with Count-Up Mockup) */}
        <LandingMerchants />

        {/* Section 5: Final Dark CTA (Scale Reveal) & Compact Footer */}
        <LandingCtaAndFooter />
      </main>
    </div>
  );
}
