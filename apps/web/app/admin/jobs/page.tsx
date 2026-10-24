'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Briefcase, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldAlert, 
  IndianRupee, 
  Users, 
  MapPin, 
  Store, 
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { PublicLayout, AdminNav } from '@/components/layout';
import { 
  Container, 
  PageHeader, 
  Card, 
  Button, 
  Badge, 
  EmptyState 
} from '@/components/ui';
import { fetchAdminJobs, updateAdminJobStatus } from '@/lib/api/admin';
import { JobAdminResponse, PaginationMeta, JobStatus } from 'shared-types';

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<JobAdminResponse[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Moderation Action Modal
  const [activeModal, setActiveModal] = useState<{
    job: JobAdminResponse;
    targetStatus: 'open' | 'in_progress' | 'completed' | 'cancelled';
  } | null>(null);
  const [moderationReason, setModerationReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadJobs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchAdminJobs({
        page,
        limit: 10,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchQuery.trim() || undefined,
      });

      if (res.success && res.data) {
        setJobs(res.data.items);
        setPagination(res.data.pagination);
      } else {
        setError(res.message || 'Failed to retrieve jobs for moderation.');
      }
    } catch {
      setError('Network communication failure. Please verify connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, searchQuery]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleOpenModal = (
    job: JobAdminResponse,
    targetStatus: 'open' | 'in_progress' | 'completed' | 'cancelled'
  ) => {
    setActiveModal({ job, targetStatus });
    setModerationReason('');
  };

  const handleConfirmStatusChange = async () => {
    if (!activeModal) return;

    setIsSubmitting(true);
    try {
      const res = await updateAdminJobStatus(activeModal.job.id, {
        status: activeModal.targetStatus,
        reason: moderationReason.trim() || undefined,
      });

      if (res.success && res.data) {
        setFeedbackMessage(
          `Job "${activeModal.job.title}" status updated to "${activeModal.targetStatus}".`
        );
        setActiveModal(null);
        loadJobs();
      } else {
        setError(res.message || 'Failed to update job status.');
      }
    } catch {
      setError('Network error while saving job moderation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <AdminNav />

      <main id="main-content" className="pb-28 md:pb-12 bg-pitstop-bg min-h-[calc(100vh-64px)]">
        <PageHeader
          title="Micro-Jobs Supervision"
          description="Supervise hyper-local tasks posted by merchants across India, monitor fair wage guidelines, and cancel inappropriate job listings."
          badge="Listing Oversight"
          action={
            <Button
              variant="outline"
              size="md"
              onClick={loadJobs}
              isLoading={isLoading}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Refresh Jobs
            </Button>
          }
        />

        <section className="py-6 sm:py-8" aria-label="Micro-jobs management">
          <Container size="xl">
            {/* Feedback Notification */}
            {feedbackMessage && (
              <div 
                role="status" 
                className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{feedbackMessage}</span>
                </div>
                <button 
                  onClick={() => setFeedbackMessage(null)} 
                  className="text-emerald-600 hover:text-emerald-900"
                  aria-label="Dismiss feedback"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Error Notification */}
            {error && (
              <div 
                role="alert" 
                className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
                <Button variant="outline" size="sm" onClick={loadJobs}>
                  Retry
                </Button>
              </div>
            )}

            {/* Search and Filter */}
            <Card className="p-4 mb-6 shadow-subtle border-pitstop-border">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-pitstop-secondary" />
                  <input
                    type="text"
                    placeholder="Search by job title or description..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    className="w-full pl-9 pr-4 py-2 min-h-[44px] text-base sm:text-sm rounded-lg border border-pitstop-border focus:outline-none focus:ring-2 focus:ring-pitstop-yellow/40 focus:border-pitstop-yellow bg-white"
                  />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                  <Filter className="h-4 w-4 text-pitstop-secondary hidden sm:inline" />
                  <span className="text-xs font-semibold text-pitstop-secondary hidden sm:inline mr-1">Status:</span>
                  {[
                    { id: 'all', label: 'All Jobs' },
                    { id: JobStatus.OPEN, label: 'Open' },
                    { id: JobStatus.IN_PROGRESS, label: 'In Progress' },
                    { id: JobStatus.COMPLETED, label: 'Completed' },
                    { id: JobStatus.CANCELLED, label: 'Cancelled' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => {
                        setStatusFilter(filter.id);
                        setPage(1);
                      }}
                      className={`px-3 py-2 sm:py-1.5 min-h-[40px] sm:min-h-0 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                        statusFilter === filter.id
                          ? 'bg-pitstop-charcoal text-white'
                          : 'bg-gray-100 text-pitstop-charcoal hover:bg-gray-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Loading State */}
            {isLoading && (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <Card key={n} className="p-6 border-pitstop-border animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
                    <div className="h-4 bg-gray-100 rounded w-1/2 mb-4" />
                    <div className="h-10 bg-gray-100 rounded w-full" />
                  </Card>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && jobs.length === 0 && (
              <Card className="p-12 text-center border-pitstop-border shadow-subtle">
                <EmptyState
                  icon={<Briefcase className="w-8 h-8 text-gray-400" />}
                  title="No micro-jobs match your criteria"
                  description={
                    searchQuery || statusFilter !== 'all'
                      ? 'Try modifying your search query or changing the operational status filter.'
                      : 'There are currently no micro-jobs in the platform database.'
                  }
                  action={
                    (searchQuery || statusFilter !== 'all') ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('all');
                          setPage(1);
                        }}
                      >
                        Reset All Filters
                      </Button>
                    ) : undefined
                  }
                />
              </Card>
            )}

            {/* Jobs List */}
            {!isLoading && jobs.length > 0 && (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <Card
                    key={job.id}
                    className="p-5 sm:p-6 border-pitstop-border shadow-card hover:shadow-card-hover transition-shadow"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h2 className="text-lg font-bold text-pitstop-charcoal">
                            {job.title}
                          </h2>

                          {job.status === JobStatus.OPEN && (
                            <Badge variant="success">Open for Riders</Badge>
                          )}
                          {job.status === JobStatus.IN_PROGRESS && (
                            <Badge variant="warning">In Progress</Badge>
                          )}
                          {job.status === JobStatus.COMPLETED && (
                            <Badge variant="neutral">Completed</Badge>
                          )}
                          {job.status === JobStatus.CANCELLED && (
                            <Badge variant="danger">Cancelled</Badge>
                          )}

                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 capitalize">
                            {job.category.replace('_', ' ')}
                          </span>
                        </div>

                        <p className="text-xs text-pitstop-secondary line-clamp-2">
                          {job.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-pitstop-secondary">
                          <span className="flex items-center gap-1 font-semibold text-emerald-700">
                            <IndianRupee className="h-3.5 w-3.5" />
                            ₹{job.payAmount} ({job.payType})
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            {job.durationMinutes} mins
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-gray-400" />
                            Riders: {job.acceptedRidersCount}/{job.requiredRiders}
                          </span>
                          <span className="flex items-center gap-1">
                            <Store className="h-3.5 w-3.5 text-gray-400" />
                            Merchant ID: <code className="text-gray-600">{job.merchantId}</code>
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-gray-400" />
                            Venue: <code className="text-gray-600">{job.restStopId}</code>
                          </span>
                        </div>
                      </div>

                      {/* Moderation Actions */}
                      <div className="flex items-center gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-pitstop-border">
                        {job.status !== JobStatus.CANCELLED && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenModal(job, 'cancelled')}
                            leftIcon={<ShieldAlert className="h-3.5 w-3.5" />}
                            className="text-red-600 hover:bg-red-50 hover:border-red-200"
                          >
                            Cancel Listing
                          </Button>
                        )}
                        {job.status === JobStatus.CANCELLED && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenModal(job, 'open')}
                            leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                          >
                            Reopen Job
                          </Button>
                        )}
                        <Link href={`/jobs/${job.id}`} target="_blank" rel="noreferrer">
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}

                {/* Pagination Controls */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-pitstop-border">
                    <span className="text-xs text-pitstop-secondary text-center sm:text-left">
                      Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} jobs total)
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!pagination.hasPrevPage}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                        className="min-h-[40px] sm:min-h-0"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!pagination.hasNextPage}
                        onClick={() => setPage((p) => p + 1)}
                        rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                        className="min-h-[40px] sm:min-h-0"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Container>
        </section>

        {/* Job Moderation Modal */}
        {activeModal && (
          <div 
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="job-modal-title"
          >
            <Card className="w-full sm:max-w-md p-6 shadow-xl border-pitstop-border bg-white rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 id="job-modal-title" className="text-lg font-bold text-pitstop-charcoal">
                  Confirm Job Status Change
                </h3>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1.5 -mr-1 text-gray-400 hover:text-gray-600 rounded-lg"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-pitstop-secondary mb-4">
                You are about to change the moderation status of{' '}
                <strong>{activeModal.job.title}</strong> to{' '}
                <Badge variant={activeModal.targetStatus === 'cancelled' ? 'danger' : 'success'}>
                  {activeModal.targetStatus}
                </Badge>.
              </p>

              <div className="mb-6">
                <label 
                  htmlFor="job-moderation-reason" 
                  className="block text-xs font-semibold text-pitstop-charcoal mb-1"
                >
                  Reason / Audit Log Note (Optional)
                </label>
                <textarea
                  id="job-moderation-reason"
                  rows={3}
                  value={moderationReason}
                  onChange={(e) => setModerationReason(e.target.value)}
                  placeholder="e.g. Listing flagged for safety review or policy compliance..."
                  className="w-full text-base sm:text-sm p-3 rounded-lg border border-pitstop-border focus:outline-none focus:ring-2 focus:ring-pitstop-yellow/40 focus:border-pitstop-yellow resize-none"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pb-safe">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setActiveModal(null)}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto min-h-[46px] sm:min-h-0"
                >
                  Cancel
                </Button>
                <Button
                  variant={activeModal.targetStatus === 'cancelled' ? 'outline' : 'primary'}
                  size="md"
                  onClick={handleConfirmStatusChange}
                  isLoading={isSubmitting}
                  className={`w-full sm:w-auto min-h-[46px] sm:min-h-0 ${activeModal.targetStatus === 'cancelled' ? 'text-red-600 border-red-300 hover:bg-red-50' : ''}`}
                >
                  Confirm {activeModal.targetStatus}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>
    </PublicLayout>
  );
}
