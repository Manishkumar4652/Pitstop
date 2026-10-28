'use client';

import React from 'react';
import Link from 'next/link';
import { Store, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { useScrollReveal, useCountUp } from './useScrollReveal';
import { useLanguage } from '@/lib/i18n';

export const LandingMerchants: React.FC = () => {
  const [sectionRef, isRevealed] = useScrollReveal();
  const { isHindi } = useLanguage();

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
              <span>
                {isHindi
                  ? 'स्थानीय दुकानों, कैफे और टी स्टॉल के लिए'
                  : 'FOR LOCAL SHOPS, CAFES & TEA STALLS'}
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0B0B0F] leading-tight">
              {isHindi ? 'अपनी दुकान को बनाएं एक PitStop' : 'Turn your shop into a PitStop'}
            </h2>

            <p className="mt-3 text-base text-[#0B0B0F]/70 leading-relaxed font-normal">
              {isHindi
                ? 'डिलीवरी पार्टनर्स का स्वागत करें, दोपहर के खाली समय में अतिरिक्त बिक्री बढ़ाएं और अपनी सुविधानुसार ऑन-डिमांड हेल्पर सहायता प्राप्त करें।'
                : 'Welcome delivery partners, fill unused tables during afternoon lulls, and access dependable on-demand helper support on your terms.'}
            </p>

            {/* 3 Benefit Points */}
            <div className="mt-7 space-y-4">
              <div className="flex items-start gap-3.5 group">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FBBF24] text-black font-bold mt-0.5 shadow-sm transition-transform duration-200 group-hover:scale-105">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#0B0B0F]">
                    {isHindi ? 'दोपहर में ग्राहकों की निरंतर आवाजाही' : 'Steady Afternoon Foot Traffic'}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#0B0B0F]/70">
                    {isHindi
                      ? 'पानी पीने और फोन चार्ज करने आने वाले राइडर्स अक्सर आपके काउंटर से चाय, नाश्ता और खाना खरीदते हैं।'
                      : 'Riders visiting for water and phone charging frequently buy chai, snacks, and meals at your counter.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 group">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FBBF24] text-black font-bold mt-0.5 shadow-sm transition-transform duration-200 group-hover:scale-105">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#0B0B0F]">
                    {isHindi ? 'ऑन-डिमांड हेल्पर सहायता' : 'On-Demand Helper Support'}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#0B0B0F]/70">
                    {isHindi
                      ? 'बिना किसी निश्चित वेतन के पार्सल सॉर्टिंग, पैकिंग और तत्काल डिलीवरी के लिए 1-2 घंटे के हेल्पर कार्य पोस्ट करें।'
                      : 'Post 1–2 hour helper tasks during slow hours for sorting, packing, and urgent local drops without fixed payroll.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 group">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FBBF24] text-black font-bold mt-0.5 shadow-sm transition-transform duration-200 group-hover:scale-105">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#0B0B0F]">
                    {isHindi ? '100% मुफ्त ऑनबोर्डिंग और QR स्टैंडी' : '100% Free Onboarding & QR Standee'}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#0B0B0F]/70">
                    {isHindi
                      ? 'कोई लिस्टिंग शुल्क या कमीशन नहीं। सत्यापन के बाद अपना कस्टमाइज्ड QR स्टैंडी किट निःशुल्क प्राप्त करें।'
                      : 'No listing fees, hardware setup, or commissions. Receive your customized QR standee kit upon verification.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Button: Onboard Your Shop Free */}
            <div className="mt-8">
              <Link href="/for-merchants">
                <button className="min-h-[48px] group inline-flex items-center justify-center gap-2.5 rounded-2xl bg-[#0B0B0F] px-7 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-neutral-800 active:scale-[0.97]">
                  <span>{isHindi ? 'दुकान को मुफ्त में जोड़ें' : 'Onboard Your Shop Free'}</span>
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
                      {isHindi ? 'PitStop मर्चेंट हब' : 'PitStop Merchant Hub'}
                    </h4>
                    <p className="text-[11px] text-[#0B0B0F]/50">
                      {isHindi ? 'कोरमंगला पार्टनर हब' : 'Koramangala Partner Hub'}
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {isHindi ? 'लाइव' : 'Live'}
                </span>
              </div>

              {/* Stats Grid with Animated Count-Up Numbers */}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-white p-2.5 border border-black/[0.04] shadow-2xs">
                  <div className="text-base font-black text-[#0B0B0F] tabular-nums">
                    {ridersCount}
                  </div>
                  <div className="text-[10px] text-[#0B0B0F]/60 mt-0.5">
                    {isHindi ? 'आज के राइडर्स' : 'Riders Today'}
                  </div>
                </div>
                <div className="rounded-xl bg-white p-2.5 border border-black/[0.04] shadow-2xs">
                  <div className="text-base font-black text-[#0B0B0F] tabular-nums">
                    {dealsCount}
                  </div>
                  <div className="text-[10px] text-[#0B0B0F]/60 mt-0.5">
                    {isHindi ? 'क्लेम डील्स' : 'Deals Claimed'}
                  </div>
                </div>
                <div className="rounded-xl bg-white p-2.5 border border-black/[0.04] shadow-2xs">
                  <div className="text-base font-black text-[#0B0B0F] tabular-nums">
                    {tasksCount}
                  </div>
                  <div className="text-[10px] text-[#0B0B0F]/60 mt-0.5">
                    {isHindi ? 'हेल्पर टास्क' : 'Helper Tasks'}
                  </div>
                </div>
              </div>

              {/* Live Task Banner */}
              <div className="mt-4 rounded-xl bg-amber-50/80 p-3 border border-amber-200/60">
                <div className="text-[11px] font-bold text-amber-900">
                  {isHindi
                    ? 'सक्रिय हेल्पर टास्क (2:30 PM – 4:00 PM)'
                    : 'Active Helper Task (2:30 PM – 4:00 PM)'}
                </div>
                <div className="text-[11px] text-amber-800/80 mt-0.5">
                  {isHindi
                    ? 'पार्सल सॉर्टिंग • 1 राइडर नियुक्त'
                    : 'Parcel Sorting • 1 Rider Assigned'}
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-black/[0.06] flex items-center justify-between text-[11px] text-[#0B0B0F]/60">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  {isHindi ? 'QR स्टैंडी #KA-04 एक्टिव' : 'QR Standee #KA-04 Active'}
                </span>
                <span className="font-bold text-[#0B0B0F]">
                  {isHindi ? 'वेरिफाइड होस्ट' : 'Verified Host'}
                </span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
