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

function MerchantLoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, isAuthenticated } = useAuth();

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
    let cleaned = val.replace(/\D/g, '');
    if (cleaned.startsWith('91') && cleaned.length > 10) {
      cleaned = cleaned.slice(2);
    } else if (cleaned.startsWith('0') && cleaned.length > 10) {
      cleaned = cleaned.slice(1);
    }
    setPhone(cleaned.slice(0, 10));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.trim();
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian mobile number (e.g. 9876543211).');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
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
        setError(result.error || 'Invalid credentials. Please try again.');
        setIsSubmitting(false);
        return;
      }

      hasRedirectedRef.current = true;
      const target = returnUrl && returnUrl !== '/merchant/login' ? returnUrl : '/merchant';
      window.location.href = target;
    } catch {
      setError('An unexpected error occurred. Please try again.');
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
      title="Merchant Partner Login"
      subtitle="Log in with your registered phone number to manage rest stops, deals, and helper tasks."
      error={error}
      footerContent={
        <div className="space-y-3">
          <p className="text-xs text-pitstop-muted">
            New merchant partner?{' '}
            <Link
              href={registerUrl}
              className="font-bold text-pitstop-charcoal hover:underline hover:text-pitstop-yellow-dark"
            >
              Register your business
            </Link>
          </p>
          <p className="text-xs text-pitstop-muted flex items-center justify-center gap-1">
            Looking for the rider portal?{' '}
            <Link
              href="/rider/login"
              className="font-semibold text-pitstop-charcoal hover:underline inline-flex items-center gap-1"
            >
              <Bike className="h-3 w-3" /> Sign in as a Rider
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
            <span>Currently Signed In as a Rider</span>
          </div>
          <p>
            You are signed in as <strong>{user.name}</strong> ({user.phone}). Merchant portal access requires a registered merchant partner account.
          </p>
          <div className="pt-2 flex flex-wrap gap-2">
            <Link href="/rider/dashboard">
              <Button variant="outline" size="sm" leftIcon={<Bike className="h-3.5 w-3.5" />}>
                Go to Rider Dashboard
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
            Registered Mobile Number <span className="text-red-500">*</span>
          </label>
          <div className="flex rounded-xl shadow-xs">
            <span className="inline-flex items-center px-3.5 rounded-l-xl border border-r-0 border-pitstop-border bg-pitstop-bg text-xs font-semibold text-pitstop-muted select-none">
              +91
            </span>
            <input
              id="merchant-phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="9876543211"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              required
              autoComplete="tel"
              disabled={isSubmitting}
              className="block w-full min-h-[44px] rounded-r-xl border border-pitstop-border bg-white px-3.5 py-2 text-sm text-pitstop-charcoal placeholder:text-pitstop-muted/60 transition-colors focus:border-pitstop-yellow focus:outline-none focus:ring-2 focus:ring-pitstop-yellow disabled:bg-pitstop-bg disabled:opacity-50"
            />
          </div>
          <p className="mt-1 text-[11px] text-pitstop-muted">
            10-digit Indian phone number used during merchant registration
          </p>
        </div>

        {/* Password Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="merchant-password" className="block text-xs font-bold text-pitstop-charcoal uppercase tracking-wider">
              Password <span className="text-red-500">*</span>
            </label>
          </div>
          <div className="relative">
            <input
              id="merchant-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
              autoComplete="current-password"
              className="block w-full min-h-[44px] rounded-xl border border-pitstop-border bg-white pl-3.5 pr-10 py-2.5 text-sm text-pitstop-charcoal placeholder:text-pitstop-muted/60 focus:border-pitstop-yellow focus:outline-none focus:ring-2 focus:ring-pitstop-yellow disabled:bg-pitstop-bg"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-pitstop-muted hover:text-pitstop-charcoal focus:outline-none"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Quick Demo Credentials Autofill Helper */}
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-3 text-xs text-amber-900 flex items-center justify-between gap-2 shadow-2xs">
          <div className="text-[11px] leading-tight">
            <span className="font-bold text-pitstop-charcoal">Demo Merchant:</span>{' '}
            <span className="font-mono">9876543211</span> / <span className="font-mono">Password@123</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setPhone('9876543211');
              setPassword('Password@123');
              setError(null);
            }}
            className="shrink-0 text-[10px] font-black uppercase tracking-wider text-amber-950 bg-pitstop-yellow hover:bg-pitstop-yellow-dark px-2.5 py-1 rounded-full shadow-2xs transition-transform active:scale-95"
          >
            Auto Fill
          </button>
        </div>

        {/* Submit Button (Pill button matching Loginpage.png) */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-4 min-h-[46px] rounded-full bg-pitstop-yellow hover:bg-pitstop-yellow-dark text-pitstop-charcoal font-black text-sm tracking-wide shadow-md shadow-pitstop-yellow/30 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-pitstop-charcoal border-t-transparent" />
              <span>Verifying Credentials...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1.5">
              <span>Sign In as Merchant</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          )}
        </button>
      </form>
    </AuthCardLayout>
  );
}

export default function MerchantLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7B928] p-8 text-center text-xs text-white">
          Loading merchant login...
        </div>
      }
    >
      <MerchantLoginFormContent />
    </Suspense>
  );
}
