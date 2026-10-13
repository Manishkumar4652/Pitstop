'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  X, 
  MapPin, 
  Clock, 
  IndianRupee, 
  Users, 
  Briefcase, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck,
  Bike,
  LogIn
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import { JobPublicResponse, JobCategory } from 'shared-types';
import { useAuth } from '@/lib/auth/AuthContext';
import { applyToJob } from '@/lib/api/jobs';
import { sanitizeReturnUrl } from '@/lib/auth/return-url';

interface JobDetailModalProps {
  job: JobPublicResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onApplicationSubmitted?: (job: JobPublicResponse) => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  isOpen,
  onClose,
  onApplicationSubmitted,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [notes, setNotes] = useState('');
  const [notesError, setNotesError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !job) return null;

  const isRider = isAuthenticated && user?.role === 'rider';
  const remainingSlots = Math.max(0, job.requiredRiders - job.acceptedRidersCount);
  const isFull = remainingSlots === 0;

  const formatCategory = (cat: JobCategory) => {
    switch (cat) {
      case JobCategory.PARCEL_SORTING:
        return 'Parcel Sorting & Dispatch';
      case JobCategory.LOADING_UNLOADING:
        return 'Loading & Unloading';
      case JobCategory.FLYER_DISTRIBUTION:
        return 'Flyer Distribution';
      case JobCategory.CLEANING_PREP:
        return 'Cleaning & Prep Support';
      case JobCategory.STORE_ASSISTANT:
        return 'Store Counter Assistant';
      case JobCategory.OTHER:
        return 'General Task';
    }
  };

