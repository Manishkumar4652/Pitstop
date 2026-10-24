'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Store, 
  MapPin, 
  Clock, 
  Users, 
  Info, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  Navigation
} from 'lucide-react';
import { PublicLayout, MerchantNav } from '@/components/layout';
import { 
  Container, 
  PageHeader, 
  Card, 
  Button, 
  Input, 
  Select, 
  Badge 
} from '@/components/ui';
import { Facility, CapacityStatus, UserPublicProfile } from 'shared-types';
import { createMerchantRestStop } from '@/lib/api/merchant-rest-stops';

interface CreateRestStopContentProps {
  user: UserPublicProfile;
}

export const CreateRestStopContent: React.FC<CreateRestStopContentProps> = ({ user }) => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: user.merchantProfile?.businessName ? `${user.merchantProfile.businessName} Rest Stop` : '',
    venueCategory: 'Beverage Cafe & Quick Rest Hub',
    street: user.merchantProfile?.address || '',
    area: '',
    city: 'Jaipur',
    state: 'Rajasthan',
    pincode: '',
    landmark: '',
    latitude: '26.9124',
    longitude: '75.7873',
    maxRiders: '10',
    openTime: '08:00',
    closeTime: '22:00',
    description: '',
  });

  const [selectedFacilities, setSelectedFacilities] = useState<Facility[]>([
    Facility.DRINKING_WATER,
    Facility.SEATING,
    Facility.CHARGING,
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);
  const [createdVenueName, setCreatedVenueName] = useState<string>('');

  const toggleFacility = (facility: Facility) => {
    setSelectedFacilities((prev) =>
      prev.includes(facility) ? prev.filter((f) => f !== facility) : [...prev, facility]
    );
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim() || formData.name.trim().length < 3) {
      newErrors.name = 'Rest stop name must be at least 3 characters long.';
    }
    if (!formData.street.trim() || formData.street.trim().length < 3) {
      newErrors.street = 'Street address must be at least 3 characters.';
    }
    if (!formData.area.trim() || formData.area.trim().length < 2) {
      newErrors.area = 'Locality or area must be at least 2 characters.';
    }
    if (!formData.pincode.trim() || !/^\d{6}$/.test(formData.pincode.trim())) {
      newErrors.pincode = 'Valid 6-digit Indian pincode is required.';
    }
    if (!formData.description.trim() || formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters.';
    }
    if (selectedFacilities.length === 0) {
      newErrors.facilities = 'Select at least one amenity facility.';
    }
    const maxRidersNum = parseInt(formData.maxRiders, 10);
    if (isNaN(maxRidersNum) || maxRidersNum < 1) {
      newErrors.maxRiders = 'Capacity must be at least 1 rider.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDetectLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setIsDetectingLocation(false);
      },
      (err) => {
        console.warn('Geolocation failed', err);
        setIsDetectingLocation(false);
        alert('Could not detect location automatically. You can enter Jaipur coordinates or use default.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
      const operatingHours = days.map((day) => ({
        day,
        openTime: formData.openTime,
        closeTime: formData.closeTime,
        isOpen: true,
      }));

      const lat = parseFloat(formData.latitude) || 26.9124;
      const lng = parseFloat(formData.longitude) || 75.7873;

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        address: {
          street: formData.street.trim(),
          area: formData.area.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
          ...(formData.landmark.trim() && { landmark: formData.landmark.trim() }),
        },
        location: {
          type: 'Point' as const,
          coordinates: [lng, lat] as [number, number], // GeoJSON format: [longitude, latitude]
        },
        facilities: selectedFacilities,
        images: [],
        capacity: {
          maxRiders: parseInt(formData.maxRiders, 10),
          status: CapacityStatus.AVAILABLE,
        },
        operatingHours,
      };

      const result = await createMerchantRestStop(payload);
      setCreatedVenueName(result.name);
      setSubmissionSuccess(true);
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to create rest stop. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const allFacilities = [
    { id: Facility.DRINKING_WATER, label: 'Drinking Water' },
    { id: Facility.SEATING, label: 'Seating Area' },
    { id: Facility.CHARGING, label: 'Phone Charging' },
    { id: Facility.RESTROOM, label: 'Clean Restroom' },
    { id: Facility.WIFI, label: 'High-Speed Wi-Fi' },
    { id: Facility.PARKING, label: 'Two-Wheeler Parking' },
    { id: Facility.AIR_CONDITIONING, label: 'AC Lounge' },
    { id: Facility.FIRST_AID, label: 'First Aid Kit' },
  ];

  return (
    <PublicLayout>
      <MerchantNav />

      <main id="main-content" className="pb-20 md:pb-12">
        <PageHeader
          title="Register New Rest Stop"
          description="Register your restaurant, tea stall, or store as a community rest facility. New rest stops are reviewed and verified by platform administrators before going live on public discovery."
          badge="Partner Portal"
          backHref="/merchant/rest-stops"
        />

        <section className="py-6 sm:py-8" aria-label="Create rest stop form">
          <Container size="lg">
            {/* Live Success Banner */}
            {submissionSuccess ? (
              <Card className="p-8 text-center space-y-4 border-emerald-200 bg-white shadow-lift">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <Badge variant="warning" size="sm" className="mb-2">
                    Pending Admin Approval
                  </Badge>
                  <h2 className="text-xl font-bold text-pitstop-charcoal">
                    &quot;{createdVenueName}&quot; Registered Successfully!
                  </h2>
                  <p className="text-xs text-pitstop-muted max-w-md mx-auto leading-relaxed">
                    Your rest stop facility has been recorded in the database and submitted for admin review. Once an administrator approves your venue, it will become active on the public discovery map and eligible for venue QR code generation.
                  </p>
                </div>
                <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                  <Link href="/merchant/rest-stops">
                    <Button variant="primary" size="md">
                      View My Rest Stops
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => {
                      setSubmissionSuccess(false);
                      setFormData({
                        name: '',
                        venueCategory: 'Beverage Cafe & Quick Rest Hub',
                        street: '',
                        area: '',
                        city: 'Jaipur',
                        state: 'Rajasthan',
                        pincode: '',
                        landmark: '',
                        latitude: '26.9124',
                        longitude: '75.7873',
                        maxRiders: '10',
                        openTime: '08:00',
                        closeTime: '22:00',
                        description: '',
                      });
                    }}
                  >
                    Register Another Venue
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="p-6 sm:p-8">
                {errors.form && (
                  <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-xs flex items-start gap-2.5">
                    <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Unable to register rest stop</p>
                      <p className="mt-0.5">{errors.form}</p>
                    </div>
                  </div>
                )}
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {/* Section 1: Venue Identity */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-pitstop-charcoal border-b border-pitstop-border pb-2 flex items-center gap-2">
                    <Store className="h-4 w-4 text-pitstop-yellow-dark" />
                    <span>Venue Identity</span>
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      id="venue-name"
                      label="Rest Stop / Venue Name"
                      placeholder="e.g. Chai Point Indiranagar Hub"
                      required
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      error={errors.name}
                    />

                    <Select
                      id="venue-category"
                      label="Venue Category"
                      required
                      value={formData.venueCategory}
                      onChange={(e) => handleInputChange('venueCategory', e.target.value)}
                      options={[
                        { label: 'Beverage Cafe & Quick Rest Hub', value: 'Beverage Cafe & Quick Rest Hub' },
                        { label: 'Restaurant & Designated Rest Desk', value: 'Restaurant & Designated Rest Desk' },
                        { label: 'Cloud Kitchen & Rider Lounge', value: 'Cloud Kitchen & Rider Lounge' },
                        { label: 'EV Charging Hub & Plaza', value: 'EV Charging Hub & Plaza' },
                        { label: 'Roadside Eatery & Corner', value: 'Roadside Eatery & Corner' },
                        { label: 'Bakery & Coffee Shop', value: 'Bakery & Coffee Shop' },
                      ]}
                    />
                  </div>

                  <div className="w-full flex flex-col gap-1.5">
                    <label htmlFor="venue-desc" className="text-xs font-semibold text-pitstop-charcoal">
                      Description & Welcome Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="venue-desc"
                      rows={3}
                      required
                      placeholder="Describe your venue, seating setup, and welcoming guidelines for delivery riders..."
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className={`w-full rounded-xl border bg-white p-3 text-base sm:text-sm text-pitstop-charcoal placeholder:text-pitstop-muted/60 transition-colors focus:outline-none focus:ring-2 focus:ring-pitstop-yellow ${
                        errors.description ? 'border-red-500' : 'border-pitstop-border hover:border-pitstop-muted'
                      }`}
                    />
                    {errors.description && (
                      <p className="text-xs text-red-600 font-medium">{errors.description}</p>
                    )}
                  </div>
                </div>

                {/* Section 2: Physical Address */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-base font-bold text-pitstop-charcoal border-b border-pitstop-border pb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-pitstop-yellow-dark" />
                    <span>Physical Address</span>
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Input
                        id="venue-street"
                        label="Street Address"
                        placeholder="e.g. 100 Feet Road, HAL 2nd Stage"
                        required
                        value={formData.street}
                        onChange={(e) => handleInputChange('street', e.target.value)}
                        error={errors.street}
                      />
                    </div>

                    <Input
                      id="venue-area"
                      label="Area / Locality"
                      placeholder="e.g. Indiranagar"
                      required
                      value={formData.area}
                      onChange={(e) => handleInputChange('area', e.target.value)}
                      error={errors.area}
                    />

                    <Input
                      id="venue-city"
                      label="City"
                      placeholder="Jaipur"
                      required
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                    />

                    <Input
                      id="venue-state"
                      label="State"
                      placeholder="Rajasthan"
                      required
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                    />

                    <Input
                      id="venue-pincode"
                      label="6-Digit Pincode"
                      placeholder="302001"
                      required
                      maxLength={6}
                      value={formData.pincode}
                      onChange={(e) => handleInputChange('pincode', e.target.value)}
                      error={errors.pincode}
                    />

                    <Input
                      id="venue-landmark"
                      label="Nearest Landmark (Optional)"
                      placeholder="e.g. Near Panch Batti / MI Road"
                      value={formData.landmark}
                      onChange={(e) => handleInputChange('landmark', e.target.value)}
                    />

                    <div className="sm:col-span-2 pt-2 border-t border-pitstop-border/60">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-pitstop-charcoal flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-pitstop-yellow-dark" />
                          <span>Map Location Coordinates (Jaipur Default)</span>
                        </label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleDetectLocation}
                          disabled={isDetectingLocation}
                          leftIcon={<Navigation className={`h-3 w-3 ${isDetectingLocation ? 'animate-spin' : ''}`} />}
                          className="text-xs"
                        >
                          {isDetectingLocation ? 'Detecting GPS...' : 'Detect My GPS Location'}
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          id="venue-lat"
                          label="Latitude"
                          placeholder="26.9124"
                          value={formData.latitude}
                          onChange={(e) => handleInputChange('latitude', e.target.value)}
                        />
                        <Input
                          id="venue-lng"
                          label="Longitude"
                          placeholder="75.7873"
                          value={formData.longitude}
                          onChange={(e) => handleInputChange('longitude', e.target.value)}
                        />
                      </div>
                      <p className="text-[11px] text-pitstop-muted mt-1.5">
                        These coordinates position your rest stop pin on the rider exploration map. Default is Jaipur city center.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 3: Facilities & Capacity */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-base font-bold text-pitstop-charcoal border-b border-pitstop-border pb-2 flex items-center gap-2">
                    <Users className="h-4 w-4 text-pitstop-yellow-dark" />
                    <span>Facilities & Seating Capacity</span>
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <Input
                      id="venue-capacity"
                      label="Maximum Seating Capacity"
                      type="number"
                      min={1}
                      max={50}
                      required
                      value={formData.maxRiders}
                      onChange={(e) => handleInputChange('maxRiders', e.target.value)}
                    />

                    <Input
                      id="venue-open-time"
                      label="Opening Time"
                      type="time"
                      required
                      value={formData.openTime}
                      onChange={(e) => handleInputChange('openTime', e.target.value)}
                    />

                    <Input
                      id="venue-close-time"
                      label="Closing Time"
                      type="time"
                      required
                      value={formData.closeTime}
                      onChange={(e) => handleInputChange('closeTime', e.target.value)}
                    />
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-pitstop-charcoal block mb-2">
                      Available Amenities (Select all supported) <span className="text-red-500">*</span>
                    </span>
                    <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-4">
                      {allFacilities.map((fac) => {
                        const isSelected = selectedFacilities.includes(fac.id);
                        return (
                          <button
                            key={fac.id}
                            type="button"
                            onClick={() => toggleFacility(fac.id)}
                            className={`p-3 rounded-lg border text-left text-xs font-semibold transition-all min-h-[44px] flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-pitstop-yellow ${
                              isSelected
                                ? 'border-pitstop-yellow bg-pitstop-yellow-light text-pitstop-charcoal ring-1 ring-pitstop-yellow/50'
                                : 'border-pitstop-border bg-white text-pitstop-muted hover:border-pitstop-muted hover:text-pitstop-charcoal'
                            }`}
                            aria-pressed={isSelected}
                          >
                            <span>{fac.label}</span>
                            {isSelected && <CheckCircle2 className="h-4 w-4 text-pitstop-charcoal" />}
                          </button>
                        );
                      })}
                    </div>
                    {errors.facilities && (
                      <p className="text-xs text-red-600 font-medium mt-1.5">{errors.facilities}</p>
                    )}
                  </div>
                </div>

                {/* Form Submit & Cancel Actions */}
                <div className="pt-6 border-t border-pitstop-border flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-xs text-pitstop-muted">
                    New rest stops are submitted in <strong>Pending Approval</strong> status.
                  </span>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Link href="/merchant/rest-stops" className="w-full sm:w-auto">
                      <Button variant="outline" fullWidth size="md" disabled={isSubmitting}>
                        Cancel
                      </Button>
                    </Link>
                    <Button 
                      variant="primary" 
                      type="submit" 
                      fullWidth 
                      size="md"
                      isLoading={isSubmitting}
                      disabled={isSubmitting}
                    >
                      Register Rest Stop
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
            )}
          </Container>
        </section>
      </main>
    </PublicLayout>
  );
};
