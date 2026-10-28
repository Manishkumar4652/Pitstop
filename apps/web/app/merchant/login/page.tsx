'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Bike
} from 'lucide-react';
import { Button } from '@/components/ui';
import { AuthCardLayout } from '@/components/auth';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { useAuth } from '@/lib/auth/AuthContext';
import { UserRole } from 'shared-types';
import { sanitizeReturnUrl } from '@/lib/auth/return-url';
import { useLanguage } from '@/lib/i18n';
import { allowOnlyDigitsKeyDown, sanitizePhoneNumber } from '@/lib/utils/input-validators';

function MerchantLoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, isAuthenticated } = useAuth();
  const { isHindi } = useLanguage();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasRedirectedRef = React.useRef(false);

  // Sanitize returnUrl
  const returnUrl = sanitizeReturnUrl(searchParams.get('returnUrl'), '/merchant');

  // If already authenticated as a merchant, redirect cleanly (guarded against loops)
  React.useEffect(() => {
    if (isAuthenticated && user?.role === UserRole.MERCHANT && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      const target = returnUrl && returnUrl !== '/merchant/login' ? returnUrl : '/merchant';
      window.location.href = target;
    }
  }, [isAuthenticated, user, returnUrl]);

  const handlePhoneChange = (val: string) => {
    setPhone(sanitizePhoneNumber(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.trim();
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError(
        isHindi
          ? 'कृपया एक वैध 10-अंकों का भारतीय मोबाइल नंबर दर्ज करें (उदा. 9876543211)।'
          : 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543211).'
      );
      return;
    }

    if (!password) {
      setError(isHindi ? 'कृपया अपना पासवर्ड दर्ज करें।' : 'Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(
        {
          phone: cleanPhone,
          password,
        },
        { requiredRole: UserRole.MERCHANT }
      );

      if (!result.success) {
        setError(
          result.error || (isHindi ? 'अमान्य क्रेडेंशियल्स। कृपया पुनः प्रयास करें।' : 'Invalid credentials. Please try again.')
        );
        setIsSubmitting(false);
        return;
      }

      hasRedirectedRef.current = true;
      const target = returnUrl && returnUrl !== '/merchant/login' ? returnUrl : '/merchant';
      window.location.href = target;
    } catch {
      setError(
        isHindi ? 'एक अप्रत्याशित त्रुटि हुई। कृपया पुनः प्रयास करें।' : 'An unexpected error occurred. Please try again.'
      );
      setIsSubmitting(false);
    }
  };

  const loginUrl = `/merchant/login${returnUrl !== '/merchant' ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`;
  const registerUrl = `/merchant/register${returnUrl !== '/merchant' ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`;

  return (
    <AuthCardLayout
      mode="login"
      role="merchant"
      loginUrl={loginUrl}
      registerUrl={registerUrl}
      title={isHindi ? 'मर्चेंट पार्टनर लॉगिन' : 'Merchant Partner Login'}
      subtitle={
        isHindi
          ? 'रेस्ट स्टॉप्स, डील्स और हेल्पर टास्क प्रबंधित करने के लिए अपने पंजीकृत फोन नंबर से लॉग इन करें।'
          : 'Log in with your registered phone number to manage rest stops, deals, and helper tasks.'
      }
      error={error}
      footerContent={
        <div className="space-y-3">
          <p className="text-xs text-pitstop-muted">
            {isHindi ? 'नए मर्चेंट पार्टनर? ' : 'New merchant partner? '}
            <Link
              href={registerUrl}
              className="font-bold text-pitstop-charcoal hover:underline hover:text-pitstop-yellow-dark"
            >
              {isHindi ? 'अपना व्यवसाय पंजीकृत करें' : 'Register your business'}
            </Link>
          </p>
          <p className="text-xs text-pitstop-muted flex items-center justify-center gap-1">
            {isHindi ? 'क्या आप राइडर हैं? ' : 'Looking for the rider portal? '}
            <Link
              href="/rider/login"
              className="font-semibold text-pitstop-charcoal hover:underline inline-flex items-center gap-1"
            >
              <Bike className="h-3 w-3" /> {isHindi ? 'राइडर के रूप में लॉगिन करें' : 'Sign in as a Rider'}
            </Link>
          </p>
        </div>
      }
    >
      {/* Warning if already logged in as a Rider */}
      {isAuthenticated && user && user.role !== UserRole.MERCHANT && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 space-y-2"
        >
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="h-4 w-4 text-amber-700 shrink-0" aria-hidden="true" />
            <span>{isHindi ? 'वर्तमान में राइडर के रूप में लॉग इन हैं' : 'Currently Signed In as a Rider'}</span>
          </div>
          <p>
            {isHindi
              ? `आप ${user.name} (${user.phone}) के रूप में लॉग इन हैं। मर्चेंट पोर्टल के लिए पंजीकृत मर्चेंट पार्टनर खाता आवश्यक है।`
              : `You are signed in as ${user.name} (${user.phone}). Merchant portal access requires a registered merchant partner account.`}
          </p>
          <div className="pt-2 flex flex-wrap gap-2">
            <Link href="/rider/dashboard">
              <Button variant="outline" size="sm" leftIcon={<Bike className="h-3.5 w-3.5" />}>
                {isHindi ? 'राइडर डैशबोर्ड पर जाएं' : 'Go to Rider Dashboard'}
              </Button>
            </Link>
            <LogoutButton variant="ghost" size="sm" />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Phone Input with clean prefix addon */}
        <div>
          <label htmlFor="merchant-phone" className="block text-xs font-bold text-pitstop-charcoal uppercase tracking-wider mb-1.5">
            {isHindi ? 'पंजीकृत मोबाइल नंबर' : 'Registered Mobile Number'} <span className="text-red-500">*</span>
          </label>
          <div className="flex rounded-xl shadow-xs">
            <span className="inline-flex items-center px-3.5 rounded-l-xl border border-r-0 border-pitstop-border bg-pitstop-bg text-xs font-semibold text-pitstop-muted select-none">
              +91
            </span>
            <input
              id="merchant-phone"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              autoComplete="tel-national"
              required
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              onKeyDown={allowOnlyDigitsKeyDown}
              placeholder="9876543211"
              disabled={isSubmitting}
              className="block w-full min-h-[44px] rounded-r-xl border border-pitstop-border bg-white px-3.5 py-2.5 text-sm text-pitstop-charcoal placeholder:text-pitstop-muted/60 focus:border-pitstop-yellow focus:outline-none focus:ring-2 focus:ring-pitstop-yellow disabled:bg-pitstop-bg"
            />
          </div>
          <p className="mt-1 text-[11px] text-pitstop-muted">
            {isHindi
              ? 'आपके मर्चेंट प्रतिष्ठान के साथ पंजीकृत 10-अंकों का फ़ोन नंबर।'
              : '10-digit primary contact number registered with your venue.'}
          </p>
        </div>

        {/* Password Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="merchant-password" className="block text-xs font-bold text-pitstop-charcoal uppercase tracking-wider">
              {isHindi ? 'पासवर्ड' : 'Password'} <span className="text-red-500">*</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-pitstop-muted hover:text-pitstop-charcoal hover:underline"
            >
              {isHindi ? 'भूल गए?' : 'Forgot?'}
            </Link>
          </div>
          <div className="relative rounded-xl shadow-xs">
            <input
              id="merchant-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isSubmitting}
              className="block w-full min-h-[44px] rounded-xl border border-pitstop-border bg-white px-3.5 pr-10 py-2.5 text-sm text-pitstop-charcoal placeholder:text-pitstop-muted/60 focus:border-pitstop-yellow focus:outline-none focus:ring-2 focus:ring-pitstop-yellow disabled:bg-pitstop-bg"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-pitstop-muted hover:text-pitstop-charcoal"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Quick Demo Credentials Autofill Helper */}
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-3 text-xs text-amber-900 flex items-center justify-between gap-2 shadow-2xs">
          <div className="text-[11px] leading-tight">
            <span className="font-bold text-pitstop-charcoal">
              {isHindi ? 'डेमो मर्चेंट:' : 'Demo Merchant:'}
            </span>{' '}
            <span className="font-mono font-semibold">9876543211</span> / <span className="font-mono font-semibold">Password@123</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setPhone('9876543211');
              setPassword('Password@123');
              setError(null);
            }}
            className="shrink-0 text-[10px] font-black uppercase tracking-wider text-amber-950 bg-pitstop-yellow hover:bg-amber-400 px-3 py-1.5 rounded-full shadow-2xs transition-transform active:scale-95 cursor-pointer"
          >
            {isHindi ? 'ऑटो भरें' : 'Auto Fill'}
          </button>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isSubmitting}
            rightIcon={!isSubmitting ? <ArrowRight className="h-4 w-4" /> : undefined}
          >
            {isSubmitting
              ? (isHindi ? 'सत्यापन हो रहा है...' : 'Authenticating...')
              : (isHindi ? 'मर्चेंट हब में लॉग इन करें' : 'Log In to Merchant Hub')}
          </Button>
        </div>
      </form>
    </AuthCardLayout>
  );
}

export default function MerchantLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-pitstop-bg flex items-center justify-center p-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-pitstop-yellow border-t-transparent" />
      </div>
    }>
      <MerchantLoginFormContent />
    </Suspense>
  );
}
