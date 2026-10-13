'use client';

import React, { useState } from 'react';
import { 
  X, 
  Tag, 
  Building2, 
  Percent, 
  IndianRupee, 
  Gift, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { Card, Button, Input, Select } from '@/components/ui';
import { 
  DealDiscountType, 
  RestStopMerchantResponse, 
  CreateDealRequest,
  DealMerchantResponse,
  RestStopStatus 
} from 'shared-types';
import { createMerchantDeal } from '@/lib/api/merchant-deals';

interface CreateDealModalProps {
  restStops: RestStopMerchantResponse[];
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newDeal: DealMerchantResponse) => void;
}

export const CreateDealModal: React.FC<CreateDealModalProps> = ({
  restStops,
  isOpen,
  onClose,
  onCreated,
}) => {
  // Only rest stops with status 'active' can have deals published
  const activeRestStops = restStops.filter((rs) => rs.status === RestStopStatus.ACTIVE);

  const [formData, setFormData] = useState({
    restStopId: activeRestStops[0]?.id || '',
    title: '',
    description: '',
    discountType: DealDiscountType.PERCENTAGE,
    discountPercentage: '20',
    flatDiscountAmount: '20',
    originalPrice: '50',
    dealPrice: '30',
    validHours: '14:00 – 17:00 (Off-peak)',
    terms: 'Valid once per verified rider check-in',
    validUntil: '',
    maxRedemptionsPerRider: '1',
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!formData.restStopId) {
      errs.restStopId = 'Please select an active rest stop venue.';
    }

    if (!formData.title.trim() || formData.title.trim().length < 5) {
      errs.title = 'Title must be at least 5 characters.';
    } else if (formData.title.trim().length > 120) {
      errs.title = 'Title cannot exceed 120 characters.';
    }

    if (!formData.description.trim() || formData.description.trim().length < 10) {
      errs.description = 'Description must be at least 10 characters.';
    }

    if (formData.discountType === DealDiscountType.PERCENTAGE) {
      const pct = Number(formData.discountPercentage);
      if (isNaN(pct) || pct < 1 || pct > 100) {
        errs.discountPercentage = 'Percentage discount must be between 1% and 100%.';
      }
    } else if (formData.discountType === DealDiscountType.FIXED_PRICE) {
      const orig = Number(formData.originalPrice);
      const deal = Number(formData.dealPrice);
      if (isNaN(orig) || orig < 0) {
        errs.originalPrice = 'Original price cannot be negative.';
      }
      if (isNaN(deal) || deal < 0) {
        errs.dealPrice = 'Deal price cannot be negative.';
      }
    }

    if (formData.validUntil) {
      const untilDate = new Date(formData.validUntil);
      if (untilDate.getTime() < Date.now()) {
        errs.validUntil = 'End validity date cannot be in the past.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      const payload: CreateDealRequest = {
        restStopId: formData.restStopId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        discountType: formData.discountType,
        ...(formData.discountType === DealDiscountType.PERCENTAGE && {
          discountPercentage: Number(formData.discountPercentage),
        }),
        ...(formData.discountType === DealDiscountType.FIXED_PRICE && {
          flatDiscountAmount: Number(formData.flatDiscountAmount) || 0,
          originalPrice: Number(formData.originalPrice) || 0,
          dealPrice: Number(formData.dealPrice) || 0,
        }),
        ...(formData.validHours.trim() && { validHours: formData.validHours.trim() }),
        ...(formData.terms.trim() && { terms: formData.terms.trim() }),
        ...(formData.validUntil && { validUntil: new Date(formData.validUntil) }),
        isActive: formData.isActive,
        maxRedemptionsPerRider: Number(formData.maxRedemptionsPerRider) || 1,
      };

      const created = await createMerchantDeal(payload);
      onCreated(created);
      onClose();
    } catch (err: any) {
      setServerError(err.message || 'Failed to create promotional deal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-pitstop-charcoal/60 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden bg-white shadow-2xl rounded-2xl border-pitstop-border">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-pitstop-border px-6 py-4 bg-pitstop-bg">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pitstop-yellow text-pitstop-charcoal shadow-sm">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-pitstop-charcoal">Create Promotional Deal</h2>
              <p className="text-xs text-pitstop-muted">Offer exclusive discounts to gig delivery riders</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-pitstop-muted hover:bg-pitstop-border/50 hover:text-pitstop-charcoal transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {serverError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <div>
                <strong className="block font-semibold">Deal Creation Failed</strong>
                {serverError}
              </div>
            </div>
          )}

          {activeRestStops.length === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                No Active Rest Stops Available
              </div>
              <p>
                Promotional deals can only be published for approved and active rest stop venues. 
                Your current venues are either pending administrative moderation or suspended.
              </p>
            </div>
          ) : (
            <>
              {/* Target Venue Selection */}
              <div>
                <label className="block text-xs font-semibold text-pitstop-charcoal mb-1.5">
                  Rest Stop Venue <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.restStopId}
                  onChange={(e) => handleInputChange('restStopId', e.target.value)}
                  options={activeRestStops.map((rs) => ({
                    value: rs.id,
                    label: `${rs.name} (${rs.address.area || rs.address.city})`,
                  }))}
                  error={errors.restStopId}
                />
                <p className="mt-1 text-[11px] text-pitstop-muted">
                  Only your approved, active rest stops are eligible for promotional deals.
                </p>
              </div>

              {/* Title & Description */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-pitstop-charcoal mb-1.5">
                    Deal Headline <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. 50% Off Hot Chai & Fresh Bun Maska"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    error={errors.title}
                    maxLength={120}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-pitstop-charcoal mb-1.5">
                    Description & Rider Terms <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe what is included, portion size, and any special conditions for delivery partners."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className={`w-full rounded-xl border ${
                      errors.description ? 'border-red-500' : 'border-pitstop-border'
                    } bg-white p-3 text-sm text-pitstop-charcoal placeholder:text-pitstop-muted focus:outline-none focus:ring-2 focus:ring-pitstop-yellow/50`}
                  />
                  {errors.description && (
                    <p className="mt-1 text-xs text-red-500">{errors.description}</p>
                  )}
                </div>
              </div>

              {/* Discount Structure */}
              <div className="rounded-xl border border-pitstop-border/80 bg-pitstop-bg/50 p-4 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-pitstop-charcoal/80">
                  Discount & Pricing
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { type: DealDiscountType.PERCENTAGE, label: 'Percentage Off', icon: Percent },
                    { type: DealDiscountType.FIXED_PRICE, label: 'Fixed Price / Flat', icon: IndianRupee },
                    { type: DealDiscountType.FREE_ITEM, label: 'Free Item', icon: Gift },
                  ].map(({ type, label, icon: Icon }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleInputChange('discountType', type)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                        formData.discountType === type
                          ? 'border-pitstop-yellow-dark bg-pitstop-yellow/20 text-pitstop-charcoal font-bold shadow-xs'
                          : 'border-pitstop-border bg-white text-pitstop-muted hover:border-pitstop-border-dark'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-pitstop-yellow-dark" />
                      {label}
                    </button>
                  ))}
                </div>

                {formData.discountType === DealDiscountType.PERCENTAGE && (
                  <div>
                    <label className="block text-xs font-semibold text-pitstop-charcoal mb-1">
                      Discount Percentage (%) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={formData.discountPercentage}
                      onChange={(e) => handleInputChange('discountPercentage', e.target.value)}
                      error={errors.discountPercentage}
                      placeholder="e.g. 25"
                    />
                  </div>
                )}

                {formData.discountType === DealDiscountType.FIXED_PRICE && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-pitstop-charcoal mb-1">
                        Original Price (₹)
                      </label>
                      <Input
                        type="number"
                        min={0}
                        value={formData.originalPrice}
                        onChange={(e) => handleInputChange('originalPrice', e.target.value)}
                        error={errors.originalPrice}
                        placeholder="e.g. 60"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-pitstop-charcoal mb-1">
                        Deal Price for Riders (₹)
                      </label>
                      <Input
                        type="number"
                        min={0}
                        value={formData.dealPrice}
                        onChange={(e) => handleInputChange('dealPrice', e.target.value)}
                        error={errors.dealPrice}
                        placeholder="e.g. 35"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Timing & Redemption Rules */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-pitstop-charcoal mb-1.5">
                    Valid Hours
                  </label>
                  <Input
                    placeholder="e.g. 14:00 - 18:00 (Off-peak)"
                    value={formData.validHours}
                    onChange={(e) => handleInputChange('validHours', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-pitstop-charcoal mb-1.5">
                    End Validity Date (Optional)
                  </label>
                  <Input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => handleInputChange('validUntil', e.target.value)}
                    error={errors.validUntil}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-pitstop-charcoal mb-1.5">
                    Terms & Fine Print
                  </label>
                  <Input
                    placeholder="e.g. 1 redemption per rider per day"
                    value={formData.terms}
                    onChange={(e) => handleInputChange('terms', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-pitstop-charcoal mb-1.5">
                    Initial Status
                  </label>
                  <Select
                    value={formData.isActive ? 'active' : 'inactive'}
                    onChange={(e) => handleInputChange('isActive', e.target.value === 'active')}
                    options={[
                      { value: 'active', label: 'Active (Visible to verified riders)' },
                      { value: 'inactive', label: 'Paused / Inactive' },
                    ]}
                  />
                </div>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="pt-4 border-t border-pitstop-border flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting || activeRestStops.length === 0}
              className="font-bold"
            >
              {isSubmitting ? 'Creating Deal...' : 'Publish Promotional Deal'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
