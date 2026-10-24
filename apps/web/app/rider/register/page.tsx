'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Eye,
  EyeOff,
  ArrowRight,
  Store
} from 'lucide-react';
import { AuthCardLayout } from '@/components/auth';
import { useAuth } from '@/lib/auth/AuthContext';
import { UserRole } from 'shared-types';

const PLATFORM_OPTIONS = [
  { value: 'zomato', label: 'Zomato' },
  { value: 'swiggy', label: 'Swiggy' },
  { value: 'blinkit', label: 'Blinkit' },
  { value: 'zepto', label: 'Zepto' },
  { value: 'rapido', label: 'Rapido' },
  { value: 'uber', label: 'Uber' },
  { value: 'ola', label: 'Ola' },
  { value: 'other', label: 'Other Platform / Independent' },
] as const;

const VEHICLE_OPTIONS = [
  { value: '2-wheeler-ev', label: 'Two-Wheeler (EV / Electric)' },
  { value: '2-wheeler-petrol', label: 'Two-Wheeler (Petrol)' },
  { value: 'bicycle', label: 'Bicycle' },
  { value: 'auto', label: 'Auto Rickshaw' },
  { value: 'car', label: 'Car / Four-Wheeler' },
] as const;

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, isAuthenticated } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [platform, setPlatform] = useState<string>('zomato');
  const [vehicleType, setVehicleType] = useState<string>('2-wheeler-ev');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sanitize returnUrl
  const rawReturnUrl = searchParams.get('returnUrl') || '/explore';
  const returnUrl = rawReturnUrl.startsWith('/') && !rawReturnUrl.startsWith('//')
    ? rawReturnUrl
    : '/explore';

  React.useEffect(() => {
    if (isAuthenticated) {
      window.location.href = returnUrl;
    }
  }, [isAuthenticated, returnUrl]);

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

    // Client-side validations
    if (name.trim().length < 2) {
      setError('Please enter your full name (minimum 2 characters).');
      return;
    }

    const cleanPhone = phone.trim();
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
      return;
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address, or leave it blank.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await register({
        name: name.trim(),
        phone: cleanPhone,
        ...(email.trim() && { email: email.trim().toLowerCase() }),
        password,
        role: UserRole.RIDER,
        riderProfile: {
          platform: platform as any,
          vehicleType: vehicleType as any,
          ...(vehicleNumber.trim() && { vehicleNumber: vehicleNumber.trim().toUpperCase() }),
        },
      });

      if (!result.success) {
        setError(result.error || 'Registration failed. Please check your details.');
        setIsSubmitting(false);
        return;
      }

      window.location.href = returnUrl;
    } catch {
      setError('An unexpected network error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const loginUrl = `/rider/login?returnUrl=${encodeURIComponent(returnUrl)}`;
  const registerUrl = `/rider/register?returnUrl=${encodeURIComponent(returnUrl)}`;

  return (
    <AuthCardLayout
      mode="register"
      role="rider"
      loginUrl={loginUrl}
      registerUrl={registerUrl}
      title="Create Rider Account"
      subtitle="Join PitStop to access rest stops, clean washrooms, and local micro-jobs."
      error={error}
      footerContent={
        <div className="space-y-3">
          <div className="text-xs text-pitstop-muted">
            <span>Already have an account? </span>
            <Link
              href={loginUrl}
              className="font-bold text-pitstop-charcoal hover:underline hover:text-pitstop-yellow-dark"
            >
              Log in here
            </Link>
          </div>
          <div className="pt-2 text-xs text-pitstop-muted flex items-center justify-center gap-1">
            <span>Are you a shop or venue owner?</span>
            <Link
              href="/merchant/register"
              className="font-semibold text-pitstop-charcoal hover:underline inline-flex items-center gap-1"
            >
              <Store className="h-3 w-3" /> Merchant Registration
            </Link>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Full Name */}
        <div>
          <label htmlFor="rider-name" className="block text-xs font-bold text-pitstop-charcoal uppercase tracking-wider mb-1.5">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id="rider-name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ramesh Kumar"
            disabled={isSubmitting}
            className="block w-full min-h-[44px] rounded-xl border border-pitstop-border bg-white px-3.5 py-2.5 text-sm text-pitstop-charcoal placeholder:text-pitstop-muted/60 focus:border-pitstop-yellow focus:outline-none focus:ring-2 focus:ring-pitstop-yellow disabled:bg-pitstop-bg"
          />
        </div>

        {/* Mobile Number */}
        <div>
          <label htmlFor="rider-phone" className="block text-xs font-bold text-pitstop-charcoal uppercase tracking-wider mb-1.5">
            Mobile Number <span className="text-red-500">*</span>
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
              required
              autoComplete="tel-national"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="9876543210"
              disabled={isSubmitting}
              className="block w-full min-h-[44px] rounded-r-xl border border-pitstop-border bg-white px-3.5 py-2.5 text-sm text-pitstop-charcoal placeholder:text-pitstop-muted/60 focus:border-pitstop-yellow focus:outline-none focus:ring-2 focus:ring-pitstop-yellow disabled:bg-pitstop-bg"
            />
          </div>
          <p className="mt-1 text-[11px] text-pitstop-muted">
            10-digit phone number. Used to log into your account.
          </p>
        </div>

        {/* Email Address (Optional) */}
        <div>
          <label htmlFor="rider-email" className="block text-xs font-bold text-pitstop-charcoal uppercase tracking-wider mb-1.5">
            Email Address <span className="text-[11px] font-normal text-pitstop-muted lowercase">(optional)</span>
          </label>
          <input
            id="rider-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ramesh@example.com"
            disabled={isSubmitting}
            className="block w-full min-h-[44px] rounded-xl border border-pitstop-border bg-white px-3.5 py-2.5 text-sm text-pitstop-charcoal placeholder:text-pitstop-muted/60 focus:border-pitstop-yellow focus:outline-none focus:ring-2 focus:ring-pitstop-yellow disabled:bg-pitstop-bg"
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="rider-password" className="block text-xs font-bold text-pitstop-charcoal uppercase tracking-wider mb-1.5">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="rider-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              disabled={isSubmitting}
              className="block w-full min-h-[44px] rounded-xl border border-pitstop-border bg-white pl-3.5 pr-10 py-2.5 text-sm text-pitstop-charcoal placeholder:text-pitstop-muted/60 focus:border-pitstop-yellow focus:outline-none focus:ring-2 focus:ring-pitstop-yellow disabled:bg-pitstop-bg"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-pitstop-muted hover:text-pitstop-charcoal focus:outline-none focus:ring-2 focus:ring-pitstop-yellow rounded-r-xl"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Delivery Platform & Vehicle Grid */}
        <div className="grid gap-3 sm:grid-cols-2 pt-1">
          {/* Platform */}
          <div>
            <label htmlFor="rider-platform" className="block text-xs font-bold text-pitstop-charcoal uppercase tracking-wider mb-1.5">
              Primary Network <span className="text-red-500">*</span>
            </label>
            <select
              id="rider-platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              disabled={isSubmitting}
              className="block w-full min-h-[44px] rounded-xl border border-pitstop-border bg-white px-3 py-2 text-sm text-pitstop-charcoal focus:border-pitstop-yellow focus:outline-none focus:ring-2 focus:ring-pitstop-yellow"
            >
              {PLATFORM_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle Type */}
          <div>
            <label htmlFor="rider-vehicle" className="block text-xs font-bold text-pitstop-charcoal uppercase tracking-wider mb-1.5">
              Vehicle Type <span className="text-red-500">*</span>
            </label>
            <select
              id="rider-vehicle"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              disabled={isSubmitting}
              className="block w-full min-h-[44px] rounded-xl border border-pitstop-border bg-white px-3 py-2 text-sm text-pitstop-charcoal focus:border-pitstop-yellow focus:outline-none focus:ring-2 focus:ring-pitstop-yellow"
            >
              {VEHICLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Vehicle Registration Number (Optional) */}
        <div>
          <label htmlFor="rider-veh-number" className="block text-xs font-bold text-pitstop-charcoal uppercase tracking-wider mb-1.5">
            Vehicle Registration Number <span className="text-[11px] font-normal text-pitstop-muted lowercase">(optional)</span>
          </label>
          <input
            id="rider-veh-number"
            type="text"
            value={vehicleNumber}
            onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
            placeholder="e.g. KA-01-EA-1234"
            disabled={isSubmitting}
            className="block w-full min-h-[44px] rounded-xl border border-pitstop-border bg-white px-3.5 py-2.5 text-sm text-pitstop-charcoal placeholder:text-pitstop-muted/60 focus:border-pitstop-yellow focus:outline-none focus:ring-2 focus:ring-pitstop-yellow uppercase disabled:bg-pitstop-bg"
          />
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
              <span>Creating Rider Account...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1.5">
              <span>Create Rider Account</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          )}
        </button>
      </form>
    </AuthCardLayout>
  );
}

export default function RiderRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F7B928] p-8 text-center text-xs text-white">Loading registration portal...</div>}>
      <RegisterFormContent />
    </Suspense>
  );
}
