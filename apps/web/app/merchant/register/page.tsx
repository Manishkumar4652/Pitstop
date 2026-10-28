'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Bike,
  Store,
  MapPin,
  Clock,
  Users,
  Navigation,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';
import { AuthCardLayout } from '@/components/auth';
import { Input, Select, Badge } from '@/components/ui';
import { useAuth } from '@/lib/auth/AuthContext';
import { UserRole, RegisterRequest, Facility } from 'shared-types';
import { sanitizeReturnUrl } from '@/lib/auth/return-url';
import { allowOnlyDigitsKeyDown, sanitizePhoneNumber, sanitizePincode } from '@/lib/utils/input-validators';
import { useLanguage } from '@/lib/i18n';

function MerchantRegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, isAuthenticated } = useAuth();
  const { isHindi } = useLanguage();

  // Wizard Step (1: Owner Credentials, 2: Shop Details, 3: Address & GPS, 4: Amenities & Capacity)
  const [currentStep, setCurrentStep] = useState<number>(1);

  const [formData, setFormData] = useState({
    // Step 1: Owner & Login
    name: '',
    phone: '',
    email: '',
    password: '',

    // Step 2: Shop & Business Info
    businessName: '',
    businessType: 'restaurant',
    gstNumber: '',
    description: '',

    // Step 3: Address & Location
    street: '',
    area: '',
    city: 'Jaipur',
    state: 'Rajasthan',
    pincode: '',
    landmark: '',
    latitude: '26.9124',
    longitude: '75.7873',

    // Step 4: Amenities & Capacity
    maxRiders: '10',
    openTime: '08:00',
    closeTime: '22:00',
  });

  const [selectedFacilities, setSelectedFacilities] = useState<Facility[]>([
    Facility.DRINKING_WATER,
    Facility.SEATING,
    Facility.CHARGING,
  ]);

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);
  const hasRedirectedRef = React.useRef(false);

  // Sanitize returnUrl
  const returnUrl = sanitizeReturnUrl(searchParams.get('returnUrl'), '/merchant');

  // If already authenticated, redirect cleanly (guarded against loops)
  React.useEffect(() => {
    if (isAuthenticated && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      const target = returnUrl && returnUrl !== '/merchant/register' ? returnUrl : '/merchant';
      window.location.href = target;
    }
  }, [isAuthenticated, returnUrl]);

  const toggleFacility = (facility: Facility) => {
    setSelectedFacilities((prev) =>
      prev.includes(facility) ? prev.filter((f) => f !== facility) : [...prev, facility]
    );
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const cleaned = sanitizePhoneNumber(value);
      setFormData((prev) => ({ ...prev, phone: cleaned }));
      return;
    }
    if (name === 'pincode') {
      const cleaned = sanitizePincode(value);
      setFormData((prev) => ({ ...prev, pincode: cleaned }));
      return;
    }
    if (name === 'maxRiders') {
      const cleaned = value.replace(/\D/g, '').slice(0, 3);
      setFormData((prev) => ({ ...prev, maxRiders: cleaned }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDetectLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setIsDetectingLocation(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setIsDetectingLocation(false);
        setLocationDetected(true);
      },
      (err) => {
        setError(`Could not detect location: ${err.message}. Please enter coordinates or area manually.`);
        setIsDetectingLocation(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Step-by-step validations
  const validateStep = (step: number): boolean => {
    setError(null);

    if (step === 1) {
      if (!formData.name.trim() || formData.name.trim().length < 2) {
        setError('Please provide the contact person / owner name (min 2 characters).');
        return false;
      }
      const cleanPhone = formData.phone.trim();
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        setError('Please enter a valid 10-digit Indian phone number (e.g. 9876543210).');
        return false;
      }
      if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        setError('Please enter a valid email address or leave it blank.');
        return false;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!formData.businessName.trim() || formData.businessName.trim().length < 2) {
        setError('Please enter your shop or business name.');
        return false;
      }
      return true;
    }

    if (step === 3) {
      if (!formData.street.trim() || formData.street.trim().length < 2) {
        setError('Please provide shop street address or building number.');
        return false;
      }
      if (!formData.area.trim() || formData.area.trim().length < 2) {
        setError('Please provide the area or locality.');
        return false;
      }
      if (!formData.city.trim()) {
        setError('Please provide the city.');
        return false;
      }
      if (!formData.pincode.trim() || !/^\d{6}$/.test(formData.pincode.trim())) {
        setError('Please enter a valid 6-digit Indian postal pincode.');
        return false;
      }
      return true;
    }

    if (step === 4) {
      if (selectedFacilities.length === 0) {
        setError('Please select at least one amenity facility offered to delivery riders.');
        return false;
      }
      const ridersNum = parseInt(formData.maxRiders, 10);
      if (isNaN(ridersNum) || ridersNum < 1) {
        setError('Rider seating capacity must be at least 1.');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;

    // Check phone availability on Step 1 before advancing
    if (currentStep === 1) {
      const cleanPhone = formData.phone.trim();
      setIsCheckingPhone(true);
      setError(null);
      try {
        const res = await fetch(`/api/auth/check-phone?phone=${encodeURIComponent(cleanPhone)}`);
        const json = await res.json().catch(() => null);
        if (json && json.data && json.data.available === false) {
          setError('This mobile phone number is already registered. Please log in or use a different phone number.');
          setIsCheckingPhone(false);
          return;
        }
      } catch {
        // Proceed gracefully if phone pre-check network fails
      } finally {
        setIsCheckingPhone(false);
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const cleanPhone = formData.phone.trim();
      const lat = parseFloat(formData.latitude) || 26.9124;
      const lng = parseFloat(formData.longitude) || 75.7873;
      const fullAddressString = `${formData.street.trim()}, ${formData.area.trim()}, ${formData.city.trim()}, ${formData.state.trim()} - ${formData.pincode.trim()}`;

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
          address: fullAddressString,
          description: formData.description.trim() || `${formData.businessName.trim()} welcomes delivery partners with resting amenities, cool drinking water, and phone charging points.`,
          shopAddress: {
            street: formData.street.trim(),
            area: formData.area.trim(),
            city: formData.city.trim(),
            state: formData.state.trim(),
            pincode: formData.pincode.trim(),
            ...(formData.landmark.trim() && { landmark: formData.landmark.trim() }),
          },
          location: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          facilities: selectedFacilities,
          capacity: {
            maxRiders: parseInt(formData.maxRiders, 10) || 10,
          },
          operatingHours: {
            openTime: formData.openTime || '08:00',
            closeTime: formData.closeTime || '22:00',
          },
        },
      };

      const result = await register(payload);

      if (!result.success) {
        const errorMsg = result.error || 'Registration failed. Please check your details and try again.';
        setError(errorMsg);
        setIsSubmitting(false);

        // If phone or email conflict, return directly to Step 1 so the user can easily see and update credentials
        if (errorMsg.toLowerCase().includes('phone') || errorMsg.toLowerCase().includes('email')) {
          setCurrentStep(1);
        }
        return;
      }

      hasRedirectedRef.current = true;
      const target = returnUrl && returnUrl !== '/merchant/register' ? returnUrl : '/merchant';
      window.location.href = target;
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const loginUrl = `/merchant/login${returnUrl !== '/merchant' ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`;
  const registerUrl = `/merchant/register${returnUrl !== '/merchant' ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`;

  const allFacilities = [
    { id: Facility.DRINKING_WATER, label: isHindi ? 'पीने का पानी' : 'Drinking Water', icon: '💧' },
    { id: Facility.SEATING, label: isHindi ? 'बैठने की जगह' : 'Seating Area', icon: '🪑' },
    { id: Facility.CHARGING, label: isHindi ? 'फोन चार्जिंग' : 'Phone Charging', icon: '⚡' },
    { id: Facility.RESTROOM, label: isHindi ? 'स्वच्छ शौचालय' : 'Clean Restroom', icon: '🚻' },
    { id: Facility.WIFI, label: isHindi ? 'हाई-स्पीड वाई-फ़ाई' : 'High-Speed Wi-Fi', icon: '📶' },
    { id: Facility.PARKING, label: isHindi ? 'दोपहिया पार्किंग' : 'Two-Wheeler Parking', icon: '🅿️' },
    { id: Facility.AIR_CONDITIONING, label: isHindi ? 'एसी लाउंज' : 'AC Lounge', icon: '❄️' },
    { id: Facility.FIRST_AID, label: isHindi ? 'प्राथमिक चिकित्सा (फर्स्ट एड)' : 'First Aid Kit', icon: '🩹' },
  ];

  return (
    <AuthCardLayout
      mode="register"
      role="merchant"
      loginUrl={loginUrl}
      registerUrl={registerUrl}
      title={isHindi ? 'मर्चेंट पार्टनर पंजीकरण' : 'Merchant & Shop Registration'}
      subtitle={
        isHindi
          ? 'अपनी दुकान को रेस्ट स्टॉप के रूप में लिस्ट करें और डिलीवरी राइडर्स का स्वागत करें।'
          : 'One unified account for you and your shop. Register once to immediately list your rest stop and welcome delivery riders.'
      }
      error={error}
      footerContent={
        <div className="space-y-3">
          <p className="text-xs text-pitstop-muted">
            {isHindi ? 'पहले से मर्चेंट पार्टनर हैं?' : 'Already registered as a merchant partner?'}{' '}
            <Link
              href={loginUrl}
              className="font-bold text-pitstop-charcoal hover:underline hover:text-pitstop-yellow-dark"
            >
              {isHindi ? 'अपने खाते में लॉग इन करें' : 'Log in to your account'}
            </Link>
          </p>
          <p className="text-xs text-pitstop-muted flex items-center justify-center gap-1">
            {isHindi ? 'राइडर पोर्टल खोज रहे हैं?' : 'Looking for the rider portal?'}{' '}
            <Link
              href="/rider/register"
              className="font-semibold text-pitstop-charcoal hover:underline inline-flex items-center gap-1"
            >
              <Bike className="h-3 w-3" /> {isHindi ? 'डिलीवरी राइडर के रूप में रजिस्टर करें' : 'Register as a Delivery Rider'}
            </Link>
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Step Progress Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs font-bold text-pitstop-charcoal mb-1.5">
            <span className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pitstop-yellow text-[11px] font-black text-pitstop-charcoal">
                {currentStep}
              </span>
              <span>
                {currentStep === 1 && (isHindi ? 'चरण 1: मालिक और लॉगिन विवरण' : 'Step 1: Owner & Login Credentials')}
                {currentStep === 2 && (isHindi ? 'चरण 2: दुकान का विवरण' : 'Step 2: Shop Details')}
                {currentStep === 3 && (isHindi ? 'चरण 3: दुकान का पता और स्थान' : 'Step 3: Shop Address & Location')}
                {currentStep === 4 && (isHindi ? 'चरण 4: सुविधाएं और क्षमता' : 'Step 4: Amenities & Capacity')}
              </span>
            </span>
            <span className="text-pitstop-muted font-semibold">
              {currentStep} {isHindi ? 'कुल' : 'of'} 4
            </span>
          </div>
          {/* Progress Bar */}
          <div className="h-1.5 w-full rounded-full bg-pitstop-bg overflow-hidden">
            <div
              className="h-full bg-pitstop-yellow transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* ── STEP 1: Owner & Account Credentials ── */}
        {currentStep === 1 && (
          <div className="space-y-3 animate-fadeIn">
            <div>
              <label htmlFor="name" className="block text-xs font-bold text-pitstop-charcoal mb-1">
                {isHindi ? 'मालिक / संपर्क व्यक्ति का नाम' : 'Owner / Contact Person Name'} <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder={isHindi ? 'उदा. रमेश शर्मा' : 'e.g. Ramesh Sharma'}
                value={formData.name}
                onChange={handleChange}
                required
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-bold text-pitstop-charcoal mb-1">
                {isHindi ? 'प्राथमिक मोबाइल नंबर' : 'Primary Mobile Number'} <span className="text-red-500">*</span>
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
                  onChange={handleChange}
                  onKeyDown={allowOnlyDigitsKeyDown}
                  required
                  autoComplete="tel"
                  className="block w-full min-h-[44px] rounded-r-xl border border-pitstop-border bg-white px-3.5 py-2 text-sm text-pitstop-charcoal placeholder:text-pitstop-muted/60 transition-colors focus:border-pitstop-yellow focus:outline-none focus:ring-2 focus:ring-pitstop-yellow"
                />
              </div>
              <p className="mt-1 text-[11px] text-pitstop-muted">
                {isHindi ? 'लॉगिन और एसएमएस अलर्ट के लिए उपयोग किया जाता है।' : 'Used for login and SMS alerts.'}
              </p>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-bold text-pitstop-charcoal mb-1">
                {isHindi ? 'व्यावसायिक ईमेल' : 'Business Email'} <span className="text-pitstop-muted font-normal">({isHindi ? 'वैकल्पिक' : 'Optional'})</span>
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

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-pitstop-charcoal mb-1">
                {isHindi ? 'खाता पासवर्ड' : 'Account Password'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={isHindi ? 'न्यूनतम 6 अक्षर' : 'Minimum 6 characters'}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="block w-full min-h-[44px] rounded-xl border border-pitstop-border bg-white pl-3.5 pr-10 py-2.5 text-sm text-pitstop-charcoal placeholder:text-pitstop-muted/60 focus:border-pitstop-yellow focus:outline-none focus:ring-2 focus:ring-pitstop-yellow"
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
        )}

        {/* ── STEP 2: Shop & Business Info ── */}
        {currentStep === 2 && (
          <div className="space-y-3 animate-fadeIn">
            <div>
              <label htmlFor="businessName" className="block text-xs font-bold text-pitstop-charcoal mb-1">
                {isHindi ? 'दुकान / प्रतिष्ठान का नाम' : 'Shop / Venue Name'} <span className="text-red-500">*</span>
              </label>
              <Input
                id="businessName"
                name="businessName"
                type="text"
                placeholder={isHindi ? 'उदा. चाय सुट्टा बार और रेस्ट हब' : 'e.g. Chai Sutta Bar & Rest Hub'}
                value={formData.businessName}
                onChange={handleChange}
                required
                autoFocus
              />
              <p className="mt-1 text-[11px] text-pitstop-muted">
                {isHindi
                  ? 'यह नाम राइडर्स को आपके सत्यापित पिटस्टॉप स्थान के रूप में दिखाया जाएगा।'
                  : 'This name will be displayed to riders as your verified PitStop location.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="businessType" className="block text-xs font-bold text-pitstop-charcoal mb-1">
                  {isHindi ? 'व्यापार श्रेणी' : 'Business Category'} <span className="text-red-500">*</span>
                </label>
                <Select
                  id="businessType"
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                  options={[
                    { value: 'restaurant', label: isHindi ? 'रेस्टोरेंट / कैफे' : 'Restaurant / Cafe' },
                    { value: 'tea_stall', label: isHindi ? 'चाय स्टॉल / स्नैक बार' : 'Tea Stall / Snack Bar' },
                    { value: 'hotel', label: isHindi ? 'होटल' : 'Hotel' },
                    { value: 'supermarket', label: isHindi ? 'सुपरमार्केट / किराना' : 'Supermarket / Kirana' },
                    { value: 'service_center', label: isHindi ? 'ईवी चार्जिंग / सर्विस स्टेशन' : 'EV Charging / Service Station' },
                    { value: 'other', label: isHindi ? 'अन्य व्यावसायिक स्थल' : 'Other Commercial Venue' },
                  ]}
                  required
                />
              </div>

              <div>
                <label htmlFor="gstNumber" className="block text-xs font-bold text-pitstop-charcoal mb-1">
                  GSTIN <span className="text-pitstop-muted font-normal">({isHindi ? 'वैकल्पिक' : 'Optional'})</span>
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
              <label htmlFor="description" className="block text-xs font-bold text-pitstop-charcoal mb-1">
                {isHindi ? 'डिलीवरी राइडर्स के लिए स्वागत संदेश / विवरण' : 'Welcome Note / Description for Delivery Riders'}
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder={
                  isHindi
                    ? 'उदा. सभी डिलीवरी पार्टनर्स के लिए साफ बैठने की व्यवस्था, पीने का पानी और फोन चार्जिंग की सुविधा।'
                    : 'e.g. Clean seating, filtered drinking water, and high-speed phone charging available for all delivery partners.'
                }
                value={formData.description}
                onChange={handleChange}
                className="block w-full rounded-xl border border-pitstop-border bg-white px-3.5 py-2 text-sm text-pitstop-charcoal placeholder:text-pitstop-muted/60 transition-colors focus:border-pitstop-yellow focus:outline-none focus:ring-2 focus:ring-pitstop-yellow"
              />
            </div>
          </div>
        )}

        {/* ── STEP 3: Address & GPS Location ── */}
        {currentStep === 3 && (
          <div className="space-y-3 animate-fadeIn">
            <div>
              <label htmlFor="street" className="block text-xs font-bold text-pitstop-charcoal mb-1">
                {isHindi ? 'दुकान संख्या / सड़क का पता' : 'Shop No. / Street Address'} <span className="text-red-500">*</span>
              </label>
              <Input
                id="street"
                name="street"
                type="text"
                placeholder={isHindi ? 'दुकान 14, भूतल, मुख्य बाजार' : 'Shop 14, Ground Floor, Main Market'}
                value={formData.street}
                onChange={handleChange}
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="area" className="block text-xs font-bold text-pitstop-charcoal mb-1">
                  {isHindi ? 'क्षेत्र / इलाका' : 'Area / Locality'} <span className="text-red-500">*</span>
                </label>
                <Input
                  id="area"
                  name="area"
                  type="text"
                  placeholder={isHindi ? 'उदा. मालवीय नगर' : 'e.g. Malviya Nagar'}
                  value={formData.area}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="pincode" className="block text-xs font-bold text-pitstop-charcoal mb-1">
                  {isHindi ? 'पिनकोड' : 'Pincode'} <span className="text-red-500">*</span>
                </label>
                <Input
                  id="pincode"
                  name="pincode"
                  type="tel"
                  inputMode="numeric"
                  placeholder="302017"
                  value={formData.pincode}
                  onChange={handleChange}
                  maxLength={6}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="city" className="block text-xs font-bold text-pitstop-charcoal mb-1">
                  {isHindi ? 'शहर' : 'City'} <span className="text-red-500">*</span>
                </label>
                <Input
                  id="city"
                  name="city"
                  type="text"
                  placeholder={isHindi ? 'जयपुर' : 'Jaipur'}
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="state" className="block text-xs font-bold text-pitstop-charcoal mb-1">
                  {isHindi ? 'राज्य' : 'State'} <span className="text-red-500">*</span>
                </label>
                <Input
                  id="state"
                  name="state"
                  type="text"
                  placeholder={isHindi ? 'राजस्थान' : 'Rajasthan'}
                  value={formData.state}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="landmark" className="block text-xs font-bold text-pitstop-charcoal mb-1">
                {isHindi ? 'लैंडमार्क / पहचान चिह्न' : 'Landmark'} <span className="text-pitstop-muted font-normal">({isHindi ? 'वैकल्पिक' : 'Optional'})</span>
              </label>
              <Input
                id="landmark"
                name="landmark"
                type="text"
                placeholder={isHindi ? 'उदा. मेट्रो पिलर 42 के सामने' : 'e.g. Opposite Metro Pillar 42'}
                value={formData.landmark}
                onChange={handleChange}
              />
            </div>

            {/* GPS Geolocation Detection */}
            <div className="rounded-xl border border-pitstop-border bg-pitstop-bg/60 p-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-pitstop-charcoal">
                    <Navigation className="h-3.5 w-3.5 text-pitstop-yellow-dark" />
                    <span>{isHindi ? 'जीपीएस निर्देशांक' : 'GPS Coordinates'}</span>
                    {locationDetected && (
                      <Badge variant="success" size="sm" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" /> {isHindi ? 'पहचान लिया गया' : 'Detected'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-pitstop-muted">
                    {formData.latitude}, {formData.longitude}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isDetectingLocation}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-pitstop-border bg-white px-3 py-1.5 text-xs font-bold text-pitstop-charcoal shadow-xs hover:bg-pitstop-bg transition-colors disabled:opacity-50"
                >
                  {isDetectingLocation ? (
                    <>
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-pitstop-charcoal border-t-transparent" />
                      <span>{isHindi ? 'पहचान हो रही है...' : 'Detecting...'}</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="h-3.5 w-3.5 text-pitstop-yellow-dark" />
                      <span>{isHindi ? 'स्थान का पता लगाएं' : 'Auto-Detect GPS'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: Rider Amenities & Capacity ── */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-fadeIn">
            {/* Facilities Selection */}
            <div>
              <label className="block text-xs font-bold text-pitstop-charcoal mb-1">
                {isHindi ? 'डिलीवरी राइडर्स के लिए सुविधाएं' : 'Amenities Provided for Delivery Riders'} <span className="text-red-500">*</span>
              </label>
              <p className="text-[11px] text-pitstop-muted mb-2.5">
                {isHindi
                  ? 'अपनी दुकान पर उपलब्ध सुविधाओं का चयन करें।'
                  : 'Select amenities available for gig riders at your shop venue.'}
              </p>

              <div className="grid grid-cols-2 gap-2">
                {allFacilities.map((fac) => {
                  const isSelected = selectedFacilities.includes(fac.id);
                  return (
                    <button
                      key={fac.id}
                      type="button"
                      onClick={() => toggleFacility(fac.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-semibold transition-all min-h-[44px] ${isSelected
                          ? 'border-pitstop-yellow bg-pitstop-yellow-light/60 text-pitstop-charcoal shadow-xs ring-1 ring-pitstop-yellow'
                          : 'border-pitstop-border bg-white text-pitstop-muted hover:border-pitstop-charcoal/30 hover:bg-pitstop-bg'
                        }`}
                    >
                      <span className="text-base shrink-0">{fac.icon}</span>
                      <span className="flex-1 text-[11px] leading-tight">{fac.label}</span>
                      {isSelected && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-pitstop-yellow-dark shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rider Seating Capacity & Hours */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label htmlFor="maxRiders" className="block text-xs font-bold text-pitstop-charcoal mb-1">
                  {isHindi ? 'बैठने की क्षमता' : 'Seating Capacity'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    id="maxRiders"
                    name="maxRiders"
                    type="number"
                    min={1}
                    max={100}
                    value={formData.maxRiders}
                    onChange={handleChange}
                    required
                  />
                  <Users className="h-4 w-4 text-pitstop-muted absolute right-3 top-3 pointer-events-none" />
                </div>
                <p className="mt-0.5 text-[10px] text-pitstop-muted">
                  {isHindi ? 'एक समय में अधिकतम राइडर्स' : 'Max riders at once'}
                </p>
              </div>

              <div>
                <label htmlFor="openTime" className="block text-xs font-bold text-pitstop-charcoal mb-1">
                  {isHindi ? 'खुलने का समय' : 'Opening Time'}
                </label>
                <Input
                  id="openTime"
                  name="openTime"
                  type="time"
                  value={formData.openTime}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="closeTime" className="block text-xs font-bold text-pitstop-charcoal mb-1">
                  {isHindi ? 'बंद होने का समय' : 'Closing Time'}
                </label>
                <Input
                  id="closeTime"
                  name="closeTime"
                  type="time"
                  value={formData.closeTime}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Review Summary Notice */}
            <div className="rounded-xl border border-pitstop-border bg-amber-50/60 p-3 text-xs text-pitstop-charcoal flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-pitstop-yellow-dark shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-[11px]">
                <p className="font-bold text-pitstop-charcoal">
                  {isHindi ? 'शुरू करने के लिए तैयार:' : 'Ready to launch:'} {formData.businessName || (isHindi ? 'आपकी दुकान' : 'Your Shop')}
                </p>
                <p className="text-pitstop-muted">
                  {isHindi
                    ? 'आपका मर्चेंट खाता और रेस्ट स्टॉप तुरंत सक्रिय हो जाएगा। डैशबोर्ड से आप अपना क्यूआर कोड पोस्टर भी डाउनलोड कर सकेंगे!'
                    : 'Your merchant login and shop rest stop will be created simultaneously. You can immediately access your desk QR code poster on the dashboard!'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step Navigation Controls */}
        <div className="pt-2 flex items-center gap-3">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="flex-1 min-h-[46px] rounded-full border border-pitstop-border bg-white hover:bg-pitstop-bg text-pitstop-charcoal font-bold text-xs tracking-wide transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{isHindi ? 'पीछे' : 'Back'}</span>
            </button>
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={isCheckingPhone}
              className="flex-1 min-h-[46px] rounded-full bg-pitstop-yellow hover:bg-pitstop-yellow-dark text-pitstop-charcoal font-black text-sm tracking-wide shadow-md shadow-pitstop-yellow/30 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isCheckingPhone ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-pitstop-charcoal border-t-transparent" />
                  <span>{isHindi ? 'फोन की जांच हो रही है...' : 'Checking Phone...'}</span>
                </span>
              ) : (
                <>
                  <span>{isHindi ? 'आगे बढ़ें' : 'Continue'}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 min-h-[46px] rounded-full bg-pitstop-yellow hover:bg-pitstop-yellow-dark text-pitstop-charcoal font-black text-sm tracking-wide shadow-md shadow-pitstop-yellow/30 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-pitstop-charcoal border-t-transparent" />
                  <span>{isHindi ? 'खाता और दुकान शुरू हो रही है...' : 'Launching Account & Shop...'}</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{isHindi ? 'पूरा करें और दुकान शुरू करें' : 'Complete & Launch Shop'}</span>
                </span>
              )}
            </button>
          )}
        </div>
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
