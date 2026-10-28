'use client';

import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

interface LanguageToggleProps {
  className?: string;
  isDark?: boolean;
  size?: 'sm' | 'md';
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  className = '',
  isDark = false,
  size = 'md',
}) => {
  const { language, setLanguage } = useLanguage();

  const isSmall = size === 'sm';

  return (
    <div
      role="group"
      aria-label="Language selection / भाषा चयन"
      className={`inline-flex items-center rounded-full p-1 border-2 transition-all duration-200 select-none shadow-sm ${
        isDark
          ? 'bg-white/10 border-white/25 text-white shadow-black/20 backdrop-blur-md'
          : 'bg-white border-black/15 text-[#0B0B0F] shadow-black/5 hover:border-[#FBBF24]'
      } ${className}`}
    >
      <div
        className={`flex items-center pl-2 pr-1.5 transition-colors ${
          isDark ? 'text-amber-400' : 'text-amber-600'
        }`}
        aria-hidden="true"
        title={language === 'hi' ? 'भाषा: हिंदी' : 'Language: English'}
      >
        <Globe className={isSmall ? 'h-3.5 w-3.5' : 'h-4 w-4 stroke-[2.2]'} />
      </div>

      <button
        type="button"
        onClick={() => setLanguage('en')}
        aria-pressed={language === 'en'}
        title="Switch to English"
        className={`rounded-full font-black tracking-tight transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#FBBF24] ${
          isSmall ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
        } ${
          language === 'en'
            ? 'bg-[#FBBF24] text-[#0B0B0F] shadow-sm font-black'
            : isDark
            ? 'text-gray-300 hover:text-white font-semibold'
            : 'text-[#0B0B0F]/60 hover:text-[#0B0B0F] font-semibold'
        }`}
      >
        EN
      </button>

      <button
        type="button"
        onClick={() => setLanguage('hi')}
        aria-pressed={language === 'hi'}
        title="हिंदी भाषा में बदलें"
        className={`rounded-full font-black tracking-tight transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#FBBF24] ${
          isSmall ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
        } ${
          language === 'hi'
            ? 'bg-[#FBBF24] text-[#0B0B0F] shadow-sm font-black'
            : isDark
            ? 'text-gray-300 hover:text-white font-semibold'
            : 'text-[#0B0B0F]/60 hover:text-[#0B0B0F] font-semibold'
        }`}
      >
        हिंदी
      </button>
    </div>
  );
};
