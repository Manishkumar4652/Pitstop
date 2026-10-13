'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Bike
} from 'lucide-react';
import { AuthCardLayout } from '@/components/auth';
import { Input, Select } from '@/components/ui';
import { useAuth } from '@/lib/auth/AuthContext';
import { UserRole, RegisterRequest } from 'shared-types';
import { sanitizeReturnUrl } from '@/lib/auth/return-url';

function MerchantRegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    businessName: '',
    businessType: 'restaurant',
    gstNumber: '',
    address: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sanitize returnUrl
  const returnUrl = sanitizeReturnUrl(searchParams.get('returnUrl'), '/merchant');

  // If already authenticated, redirect immediately
  React.useEffect(() => {
    if (isAuthenticated) {
      window.location.href = returnUrl;
    }
  }, [isAuthenticated, returnUrl]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      let cleaned = value.replace(/\D/g, '');
      if (cleaned.startsWith('91') && cleaned.length > 10) {
        cleaned = cleaned.slice(2);
      } else if (cleaned.startsWith('0') && cleaned.length > 10) {
        cleaned = cleaned.slice(1);
      }
      setFormData((prev) => ({ ...prev, phone: cleaned.slice(0, 10) }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validations
    if (!formData.businessName.trim()) {
      setError('Please provide your business or venue name.');
      return;
    }

    if (!formData.address.trim()) {
      setError('Please provide your business physical address.');
      return;
    }

    if (!formData.name.trim()) {
      setError('Please provide the contact person name.');
      return;
    }

    const cleanPhone = formData.phone.trim();
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian phone number (e.g. 9876543210).');
      return;
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setError('Please enter a valid email address or leave it blank.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: RegisterRequest = {
        name: formData.name.trim(),
        phone: cleanPhone,
        ...(formData.email.trim() && { email: formData.email.trim().toLowerCase() }),
        password: formData.password,
        role: UserRole.MERCHANT,
        merchantProfile: {
          businessName: formData.businessName.trim(),
          businessType: formData.businessType as any,
          ...(formData.gstNumber.trim() && { gstNumber: formData.gstNumber.trim().toUpperCase() }),
          address: formData.address.trim(),
        },
      };

      const result = await register(payload);

      if (!result.success) {
        setError(result.error || 'Registration failed. Please check your details and try again.');
        setIsSubmitting(false);
        return;
      }

      window.location.href = returnUrl;
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const loginUrl = `/merchant/login${returnUrl !== '/merchant' ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`;
  const registerUrl = `/merchant/register${returnUrl !== '/merchant' ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`;

  return (
    <AuthCardLayout
      mode="register"
      role="merchant"
      loginUrl={loginUrl}
      registerUrl={registerUrl}
      title="Register Merchant Business"
      subtitle="Join PitStop as a merchant partner to list verified rest stops and attract gig riders."
      error={error}
      footerContent={
        <div className="space-y-3">
          <p className="text-xs text-pitstop-muted">
            Already registered as a merchant partner?{' '}
            <Link
              href={loginUrl}
              className="font-bold text-pitstop-charcoal hover:underline hover:text-pitstop-yellow-dark"
            >
              Log in to your account
            </Link>
          </p>
          <p className="text-xs text-pitstop-muted flex items-center justify-center gap-1">
            Looking for the rider portal?{' '}
            <Link
              href="/rider/register"
              className="font-semibold text-pitstop-charcoal hover:underline inline-flex items-center gap-1"
            >
              <Bike className="h-3 w-3" /> Register as a Delivery Rider
            </Link>
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Business Details Section */}
        <div className="border-b border-pitstop-border/60 pb-4 mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-pitstop-muted mb-3">
            Business Details
          </h2>

          <div className="space-y-3">
            <div>
              <label htmlFor="businessName" className="block text-xs font-bold text-pitstop-charcoal mb-1">
                Business Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="businessName"
                name="businessName"
                type="text"
                placeholder="e.g. Chai Point Indiranagar"
                value={formData.businessName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="businessType" className="block text-xs font-bold text-pitstop-charcoal mb-1">
                  Business Category <span className="text-red-500">*</span>
                </label>
                <Select
                  id="businessType"
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                  options={[
                    { value: 'restaurant', label: 'Restaurant / Cafe' },
                    { value: 'tea_stall', label: 'Tea Stall / Snack Bar' },
                    { value: 'garage', label: 'Garage / Service Workshop' },
                    { value: 'supermarket', label: 'Supermarket / Kirana' },
                    { value: 'service_center', label: 'EV Charging / Service Station' },
                    { value: 'other', label: 'Other Commercial Venue' },
                  ]}
                  required
                />
              </div>

              <div>
                <label htmlFor="gstNumber" className="block text-xs font-bold text-pitstop-charcoal mb-1">
                  GSTIN <span className="text-pitstop-muted font-normal">(Optional)</span>
                </label>
                <Input
                  id="gstNumber"
                  name="gstNumber"
                  type="text"
                  placeholder="29AAAAA0000A1Z5"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  maxLength={15}
                />
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-xs font-bold text-pitstop-charcoal mb-1">
                Business Physical Address <span className="text-red-500">*</span>
              </label>
              <Input
                id="address"
                name="address"
                type="text"
                placeholder="Street address, Area, City"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        {/* Contact Person & Credentials */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-pitstop-muted mb-3">
            Partner Account Credentials
          </h2>

          <div>
            <label htmlFor="name" className="block text-xs font-bold text-pitstop-charcoal mb-1">
              Contact Person Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="e.g. Ramesh Gupta"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="phone" className="block text-xs font-bold text-pitstop-charcoal mb-1">
                Primary Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="flex rounded-xl shadow-xs">
                <span className="inline-flex items-center px-3.5 rounded-l-xl border border-r-0 border-pitstop-border bg-pitstop-bg text-xs font-semibold text-pitstop-muted select-none">
                  +91
                </span>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))}
                  required
                  autoComplete="tel"
                  disabled={isSubmitting}
                  className="block w-full min-h-[44px] rounded-r-xl border border-pitstop-border bg-white px-3.5 py-2 text-sm text-pitstop-charcoal placeholder:text-pitstop-muted/60 transition-colors focus:border-pitstop-yellow focus:outline-none focus:ring-2 focus:ring-pitstop-yellow disabled:bg-pitstop-bg disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-bold text-pitstop-charcoal mb-1">
                Business Email <span className="text-pitstop-muted font-normal">(Optional)</span>
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="owner@business.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-bold text-pitstop-charcoal mb-1">
              Account Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isSubmitting}
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
              <span>Registering Account...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1.5">
              <span>Complete Partner Registration</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          )}
        </button>
      </form>
    </AuthCardLayout>
  );
}

export default function MerchantRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7B928] p-8 text-center text-xs text-white">
          Loading merchant registration...
        </div>
      }
    >
      <MerchantRegisterFormContent />
    </Suspense>
  );
}
