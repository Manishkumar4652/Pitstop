'use client';

import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  MapPin, 
  Clock, 
  Users, 
  Tag, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { Card, Button, Input, Select } from '@/components/ui';
import { 
  Facility, 
  CapacityStatus, 
  RestStopMerchantResponse,
  UpdateRestStopRequest 
} from 'shared-types';
import { updateMerchantRestStop } from '@/lib/api/merchant-rest-stops';

interface EditRestStopModalProps {
  restStop: RestStopMerchantResponse;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updated: RestStopMerchantResponse) => void;
}

export const EditRestStopModal: React.FC<EditRestStopModalProps> = ({
  restStop,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const [formData, setFormData] = useState({
    name: restStop.name || '',
    description: restStop.description || '',
    street: restStop.address.street || '',
    area: restStop.address.area || '',
    city: restStop.address.city || 'Bengaluru',
    state: restStop.address.state || 'Karnataka',
    pincode: restStop.address.pincode || '',
    landmark: restStop.address.landmark || '',
    maxRiders: String(restStop.capacity.maxRiders || 10),
    capacityStatus: restStop.capacity.status || CapacityStatus.AVAILABLE,
    openTime: restStop.operatingHours?.[0]?.openTime || '08:00',
    closeTime: restStop.operatingHours?.[0]?.closeTime || '22:00',
    dealBadge: restStop.dealBadge || '',
    dealDescription: restStop.dealDescription || '',
  });

  const [selectedFacilities, setSelectedFacilities] = useState<Facility[]>(
    (restStop.facilities || []).filter((f): f is Facility => Boolean(f) && typeof f === 'string')
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleFacility = (facility: Facility) => {
    setSelectedFacilities((prev) =>
      prev.includes(facility) ? prev.filter((f) => f !== facility) : [...prev, facility]
    );
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (formData.name.trim().length < 3) {
      setError('Rest stop name must be at least 3 characters long.');
      return;
    }
    if (formData.description.trim().length < 10) {
      setError('Description must be at least 10 characters long.');
      return;
    }
    if (!formData.street.trim() || !formData.area.trim()) {
      setError('Street and area locality are required.');
      return;
    }
    if (!/^\d{6}$/.test(formData.pincode.trim())) {
      setError('Please provide a valid 6-digit pincode.');
      return;
    }
    if (selectedFacilities.length === 0) {
      setError('Please select at least one facility amenity.');
      return;
    }

    const maxRidersNum = parseInt(formData.maxRiders, 10);
    if (isNaN(maxRidersNum) || maxRidersNum < 1) {
      setError('Capacity must be at least 1 rider.');
      return;
    }

    setIsSubmitting(true);
    try {
      const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
      const operatingHours = days.map((day) => ({
        day,
        openTime: formData.openTime,
        closeTime: formData.closeTime,
        isOpen: true,
      }));

      const payload: UpdateRestStopRequest = {
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
        facilities: selectedFacilities,
        capacity: {
          maxRiders: maxRidersNum,
          status: formData.capacityStatus,
        },
        operatingHours,
        ...(formData.dealBadge.trim() && { dealBadge: formData.dealBadge.trim() }),
        ...(formData.dealDescription.trim() && { dealDescription: formData.dealDescription.trim() }),
      };

      const updated = await updateMerchantRestStop(restStop.id, payload);
      onUpdated(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update rest stop. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const allFacilities = [
    { id: Facility.DRINKING_WATER, label: 'Drinking Water' },
    { id: Facility.SEATING, label: 'Seating Area' },
    { id: Facility.CHARGING, label: 'Phone Charging' },
    { id: Facility.RESTROOM, label: 'Clean Washroom' },
    { id: Facility.WIFI, label: 'Free Wi-Fi' },
    { id: Facility.PARKING, label: 'Safe Bike Parking' },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-pitstop-charcoal/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-rest-stop-modal-title"
    >
      <Card className="w-full max-w-2xl bg-white shadow-lift border border-pitstop-border overflow-hidden my-0 sm:my-8 rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-pitstop-border flex items-center justify-between bg-pitstop-bg shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-pitstop-yellow text-pitstop-charcoal">
              <Building2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="edit-rest-stop-modal-title" className="text-base font-bold text-pitstop-charcoal">
                Edit Rest Stop Details
              </h2>
              <p className="text-xs text-pitstop-muted">
                Update operational details, capacity, and amenities for {restStop.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-pitstop-muted hover:text-pitstop-charcoal hover:bg-white transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-red-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-pitstop-muted">
              General Information
            </h3>
            <Input
              label="Rest Stop Name *"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g. Chai Point Indiranagar Hub"
              required
            />
            <div>
              <label className="block text-xs font-semibold text-pitstop-charcoal mb-1.5">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-pitstop-border bg-white px-3 py-2 text-sm text-pitstop-charcoal placeholder:text-pitstop-muted/60 focus:border-pitstop-yellow focus:outline-hidden focus:ring-2 focus:ring-pitstop-yellow/20"
                placeholder="Describe facilities, welcome instructions, and perks for resting gig workers..."
                required
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4 border-t border-pitstop-border pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-pitstop-muted">
              Address & Location
            </h3>
            <Input
              label="Street Address *"
              value={formData.street}
              onChange={(e) => handleInputChange('street', e.target.value)}
              placeholder="e.g. #45, 100 Feet Road"
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Area / Locality *"
                value={formData.area}
                onChange={(e) => handleInputChange('area', e.target.value)}
                placeholder="e.g. Indiranagar"
                required
              />
              <Input
                label="Landmark (Optional)"
                value={formData.landmark}
                onChange={(e) => handleInputChange('landmark', e.target.value)}
                placeholder="e.g. Near Metro Station"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="City *"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                required
              />
              <Input
                label="State *"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                required
              />
              <Input
                label="Pincode *"
                value={formData.pincode}
                onChange={(e) => handleInputChange('pincode', e.target.value)}
                maxLength={6}
                required
              />
            </div>
          </div>

          {/* Amenities & Facilities */}
          <div className="space-y-3 border-t border-pitstop-border pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-pitstop-muted">
              Amenities Provided *
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {allFacilities.map((f) => {
                const isSelected = selectedFacilities.includes(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleFacility(f.id)}
                    className={`p-3 rounded-xl border text-xs font-medium text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-pitstop-yellow bg-pitstop-yellow/10 text-pitstop-charcoal font-semibold shadow-subtle'
                        : 'border-pitstop-border bg-white text-pitstop-muted hover:border-pitstop-border/80'
                    }`}
                  >
                    <span>{f.label}</span>
                    <span className={`h-4 w-4 rounded-full border flex items-center justify-center text-[10px] ${
                      isSelected
                        ? 'border-pitstop-yellow-dark bg-pitstop-yellow text-pitstop-charcoal'
                        : 'border-pitstop-border'
                    }`}>
                      {isSelected ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Capacity & Operating Hours */}
          <div className="space-y-4 border-t border-pitstop-border pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-pitstop-muted">
              Capacity & Operating Hours
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Maximum Seating Capacity *"
                type="number"
                min="1"
                max="100"
                value={formData.maxRiders}
                onChange={(e) => handleInputChange('maxRiders', e.target.value)}
                required
              />
              <Select
                label="Current Occupancy Status *"
                value={formData.capacityStatus}
                onChange={(e) => handleInputChange('capacityStatus', e.target.value)}
                options={[
                  { value: CapacityStatus.AVAILABLE, label: 'Available (Plenty of seats)' },
                  { value: CapacityStatus.BUSY, label: 'Busy (Limited seating)' },
                  { value: CapacityStatus.FULL, label: 'Full (Capacity reached)' },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Daily Opening Time"
                type="time"
                value={formData.openTime}
                onChange={(e) => handleInputChange('openTime', e.target.value)}
                required
              />
              <Input
                label="Daily Closing Time"
                type="time"
                value={formData.closeTime}
                onChange={(e) => handleInputChange('closeTime', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Deal Perks */}
          <div className="space-y-4 border-t border-pitstop-border pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-pitstop-muted">
              Rider Deal Perks (Optional)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Deal Badge Text"
                value={formData.dealBadge}
                onChange={(e) => handleInputChange('dealBadge', e.target.value)}
                placeholder="e.g. Free Chai with Samosa"
              />
              <Input
                label="Deal Description"
                value={formData.dealDescription}
                onChange={(e) => handleInputChange('dealDescription', e.target.value)}
                placeholder="e.g. 15% off on all beverages for delivery riders"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="border-t border-pitstop-border pt-4 flex items-center justify-end gap-3">
            <Button variant="ghost" size="md" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