  const formatSchedule = (startIso: string, endIso: string) => {
    try {
      const s = new Date(startIso);
      const e = new Date(endIso);
      if (isNaN(s.getTime()) || isNaN(e.getTime())) return '';
      const dateOpts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
      const timeOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
      return `${s.toLocaleDateString('en-IN', dateOpts)} • ${s.toLocaleTimeString('en-IN', timeOpts)} to ${e.toLocaleTimeString('en-IN', timeOpts)}`;
    } catch {
      return '';
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setConflictError(null);
    setNotesError(null);

    if (notes.trim().length > 200) {
      setNotesError('Notes cannot exceed 200 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await applyToJob(job.id, {
        notes: notes.trim() || undefined,
      });

      setIsSuccess(true);
      if (onApplicationSubmitted) {
        onApplicationSubmitted(job);
      }
    } catch (err: any) {
      if (err.status === 409) {
        setConflictError(
          err.message || 'You have already applied for this micro-job, or the job has reached full capacity.'
        );
      } else {
        setServerError(err.message || 'Failed to submit application. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const returnUrl = sanitizeReturnUrl(`/jobs?jobId=${job.id}`, '/jobs');

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="job-detail-title"
    >
      <Card className="w-full max-w-2xl bg-white p-6 sm:p-8 shadow-xl max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-pitstop-border pb-4 mb-5">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-pitstop-yellow/20 text-pitstop-charcoal shrink-0 mt-0.5">
              <Briefcase className="h-6 w-6 text-pitstop-yellow-dark" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-pitstop-bg border border-pitstop-border text-pitstop-charcoal">
                  {formatCategory(job.category)}
                </span>
                <Badge variant={isFull ? 'warning' : 'success'} size="sm">
                  {isFull ? 'Capacity Full' : 'Open for Applications'}
                </Badge>
              </div>
              <h2 id="job-detail-title" className="text-xl sm:text-2xl font-bold text-pitstop-charcoal">
                {job.title}
              </h2>
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

        {/* Core Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 p-4 rounded-xl bg-pitstop-bg/60 border border-pitstop-border/80">
          <div>
            <span className="text-[11px] text-pitstop-muted block">Payout</span>
            <span className="text-lg font-bold text-pitstop-charcoal flex items-center gap-0.5 mt-0.5">
              <IndianRupee className="h-4 w-4 text-pitstop-yellow-dark" />
              <span>{job.payAmount}</span>
            </span>
            <span className="text-[10px] text-pitstop-muted capitalize block">
              {job.payType === 'hourly' ? 'Per hour rate' : 'Fixed payout'}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-pitstop-muted block">Duration</span>
            <span className="text-base font-bold text-pitstop-charcoal flex items-center gap-1 mt-0.5">
              <Clock className="h-4 w-4 text-pitstop-muted" />
              <span>{job.durationMinutes}m</span>
            </span>
            <span className="text-[10px] text-pitstop-muted block">Task length</span>
          </div>

          <div>
            <span className="text-[11px] text-pitstop-muted block">Available Slots</span>
            <span className="text-base font-bold text-pitstop-charcoal flex items-center gap-1 mt-0.5">
              <Users className="h-4 w-4 text-pitstop-muted" />
              <span className={isFull ? 'text-red-600' : 'text-emerald-700'}>
                {remainingSlots} open
              </span>
            </span>
            <span className="text-[10px] text-pitstop-muted block">
              {job.acceptedRidersCount}/{job.requiredRiders} filled
            </span>
          </div>

          <div>
            <span className="text-[11px] text-pitstop-muted block">Venue Location</span>
            <span className="text-sm font-bold text-pitstop-charcoal flex items-center gap-1 mt-0.5 truncate">
              <MapPin className="h-4 w-4 text-pitstop-yellow-dark shrink-0" />
              <span className="truncate">{job.restStopName || 'Rest Stop'}</span>
            </span>
            <span className="text-[10px] text-pitstop-muted block">Partner venue</span>
          </div>
        </div>

        {/* Schedule & Timing */}
        <div className="mb-5 space-y-1">
          <span className="text-xs font-semibold text-pitstop-muted uppercase tracking-wider block">
            Scheduled Shift Window
          </span>
          <p className="text-sm text-pitstop-charcoal font-medium bg-white p-3 rounded-lg border border-pitstop-border flex items-center gap-2">
            <Clock className="h-4 w-4 text-pitstop-yellow-dark shrink-0" />
            <span>{formatSchedule(job.startTime, job.endTime)}</span>
          </p>
        </div>

        {/* Task Description */}
        <div className="mb-5 space-y-1">
          <span className="text-xs font-semibold text-pitstop-muted uppercase tracking-wider block">
            Task Description
          </span>
          <p className="text-sm text-pitstop-charcoal/90 leading-relaxed bg-white p-3.5 rounded-lg border border-pitstop-border">
            {job.description}
          </p>
        </div>

        {/* Instructions */}
        {job.instructions && (
          <div className="mb-6 space-y-1">
            <span className="text-xs font-semibold text-pitstop-muted uppercase tracking-wider block">
              Merchant Reporting Instructions
            </span>
            <div className="text-xs sm:text-sm text-pitstop-charcoal bg-amber-50/60 p-3.5 rounded-lg border border-amber-200/80">
              {job.instructions}
            </div>
          </div>
        )}

        {/* Application Section */}
        <div className="mt-auto pt-5 border-t border-pitstop-border">
          {isSuccess ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-900">Application Submitted!</h3>
                <p className="text-xs text-emerald-700 mt-1 max-w-md mx-auto">
                  Your application has been received by the merchant. You can track status updates in your rider portal.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Link href="/rider/applications">
                  <Button variant="primary" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                    View My Applications
                  </Button>
                </Link>
                <Button variant="secondary" size="sm" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          ) : !isAuthenticated ? (
            /* Guest Browsing — Call to Action */
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-pitstop-charcoal flex items-center gap-1.5">
                  <Bike className="h-4 w-4 text-pitstop-yellow-dark" />
                  Ready to apply for this micro-task?
                </h4>
                <p className="text-xs text-pitstop-muted mt-0.5">
                  Log in or register with your delivery partner account to apply.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <Link href={`/rider/login?returnUrl=${encodeURIComponent(returnUrl)}`} className="flex-1 sm:flex-initial">
                  <Button variant="primary" size="sm" fullWidth leftIcon={<LogIn className="h-3.5 w-3.5" />}>
                    Log In to Apply
                  </Button>
                </Link>
                <Link href={`/rider/register?returnUrl=${encodeURIComponent(returnUrl)}`} className="flex-1 sm:flex-initial">
                  <Button variant="outline" size="sm" fullWidth>
                    Register
                  </Button>
                </Link>
              </div>
            </div>
          ) : !isRider ? (
            /* Merchant or Admin Browsing */
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>
                You are currently logged in as a <strong>{user?.role}</strong>. Applications are reserved exclusively for verified gig delivery partners.
              </span>
            </div>
          ) : isFull ? (
            /* Job Full */
            <div className="rounded-xl bg-slate-100 border border-slate-200 p-4 text-center">
              <p className="text-sm font-semibold text-slate-700">All Requested Slots Are Filled</p>
              <p className="text-xs text-slate-500 mt-0.5">
                This job has reached full capacity. Check other active postings nearby.
              </p>
            </div>
          ) : (
            /* Logged-in Rider Apply Form */
            <form onSubmit={handleApply} className="space-y-4">
              {conflictError && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-900 flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Notice</p>
                      <p className="text-xs mt-0.5">{conflictError}</p>
                    </div>
                  </div>
                  <Link href="/rider/applications" className="shrink-0 text-amber-900 underline font-semibold text-xs mt-0.5">
                    View Applications
                  </Link>
                </div>
              )}

              {serverError && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-800 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                  <span>{serverError}</span>
                </div>
              )}

              <div>
                <label htmlFor="rider-job-notes" className="block text-xs font-medium text-pitstop-charcoal mb-1">
                  Optional Note for Merchant (e.g. arrival time, vehicle, experience)
                </label>
                <textarea
                  id="rider-job-notes"
                  rows={2}
                  maxLength={200}
                  placeholder="e.g. Nearby at 100ft road, can arrive in 5 minutes with motorcycle."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-pitstop-border px-3 py-2 text-xs text-pitstop-charcoal placeholder:text-pitstop-muted/60 focus:border-pitstop-yellow focus:outline-none focus:ring-2 focus:ring-pitstop-yellow/30"
                />
                <div className="flex items-center justify-between text-[11px] text-pitstop-muted mt-1">
                  {notesError ? (
                    <span className="text-red-600">{notesError}</span>
                  ) : (
                    <span>Max 200 characters</span>
                  )}
                  <span>{notes.length}/200</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
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
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                  leftIcon={<CheckCircle2 className="h-4 w-4" />}
                >
                  Apply for Job
                </Button>
              </div>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
};
