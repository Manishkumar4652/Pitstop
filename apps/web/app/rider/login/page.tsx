'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Store
} from 'lucide-react';
import { Button } from '@/components/ui';
import { AuthCardLayout } from '@/components/auth';
import { useAuth } from '@/lib/auth/AuthContext';
import { useLanguage } from '@/lib/i18n';
import { allowOnlyDigitsKeyDown, sanitizePhoneNumber } from '@/lib/utils/input-validators';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated } = useAuth();
  const { isHindi } = useLanguage();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasRedirectedRef = React.useRef(false);

  // Sanitize returnUrl to prevent open-redirect vulnerabilities
  const rawReturnUrl = searchParams.get('returnUrl') || '/rider/dashboard';
  const returnUrl = rawReturnUrl.startsWith('/') && !rawReturnUrl.startsWith('//')
    ? rawReturnUrl
    : '/rider/dashboard';

  // If already authenticated, redirect cleanly (guarded against loops)
  React.useEffect(() => {
    if (isAuthenticated && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      const target = returnUrl && returnUrl !== '/rider/login' ? returnUrl : '/rider/dashboard';
      window.location.href = target;
    }
  }, [isAuthenticated, returnUrl]);

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
          ? 'कृपया एक वैध 10-अंकों का भारतीय मोबाइल नंबर दर्ज करें (उदा. 9876543212)।'
          : 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543212).'
      );
      return;
    }

    if (!password) {
      setError(isHindi ? 'कृपया अपना पासवर्ड दर्ज करें।' : 'Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login({
        phone: cleanPhone,
        password,
      });

      if (!result.success) {
        setError(
          result.error || (isHindi ? 'अमान्य क्रेडेंशियल्स। कृपया पुनः प्रयास करें।' : 'Invalid credentials. Please try again.')
        );
        setIsSubmitting(false);
        return;
      }

      hasRedirectedRef.current = true;
      const target = returnUrl && returnUrl !== '/rider/login' ? returnUrl : '/rider/dashboard';
      window.location.href = target;
    } catch {
      setError(
        isHindi ? 'एक अप्रत्याशित त्रुटि हुई। कृपया पुनः प्रयास करें।' : 'An unexpected error occurred. Please try again.'
      );
      setIsSubmitting(false);
    }
  };

  const loginUrl = `/rider/login?returnUrl=${encodeURIComponent(returnUrl)}`;
  const registerUrl = `/rider/register?returnUrl=${encodeURIComponent(returnUrl)}`;

  return (
    <AuthCardLayout
      mode="login"
      role="rider"
      loginUrl={loginUrl}
      registerUrl={registerUrl}
      title={isHindi ? 'राइडर पोर्टल लॉगिन' : 'Rider Portal Login'}
      subtitle={
        isHindi
          ? 'अपने रेस्ट स्टॉप्स और प्रोफाइल तक पहुँचने के लिए मोबाइल नंबर से लॉग इन करें।'
          : 'Log in with your mobile number to access your rest stops and profile.'
      }
      error={error}
      footerContent={
        <div className="space-y-3">
          <div className="text-xs text-pitstop-muted">
            <span>{isHindi ? 'खाता नहीं है? ' : "Don't have an account? "}</span>
            <Link
              href={registerUrl}
              className="font-bold text-pitstop-charcoal hover:underline hover:text-pitstop-yellow-dark"
            >
              {isHindi ? 'डिलीवरी पार्टनर के रूप में रजिस्टर करें' : 'Register as a Delivery Partner'}
            </Link>
          </div>
          <div className="pt-2 text-xs text-pitstop-muted flex items-center justify-center gap-1">
            <span>{isHindi ? 'क्या आप मर्चेंट हैं?' : 'Are you a merchant?'}</span>
            <Link
              href="/merchant/login"
              className="font-semibold text-pitstop-charcoal hover:underline inline-flex items-center gap-1"
            >
              <Store className="h-3 w-3" /> {isHindi ? 'मर्चेंट लॉगिन' : 'Merchant Login'}
            </Link>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Mobile Number Field */}
        <div>
          <label htmlFor="rider-phone" className="block text-xs font-bold text-pitstop-charcoal uppercase tracking-wider mb-1.5">
            {isHindi ? 'मोबाइल नंबर' : 'Mobile Number'} <span className="text-red-500">*</span>
          </label>
          <div className="flex rounded-xl shadow-xs">
            <span className="inline-flex items-center px-3.5 rounded-l-xl border border-r-0 border-pitstop-border bg-pitstop-bg text-xs font-semibold text-pitstop-muted select-none">
              +91
            </span>
            <input
              id="rider-phone"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              autoComplete="tel-national"
              required
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              onKeyDown={allowOnlyDigitsKeyDown}
              placeholder="9876543212"
              disabled={isSubmitting}
              className="block w-full min-h-[44px] rounded-r-xl border border-pitstop-border bg-white px-3.5 py-2.5 text-sm text-pitstop-charcoal placeholder:text-pitstop-muted/60 focus:border-pitstop-yellow focus:outline-none focus:ring-2 focus:ring-pitstop-yellow disabled:bg-pitstop-bg"
            />
          </div>
          <p className="mt-1 text-[11px] text-pitstop-muted">
            {isHindi
              ? 'आपकी डिलीवरी प्रोफाइल के साथ पंजीकृत 10-अंकों का मोबाइल नंबर।'
              : '10-digit mobile number registered with your delivery profile.'}
          </p>
        </div>

        {/* Password Field with Show/Hide Toggle */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="rider-password" className="block text-xs font-bold text-pitstop-charcoal uppercase tracking-wider">
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
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-pitstop-muted">
              <Lock className="h-4 w-4" />
            </div>
            <input
              id="rider-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isSubmitting}
              className="block w-full min-h-[44px] rounded-xl border border-pitstop-border bg-white pl-10 pr-10 py-2.5 text-sm text-pitstop-charcoal placeholder:text-pitstop-muted/60 focus:border-pitstop-yellow focus:outline-none focus:ring-2 focus:ring-pitstop-yellow disabled:bg-pitstop-bg"
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
              {isHindi ? 'डेमो राइडर:' : 'Demo Rider:'}
            </span>{' '}
            <span className="font-mono font-semibold">9876543212</span> / <span className="font-mono font-semibold">Password@123</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setPhone('9876543212');
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
              ? (isHindi ? 'लॉग इन हो रहा है...' : 'Logging in...')
              : (isHindi ? 'स्टेशन में लॉग इन करें' : 'Log In to Station')}
          </Button>
        </div>
      </form>
    </AuthCardLayout>
  );
}

export default function RiderLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-pitstop-bg flex items-center justify-center p-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-pitstop-yellow border-t-transparent" />
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}
