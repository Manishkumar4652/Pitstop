'use client';

import React, { useState } from 'react';
import { 
  X, 
  Briefcase, 
  Building2, 
  IndianRupee, 
  Clock, 
  Calendar, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { Card, Button, Input, Select } from '@/components/ui';
import { 
  JobCategory, 
  RestStopMerchantResponse, 
  CreateJobRequest,
  JobMerchantResponse,
  RestStopStatus 
} from 'shared-types';
import { createMerchantJob } from '@/lib/api/merchant-jobs';

interface CreateJobModalProps {
  restStops: RestStopMerchantResponse[];
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newJob: JobMerchantResponse) => void;
}

export const CreateJobModal: React.FC<CreateJobModalProps> = ({
  restStops,
  isOpen,
  onClose,
  onCreated,
}) => {
  // Only rest stops with status 'active' can have jobs published
  const activeRestStops = restStops.filter((rs) => rs.status === RestStopStatus.ACTIVE);

  // Helper to format default datetime-local values (start 1 hour from now, end 3 hours from now)
  const getDefaultDates = () => {
    const start = new Date(Date.now() + 60 * 60 * 1000);
    const end = new Date(Date.now() + 3 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const toLocalISO = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    return {
      startTime: toLocalISO(start),
      endTime: toLocalISO(end),
    };
  };

  const [formData, setFormData] = useState(() => {
    const dates = getDefaultDates();
    return {
      restStopId: activeRestStops[0]?.id || '',
      title: '',
      description: '',
      category: JobCategory.PARCEL_SORTING,
      payAmount: '250',
      payType: 'fixed' as 'fixed' | 'hourly',
      durationMinutes: '60',
      startTime: dates.startTime,
      endTime: dates.endTime,
      requiredRiders: '1',
      instructions: '',
    };
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
    } else if (formData.title.trim().length > 150) {
      errs.title = 'Title cannot exceed 150 characters.';
    }

    if (!formData.description.trim() || formData.description.trim().length < 15) {
      errs.description = 'Description must be at least 15 characters.';
    }

    const pay = Number(formData.payAmount);
    if (!formData.payAmount || isNaN(pay) || pay < 1) {
      errs.payAmount = 'Pay amount must be at least ₹1.';
    }

    const duration = Number(formData.durationMinutes);
    if (!formData.durationMinutes || isNaN(duration) || duration < 15) {
      errs.durationMinutes = 'Duration must be at least 15 minutes.';
    }

    const riders = Number(formData.requiredRiders);
    if (!formData.requiredRiders || isNaN(riders) || riders < 1) {
      errs.requiredRiders = 'At least 1 rider must be requested.';
    }

    if (!formData.instructions.trim() || formData.instructions.trim().length < 5) {
      errs.instructions = 'Instructions must be at least 5 characters.';
    }

    if (!formData.startTime) {
      errs.startTime = 'Start time is required.';
    }

    if (!formData.endTime) {
      errs.endTime = 'End time is required.';
    } else if (formData.startTime && new Date(formData.endTime) <= new Date(formData.startTime)) {
      errs.endTime = 'End time must be after start time.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload: CreateJobRequest = {
        restStopId: formData.restStopId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        payAmount: Number(formData.payAmount),
        payType: formData.payType,
        durationMinutes: Math.round(Number(formData.durationMinutes)),
        startTime: new Date(formData.startTime),
        endTime: new Date(formData.endTime),
        requiredRiders: Math.round(Number(formData.requiredRiders)),
        instructions: formData.instructions.trim(),
      };

      const created = await createMerchantJob(payload);
      onCreated(created);
      onClose();
    } catch (err: any) {
      setServerError(err.message || 'Failed to create micro-job. Please check fields and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-job-modal-title"
    >
      <Card className="w-full max-w-2xl bg-white p-5 sm:p-8 rounded-t-3xl sm:rounded-2xl shadow-xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-pitstop-border pb-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-pitstop-yellow/20 text-pitstop-charcoal">
              <Briefcase className="h-5 w-5 text-pitstop-yellow-dark" />
            </div>
            <div>
              <h2 id="create-job-modal-title" className="text-xl font-bold text-pitstop-charcoal">
                Post Micro-Job
              </h2>
              <p className="text-xs text-pitstop-muted">
                Publish on-demand task for gig riders at your rest stop venue.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-pitstop-muted hover:text-pitstop-charcoal hover:bg-pitstop-border/40 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {serverError && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800 flex items-start gap-2" role="alert">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Failed to publish micro-job</p>
              <p className="text-xs mt-0.5">{serverError}</p>
            </div>
          </div>
        )}

        {activeRestStops.length === 0 ? (
          <div className="text-center py-8 space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-pitstop-charcoal">No Active Rest Stops Available</h3>
              <p className="text-sm text-pitstop-muted mt-1 max-w-md mx-auto">
                Jobs can only be published for active rest stops owned by your merchant account. Please ensure you have an active rest stop before posting micro-jobs.
              </p>
            </div>
            <div className="pt-2">
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* Rest Stop Venue */}
            <Select
              id="create-job-venue"
              label="Rest Stop Venue"
              value={formData.restStopId}
              onChange={(e) => handleInputChange('restStopId', e.target.value)}
              options={activeRestStops.map((rs) => ({
                value: rs.id,
                label: `${rs.name} (${rs.address?.area || 'Active Venue'})`,
              }))}
              error={errors.restStopId}
              helperText="Only verified active rest stops can host micro-jobs."
              required
            />

            {/* Title */}
            <Input
              id="create-job-title"
              label="Job Title"
              placeholder="e.g. Parcel sorting and shelf stacking support"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              error={errors.title}
              helperText="Clear, concise title for riders (5 - 150 characters)."
              required
            />

            {/* Description */}
            <div>
              <label htmlFor="create-job-desc" className="block text-sm font-medium text-pitstop-charcoal mb-1">
                Job Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="create-job-desc"
                rows={3}
                className="w-full rounded-lg border border-pitstop-border px-3.5 py-2.5 text-sm text-pitstop-charcoal placeholder-pitstop-muted/60 focus:border-pitstop-yellow focus:outline-none focus:ring-2 focus:ring-pitstop-yellow/30"
                placeholder="Explain what the rider will be doing, expectations, and any safety guidelines..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
              {errors.description && (
                <p className="text-xs text-red-600 mt-1">{errors.description}</p>
              )}
            </div>

            {/* Category & Required Riders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                id="create-job-category"
                label="Job Category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                options={[
                  { value: JobCategory.PARCEL_SORTING, label: 'Parcel Sorting & Dispatch' },
                  { value: JobCategory.LOADING_UNLOADING, label: 'Loading & Unloading' },
                  { value: JobCategory.FLYER_DISTRIBUTION, label: 'Flyer Distribution' },
                  { value: JobCategory.CLEANING_PREP, label: 'Cleaning & Prep Support' },
                  { value: JobCategory.STORE_ASSISTANT, label: 'Store Assistant' },
                  { value: JobCategory.OTHER, label: 'Other General Task' },
                ]}
                required
              />

              <Input
                id="create-job-riders"
                type="number"
                min="1"
                max="20"
                label="Required Riders"
                value={formData.requiredRiders}
                onChange={(e) => handleInputChange('requiredRiders', e.target.value)}
                error={errors.requiredRiders}
                helperText="Capacity limit of riders needed."
                required
              />
            </div>

            {/* Pay Amount, Pay Type & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                id="create-job-pay-amount"
                type="number"
                min="1"
                label="Pay Amount (₹)"
                value={formData.payAmount}
                onChange={(e) => handleInputChange('payAmount', e.target.value)}
                error={errors.payAmount}
                leftIcon={<IndianRupee className="h-4 w-4 text-pitstop-muted" />}
                required
              />

              <Select
                id="create-job-pay-type"
                label="Pay Rate Type"
                value={formData.payType}
                onChange={(e) => handleInputChange('payType', e.target.value)}
                options={[
                  { value: 'fixed', label: 'Fixed Payout' },
                  { value: 'hourly', label: 'Per Hour' },
                ]}
                required
              />

              <Input
                id="create-job-duration"
                type="number"
                min="15"
                step="15"
                label="Duration (minutes)"
                value={formData.durationMinutes}
                onChange={(e) => handleInputChange('durationMinutes', e.target.value)}
                error={errors.durationMinutes}
                leftIcon={<Clock className="h-4 w-4 text-pitstop-muted" />}
                required
              />
            </div>

            {/* Schedule / Time Slots */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="create-job-start-time"
                type="datetime-local"
                label="Scheduled Start Time"
                value={formData.startTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
                error={errors.startTime}
                required
              />

              <Input
                id="create-job-end-time"
                type="datetime-local"
                label="Scheduled End Time"
                value={formData.endTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
                error={errors.endTime}
                required
              />
            </div>

            {/* Instructions */}
            <div>
              <label htmlFor="create-job-instructions" className="block text-sm font-medium text-pitstop-charcoal mb-1">
                Rider Instructions <span className="text-red-500">*</span>
              </label>
              <textarea
                id="create-job-instructions"
                rows={2}
                className="w-full rounded-lg border border-pitstop-border px-3.5 py-2.5 text-sm text-pitstop-charcoal placeholder-pitstop-muted/60 focus:border-pitstop-yellow focus:outline-none focus:ring-2 focus:ring-pitstop-yellow/30"
                placeholder="e.g. Report to Manager Ashok at counter 2. Wear closed-toe shoes and bring your smartphone."
                value={formData.instructions}
                onChange={(e) => handleInputChange('instructions', e.target.value)}
              />
              {errors.instructions && (
                <p className="text-xs text-red-600 mt-1">{errors.instructions}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-pitstop-border">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                disabled={isSubmitting}
                leftIcon={<CheckCircle2 className="h-4 w-4" />}
              >
                Publish Micro-Job
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};
