'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  Users, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Calendar, 
  Bike, 
  Briefcase, 
  IndianRupee, 
  RefreshCw,
  Info,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Card, Button, Badge, EmptyState, Select } from '@/components/ui';
import { 
  JobMerchantResponse, 
  JobApplicationResponse, 
  JobApplicationStatus 
} from 'shared-types';
import { 
  fetchMerchantJobApplicants, 
  updateMerchantApplicationStatus 
} from '@/lib/api/merchant-jobs';

interface JobApplicantsModalProps {
  job: JobMerchantResponse;
  isOpen: boolean;
  onClose: () => void;
  onJobMutated?: () => void;
}

export const JobApplicantsModal: React.FC<JobApplicantsModalProps> = ({
  job,
  isOpen,
  onClose,
  onJobMutated,
}) => {
  const [applicants, setApplicants] = useState<JobApplicationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Status Filter & Pagination
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalApplicants, setTotalApplicants] = useState(0);

  // Tracking inflight action per applicant id: { [applicantId]: 'accepting' | 'rejecting' }
  const [processingActionId, setProcessingActionId] = useState<string | null>(null);

  const loadApplicants = useCallback(async () => {
    if (!isOpen) return;
    setIsLoading(true);
    setError(null);
    setConflictWarning(null);

    try {
      const res = await fetchMerchantJobApplicants(job.id, {
        page,
        limit: 10,
        status: statusFilter,
        sort: 'newest',
      });
      setApplicants(res.items);
      setTotalPages(res.pagination.totalPages || 1);
      setTotalApplicants(res.pagination.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load applicants for this job.');
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, job.id, page, statusFilter]);

  useEffect(() => {
    if (isOpen) {
      loadApplicants();
    }
  }, [isOpen, loadApplicants]);

  if (!isOpen) return null;

  const handleStatusUpdate = async (applicationId: string, newStatus: JobApplicationStatus.ACCEPTED | JobApplicationStatus.REJECTED) => {
    if (processingActionId) return; // Prevent concurrent or repeated clicks
    setProcessingActionId(applicationId);
    setError(null);
    setConflictWarning(null);
    setActionSuccessMessage(null);

    try {
      const result = await updateMerchantApplicationStatus(applicationId, newStatus);
      
      setActionSuccessMessage(
        newStatus === JobApplicationStatus.ACCEPTED
          ? 'Application successfully accepted! Capacity updated.'
          : 'Application rejected.'
      );

      // Refresh applicant list and trigger parent job count refresh
      await loadApplicants();
      if (onJobMutated) {
        onJobMutated();
      }
    } catch (err: any) {
      if (err.status === 409) {
        setConflictWarning(
          err.message || 'The job may have reached full capacity or the application state has changed. Refreshed with latest data.'
        );
        // Refresh to get latest state from backend
        await loadApplicants();
        if (onJobMutated) {
          onJobMutated();
        }
      } else {
        setError(err.message || 'Failed to update application status. Please try again.');
      }
    } finally {
      setProcessingActionId(null);
    }
  };

  const getStatusBadge = (status: JobApplicationStatus) => {
    switch (status) {
      case JobApplicationStatus.PENDING:
        return <Badge variant="warning" size="sm">Pending Review</Badge>;
      case JobApplicationStatus.ACCEPTED:
        return <Badge variant="success" size="sm">Accepted</Badge>;
      case JobApplicationStatus.REJECTED:
        return <Badge variant="danger" size="sm">Rejected</Badge>;
      case JobApplicationStatus.WITHDRAWN:
        return <Badge variant="neutral" size="sm">Withdrawn</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Recently';
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="applicants-modal-title"
    >
      <Card className="w-full max-w-3xl bg-white p-6 sm:p-8 shadow-xl max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-pitstop-border pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-pitstop-yellow/20 text-pitstop-charcoal">
              <Users className="h-6 w-6 text-pitstop-yellow-dark" />
            </div>
            <div>
              <h2 id="applicants-modal-title" className="text-xl font-bold text-pitstop-charcoal">
                Job Applicants Review
              </h2>
              <p className="text-xs text-pitstop-muted mt-0.5">
                Review and select verified delivery riders who applied for this micro-task.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-pitstop-muted hover:text-pitstop-charcoal hover:bg-pitstop-border/40 transition-colors"
            aria-label="Close applicant modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Job Context Summary Bar */}
        <div className="mb-4 rounded-lg bg-pitstop-card border border-pitstop-border p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <div>
            <span className="font-semibold text-pitstop-charcoal block">{job.title}</span>
            <span className="text-pitstop-muted text-xs">
              Payout: ₹{job.payAmount} ({job.payType}) • Duration: {job.durationMinutes}m
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-pitstop-muted">Capacity Status:</span>
            <Badge 
              variant={job.acceptedRidersCount >= job.requiredRiders ? 'success' : 'warning'} 
              size="sm"
            >
              {job.acceptedRidersCount} of {job.requiredRiders} riders filled
            </Badge>
          </div>
        </div>

        {/* Conflict / Capacity Warning Banner */}
        {conflictWarning && (
          <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-3.5 text-xs sm:text-sm text-amber-900 flex items-start gap-2" role="alert">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Capacity or Status Conflict</p>
              <p className="text-xs mt-0.5">{conflictWarning}</p>
            </div>
          </div>
        )}

        {/* Success Feedback Banner */}
        {actionSuccessMessage && (
          <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs sm:text-sm text-emerald-800 flex items-center justify-between gap-2" role="status">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{actionSuccessMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-xs sm:text-sm text-red-800 flex items-center justify-between gap-2" role="alert">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
            <Button size="sm" variant="secondary" onClick={loadApplicants}>
              Retry
            </Button>
          </div>
        )}

        {/* Filter Controls & Refresh */}
        <div className="flex items-center justify-between gap-3 mb-4 pb-2 border-b border-pitstop-border">
          <div className="flex items-center gap-2">
            <label htmlFor="applicant-status-filter" className="text-xs font-medium text-pitstop-muted">
              Filter:
            </label>
            <select
              id="applicant-status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs rounded-lg border border-pitstop-border bg-white px-2.5 py-1.5 text-pitstop-charcoal focus:border-pitstop-yellow focus:outline-none"
            >
              <option value="all">All Applicants ({totalApplicants})</option>
              <option value={JobApplicationStatus.PENDING}>Pending Only</option>
              <option value={JobApplicationStatus.ACCEPTED}>Accepted Only</option>
              <option value={JobApplicationStatus.REJECTED}>Rejected Only</option>
              <option value={JobApplicationStatus.WITHDRAWN}>Withdrawn Only</option>
            </select>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={loadApplicants}
            disabled={isLoading}
            leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </div>

        {/* Applicant Content Area */}
        <div className="flex-1 overflow-y-auto min-h-[220px]">
          {isLoading && applicants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-pitstop-muted">
              <RefreshCw className="h-6 w-6 animate-spin mb-2" />
              <p className="text-sm">Loading applicants...</p>
            </div>
          ) : applicants.length === 0 ? (
            <EmptyState
              icon={<Users className="h-8 w-8 text-pitstop-muted" />}
              title="No Applicants Found"
              description={
                statusFilter === 'all'
                  ? 'No gig riders have applied for this micro-job yet. Applications will appear here as soon as riders apply.'
                  : `No applicants matching status "${statusFilter}".`
              }
            />
          ) : (
            <div className="space-y-3">
              {applicants.map((app) => {
                const isPending = app.status === JobApplicationStatus.PENDING;
                const isCurrentProcessing = processingActionId === app.id;
                const isCapacityFull = job.acceptedRidersCount >= job.requiredRiders;

                return (
                  <div
                    key={app.id}
                    className="p-4 rounded-xl border border-pitstop-border bg-white hover:border-pitstop-yellow/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {/* Applicant Information (Safe public DTO only) */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-semibold text-pitstop-charcoal text-sm">
                          {app.riderName || 'Anonymous Rider'}
                        </span>
                        {app.vehicleType && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                            <Bike className="h-3 w-3" />
                            {app.vehicleType}
                          </span>
                        )}
                        {getStatusBadge(app.status)}
                      </div>

                      {app.notes && (
                        <p className="text-xs text-pitstop-muted italic bg-slate-50 p-2 rounded border border-slate-100">
                          &ldquo;{app.notes}&rdquo;
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-pitstop-muted">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Applied {formatDate(app.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Actions: ONLY pending applications allow actions */}
                    {isPending ? (
                      <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-pitstop-border">
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleStatusUpdate(app.id, JobApplicationStatus.REJECTED)}
                          disabled={Boolean(processingActionId)}
                          isLoading={isCurrentProcessing}
                          leftIcon={<XCircle className="h-3.5 w-3.5" />}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleStatusUpdate(app.id, JobApplicationStatus.ACCEPTED)}
                          disabled={Boolean(processingActionId) || isCapacityFull}
                          isLoading={isCurrentProcessing}
                          leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                          title={isCapacityFull ? 'Job capacity reached' : 'Accept rider for this job'}
                        >
                          {isCapacityFull ? 'Capacity Full' : 'Accept Rider'}
                        </Button>
                      </div>
                    ) : (
                      <div className="text-xs text-pitstop-muted shrink-0 text-right">
                        <span>Decision finalized</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-pitstop-border text-xs text-pitstop-muted">
            <span>
              Page {page} of {totalPages} ({totalApplicants} total)
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isLoading}
                leftIcon={<ChevronLeft className="h-3.5 w-3.5" />}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isLoading}
                rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Modal Close Button */}
        <div className="flex justify-end pt-4 mt-2 border-t border-pitstop-border">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
};
