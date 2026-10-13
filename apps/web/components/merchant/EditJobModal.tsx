'use client';

import React, { useState } from 'react';
import { 
  X, 
  Briefcase, 
  IndianRupee, 
  Clock, 
  Calendar, 
  Users, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { Card, Button, Input, Select } from '@/components/ui';
import { 
  JobCategory, 
  JobStatus, 
  JobMerchantResponse, 
  UpdateJobRequest 
} from 'shared-types';
import { updateMerchantJob } from '@/lib/api/merchant-jobs';

interface EditJobModalProps {
  job: JobMerchantResponse;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updatedJob: JobMerchantResponse) => void;
}

export const EditJobModal: React.FC<EditJobModalProps> = ({
  job,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const toLocalISO = (isoStr?: string) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return '';
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  };

  const [formData, setFormData] = useState({
    title: job.title || '',
    description: job.description || '',
    category: job.category || JobCategory.PARCEL_SORTING,
    payAmount: String(job.payAmount ?? '250'),
    payType: (job.payType || 'fixed') as 'fixed' | 'hourly',
    durationMinutes: String(job.durationMinutes ?? '60'),
    startTime: toLocalISO(job.startTime),
    endTime: toLocalISO(job.endTime),
    requiredRiders: String(job.requiredRiders ?? '1'),
    instructions: job.instructions || '',
    status: (job.status === JobStatus.CANCELLED ? JobStatus.CANCELLED : JobStatus.OPEN) as JobStatus.OPEN | JobStatus.CANCELLED,
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
    } else if (job.acceptedRidersCount && riders < job.acceptedRidersCount) {
      errs.requiredRiders = `Cannot reduce required riders below already accepted count (${job.acceptedRidersCount}).`;
    }

    if (!formData.instructions.trim() || formData.instructions.trim().length < 5) {
      errs.instructions = 'Instructions must be at least 5 characters.';
    }

    if (formData.startTime && formData.endTime && new Date(formData.endTime) <= new Date(formData.startTime)) {
      errs.endTime = 'End time must be after start time.';
    }

    if (formData.status === JobStatus.OPEN && formData.endTime && new Date(formData.endTime) <= new Date()) {
      errs.endTime = 'Cannot open or reopen a job whose end time is in the past.';
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
      const payload: UpdateJobRequest = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        payAmount: Number(formData.payAmount),
        payType: formData.payType,
        durationMinutes: Math.round(Number(formData.durationMinutes)),
        startTime: formData.startTime ? new Date(formData.startTime) : undefined,
        endTime: formData.endTime ? new Date(formData.endTime) : undefined,
        requiredRiders: Math.round(Number(formData.requiredRiders)),
        instructions: formData.instructions.trim(),
        status: formData.status,
      };

      const updated = await updateMerchantJob(job.id, payload);
      onUpdated(updated);
      onClose();
    } catch (err: any) {
      setServerError(err.message || 'Failed to update micro-job details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-job-modal-title"
    >
      <Card className="w-full max-w-2xl bg-white p-6 sm:p-8 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-pitstop-border pb-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-pitstop-yellow/20 text-pitstop-charcoal">
              <Briefcase className="h-5 w-5 text-pitstop-yellow-dark" />
            </div>
            <div>
              <h2 id="edit-job-modal-title" className="text-xl font-bold text-pitstop-charcoal">
                Edit Micro-Job
              </h2>
              <p className="text-xs text-pitstop-muted">
                Update parameters, requirements, or operational status for this task.
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
              <p className="font-semibold">Update failed</p>
              <p className="text-xs mt-0.5">{serverError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Status selection */}
          <div className="p-4 rounded-lg bg-pitstop-card border border-pitstop-border">
            <label className="block text-sm font-semibold text-pitstop-charcoal mb-2">
              Operational Status
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="status"
                  value={JobStatus.OPEN}
                  checked={formData.status === JobStatus.OPEN}
                  onChange={() => handleInputChange('status', JobStatus.OPEN)}
                  className="accent-pitstop-yellow-dark"
                />
                <span className="font-medium text-pitstop-charcoal">Open (Accepting Applicants)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="status"
                  value={JobStatus.CANCELLED}
                  checked={formData.status === JobStatus.CANCELLED}
                  onChange={() => handleInputChange('status', JobStatus.CANCELLED)}
                  className="accent-red-600"
                />
                <span className="font-medium text-red-700">Cancelled / Closed</span>
              </label>
            </div>
            <p className="text-xs text-pitstop-muted mt-2">
              Current accepted riders: {job.acceptedRidersCount} / {job.requiredRiders}. If cancelled, pending applications can no longer be accepted.
            </p>
          </div>

          {/* Title */}
          <Input
            id="edit-job-title"
            label="Job Title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            error={errors.title}
            helperText="Clear, concise title for riders (5 - 150 characters)."
            required
          />

          {/* Description */}
          <div>
            <label htmlFor="edit-job-desc" className="block text-sm font-medium text-pitstop-charcoal mb-1">
              Job Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="edit-job-desc"
              rows={3}
              className="w-full rounded-lg border border-pitstop-border px-3.5 py-2.5 text-sm text-pitstop-charcoal placeholder-pitstop-muted/60 focus:border-pitstop-yellow focus:outline-none focus:ring-2 focus:ring-pitstop-yellow/30"
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
              id="edit-job-category"
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
              id="edit-job-riders"
              type="number"
              min="1"
              max="20"
              label="Required Riders"
              value={formData.requiredRiders}
              onChange={(e) => handleInputChange('requiredRiders', e.target.value)}
              error={errors.requiredRiders}
              helperText={`Capacity target (currently ${job.acceptedRidersCount} accepted).`}
              required
            />
          </div>

          {/* Pay Amount, Pay Type & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              id="edit-job-pay-amount"
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
              id="edit-job-pay-type"
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
              id="edit-job-duration"
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
              id="edit-job-start-time"
              type="datetime-local"
              label="Scheduled Start Time"
              value={formData.startTime}
              onChange={(e) => handleInputChange('startTime', e.target.value)}
              error={errors.startTime}
            />

            <Input
              id="edit-job-end-time"
              type="datetime-local"
              label="Scheduled End Time"
              value={formData.endTime}
              onChange={(e) => handleInputChange('endTime', e.target.value)}
              error={errors.endTime}
            />
          </div>

          {/* Instructions */}
          <div>
            <label htmlFor="edit-job-instructions" className="block text-sm font-medium text-pitstop-charcoal mb-1">
              Rider Instructions <span className="text-red-500">*</span>
            </label>
            <textarea
              id="edit-job-instructions"
              rows={2}
              className="w-full rounded-lg border border-pitstop-border px-3.5 py-2.5 text-sm text-pitstop-charcoal placeholder-pitstop-muted/60 focus:border-pitstop-yellow focus:outline-none focus:ring-2 focus:ring-pitstop-yellow/30"
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
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
