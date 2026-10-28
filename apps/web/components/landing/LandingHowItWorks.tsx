'use client';

import React from 'react';
import { MapPin, QrCode, Coffee } from 'lucide-react';
import { useScrollReveal } from './useScrollReveal';
import { useLanguage } from '@/lib/i18n';

export const LandingHowItWorks: React.FC = () => {
  const [sectionRef, isRevealed] = useScrollReveal();
  const { isHindi } = useLanguage();

  const steps = [
    {
      number: '01',
      title: isHindi ? 'पास का स्टॉप खोजें' : 'Find a stop nearby',
      description: isHindi
        ? 'अपने फोन पर PitStop खोलें। लाइव मैप पर पास के वेरिफाइड कैफे, रेस्टोरेंट और टी स्टॉल देखें।'
        : 'Open PitStop on your phone. See nearby verified cafes, restaurants, and tea stalls on a live map.',
      icon: MapPin,
    },
    {
      number: '02',
      title: isHindi ? 'QR से चेक-इन करें' : 'Check in with QR',
      description: isHindi
        ? 'अपना राइडर डिजिटल पास दिखाएं या काउंटर पर वेन्यू QR स्टैंडी को दो सेकंड में स्कैन करें।'
        : 'Show your rider digital pass or scan the venue QR standee at the counter in under two seconds.',
      icon: QrCode,
    },
    {
      number: '03',
      title: isHindi ? 'विश्राम करें या माइक्रो-जॉब चुनें' : 'Rest or pick a micro-job',
      description: isHindi
        ? 'ठंडा RO पानी रिफिल करें, फोन चार्ज करें, साफ वॉशरूम का उपयोग करें या दोपहर का हेल्पर कार्य लें।'
        : 'Refill chilled RO water, plug in your charger, use clean washrooms, or take an afternoon helper task.',
      icon: Coffee,
    },
  ];

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative scroll-mt-20 sm:scroll-mt-24 bg-white py-16 sm:py-24 border-y border-black/[0.06] text-[#0B0B0F]"
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
            {isHindi ? 'यह कैसे काम करता है' : 'HOW IT WORKS'}
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-[#0B0B0F]">
            {isHindi ? 'तीन आसान चरण' : 'Three Simple Steps'}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#0B0B0F]/70">
            {isHindi
              ? 'कोई ऐप डाउनलोड या कागजी कार्रवाई नहीं। सीधे अपने ब्राउज़र में वेरिफाइड सुविधाओं का उपयोग करें।'
              : 'No app download or paperwork. Access verified facilities directly in your browser.'}
          </p>
        </div>

        {/* ── MOBILE VERTICAL TIMELINE / DESKTOP HORIZONTAL CARDS ── */}
        <div className="relative max-w-4xl mx-auto">
          
          {/* Vertical connecting line draws itself as section enters on Mobile */}
          <div
            className="sm:hidden absolute top-6 bottom-6 left-5 w-0.5 bg-[#FBBF24]/60 origin-top transition-transform duration-700 ease-out"
            style={{
              transform: isRevealed ? 'scaleY(1)' : 'scaleY(0)',
              transitionDelay: '150ms',
            }}
            aria-hidden="true"
          />

          {/* Horizontal connecting line draws itself as section enters on Desktop */}
          <div
            className="hidden sm:block absolute top-1/2 left-16 right-16 -translate-y-8 h-0.5 bg-black/[0.08] origin-left transition-transform duration-700 ease-out"
            style={{
              transform: isRevealed ? 'scaleX(1)' : 'scaleX(0)',
              transitionDelay: '150ms',
            }}
            aria-hidden="true"
          />

          <div className="grid gap-6 sm:grid-cols-3">
            {steps.map((step, idx) => {
              const IconComponent = step.icon;
              return (
                <div
                  key={step.number}
                  style={{
                    transitionDelay: `${idx * 100}ms`,
                    transitionDuration: '500ms',
                    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                  className={`group relative flex sm:flex-col items-start gap-4 sm:gap-5 rounded-2xl sm:rounded-3xl border border-black/[0.08] bg-[#FAFAF7] p-5 sm:p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-black/20 active:scale-[0.98] ${
                    isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                >
                  {/* Step Badge (Pops scale 0.85 to 1) */}
                  <div
                    style={{
                      transitionDelay: `${150 + idx * 100}ms`,
                      transitionDuration: '400ms',
                      transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FBBF24] text-[#0B0B0F] font-black text-base shadow-sm ring-4 ring-white transition-transform ${
                      isRevealed ? 'scale-100' : 'scale-[0.85]'
                    }`}
                  >
                    {step.number}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <IconComponent className="h-4 w-4 text-[#0B0B0F]/70 transition-transform duration-200 group-hover:scale-105" />
                      <h3 className="text-base sm:text-lg font-bold text-[#0B0B0F]">
                        {step.title}
                      </h3>
                    </div>

                    <p className="text-xs sm:text-sm text-[#0B0B0F]/70 leading-relaxed font-normal">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
};
