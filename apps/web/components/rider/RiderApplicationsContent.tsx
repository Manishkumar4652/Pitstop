'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Briefcase, 
  Clock, 
  IndianRupee, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  XCircle, 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  ArrowRight,
  Info
} from 'lucide-react';
import { PublicLayout, RiderNav } from '@/components/layout';
import { Container, PageHeader, Card, Button, Badge, EmptyState } from '@/components/ui';
import { RiderJobApplicationResponse, JobApplicationStatus, UserPublicProfile } from 'shared-types';
import { fetchRiderApplications, withdrawRiderApplication } from '@/lib/api/rider-applications';

interface RiderApplicationsContentProps {
  user: UserPublicProfile;
}

export const RiderApplicationsContent: React.FC<RiderApplicationsContentProps> = ({ user }) => {
  const [applications, setApplications] = useState<RiderJobApplicationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalApplications, setTotalApplications] = useState(0);

  // Withdrawing in-flight tracking
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetchRiderApplications({
        page,
        limit: 10,
        status: statusFilter,
      });

      setApplications(res.items);
      setTotalPages(res.pagination.totalPages || 1);
      setTotalApplications(res.pagination.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load application history.');
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleWithdraw = async (applicationId: string, jobTitle?: string) => {
    if (withdrawingId) return;
    setWithdrawingId(applicationId);
    setError(null);
    setFeedback(null);

    try {
      await withdrawRiderApplication(applicationId);
      setFeedback(`Successfully withdrawn application for "${jobTitle || 'micro-job'}".`);
      await loadApplications();
    } catch (err: any) {
      setError(err.message || 'Failed to withdraw application. The application state may have changed.');
      await loadApplications();
    } finally {
      setWithdrawingId(null);
    }
  };

  const getStatusBadge = (status: JobApplicationStatus) => {
    switch (status) {
      case JobApplicationStatus.PENDING:
        return <Badge variant="warning" size="sm">Pending Merchant Review</Badge>;
      case JobApplicationStatus.ACCEPTED:
        return <Badge variant="success" size="sm">Accepted Shift</Badge>;
      case JobApplicationStatus.REJECTED:
        return <Badge variant="danger" size="sm">Not Selected</Badge>;
      case JobApplicationStatus.WITHDRAWN:
        return <Badge variant="neutral" size="sm">Withdrawn</Badge>;
    }
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const formatSchedule = (startIso?: string, endIso?: string) => {
    if (!startIso || !endIso) return '';
    try {
      const s = new Date(startIso);
      const e = new Date(endIso);
      if (isNaN(s.getTime()) || isNaN(e.getTime())) return '';
      const dateOpts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
      const timeOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
      return `${s.toLocaleDateString('en-IN', dateOpts)} • ${s.toLocaleTimeString('en-IN', timeOpts)} – ${e.toLocaleTimeString('en-IN', timeOpts)}`;
    } catch {
      return '';
    }
  };

  const pendingCount = applications.filter((a) => a.status === JobApplicationStatus.PENDING).length;
  const acceptedCount = applications.filter((a) => a.status === JobApplicationStatus.ACCEPTED).length;

  return (
    <PublicLayout>
      <RiderNav />

      <main id="main-content" className="pb-20 md:pb-12">
        <PageHeader
          title="My Micro-Job Applications"
          description="Track status updates for helper tasks you have applied to, review accepted shift details, or withdraw pending applications."
          badge="Rider Shifts"
          backHref="/jobs"
          action={
            <Link href="/jobs">
              <Button variant="primary" size="md" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Browse More Jobs
              </Button>
            </Link>
          }
        />

        <section className="py-6 sm:py-8" aria-label="Rider applications tracking">
          <Container size="xl">
            {/* Status Metric Strip */}
            <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-white border border-pitstop-border">
                <span className="text-xs font-medium text-pitstop-muted block">Total Applications</span>
                <span className="text-2xl font-extrabold text-pitstop-charcoal mt-1 block">
                  {totalApplications}
                </span>
                <span className="text-[11px] text-pitstop-muted mt-0.5 block">Lifetime submissions</span>
              </Card>

              <Card className="p-4 bg-white border border-pitstop-border">
                <span className="text-xs font-medium text-pitstop-muted block">Pending Review</span>
                <span className="text-2xl font-extrabold text-amber-600 mt-1 block">
                  {pendingCount}
                </span>
                <span className="text-[11px] text-pitstop-muted mt-0.5 block">Awaiting merchant selection</span>
              </Card>

              <Card className="p-4 bg-white border border-pitstop-border">
                <span className="text-xs font-medium text-pitstop-muted block">Accepted Shifts</span>
                <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">
                  {acceptedCount}
                </span>
                <span className="text-[11px] text-pitstop-muted mt-0.5 block">Confirmed assignments</span>
              </Card>

              <Card className="p-4 bg-white border border-pitstop-border">
                <span className="text-xs font-medium text-pitstop-muted block">Partner Profile</span>
                <span className="text-base font-bold text-pitstop-charcoal mt-1 block truncate">
                  {user.name}
                </span>
                <span className="text-[11px] text-pitstop-muted mt-0.5 block truncate">
                  {user.riderProfile?.platform || 'Delivery Partner'}
                </span>
              </Card>
            </div>

            {/* Feedback Alert */}
            {feedback && (
              <div 
                className="mb-6 rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-xs sm:text-sm text-emerald-800 flex items-center justify-between gap-2"
                role="status"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{feedback}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFeedback(null)}
                  className="font-bold px-2 py-1 min-h-[32px] hover:opacity-75"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800 flex items-center justify-between gap-4" role="alert">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
                <Button size="sm" variant="secondary" onClick={loadApplications}>
                  Retry
                </Button>
              </div>
            )}

            {/* Filter Tabs & Refresh Bar */}
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-pitstop-border pb-3">
              <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
                {[
                  { value: 'all', label: 'All Applications' },
                  { value: JobApplicationStatus.PENDING, label: 'Pending Review' },
                  { value: JobApplicationStatus.ACCEPTED, label: 'Accepted Shifts' },
                  { value: JobApplicationStatus.REJECTED, label: 'Not Selected' },
                  { value: JobApplicationStatus.WITHDRAWN, label: 'Withdrawn' },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => {
                      setStatusFilter(tab.value);
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] ${
                      statusFilter === tab.value
                        ? 'bg-pitstop-yellow text-pitstop-charcoal shadow-sm'
                        : 'text-pitstop-muted hover:text-pitstop-charcoal hover:bg-slate-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={loadApplications}
                disabled={isLoading}
                leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
              >
                Refresh
              </Button>
            </div>

            {/* Applications List */}
            {isLoading && applications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-pitstop-muted">
                <RefreshCw className="h-8 w-8 animate-spin mb-3 text-pitstop-yellow-dark" />
                <p className="text-sm font-medium">Loading applications...</p>
              </div>
            ) : applications.length > 0 ? (
              <div className="space-y-4">
                {applications.map((app) => {
                  const isPending = app.status === JobApplicationStatus.PENDING;
                  const isWithdrawing = withdrawingId === app.id;
                  const scheduleStr = formatSchedule(app.startTime, app.endTime);

                  return (
                    <Card key={app.id} className="p-5 sm:p-6 transition-all hover:border-pitstop-yellow/50">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                        {/* Left Details */}
                        <div className="space-y-2.5 max-w-2xl flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {getStatusBadge(app.status)}
                            <span className="text-xs text-pitstop-muted flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Applied on {formatDate(app.createdAt)}
                            </span>
                          </div>

                          <div>
                            <h3 className="text-base sm:text-lg font-bold text-pitstop-charcoal">
                              {app.jobTitle || 'Micro-Job Task'}
                            </h3>
                            <div className="mt-1 flex items-center gap-2 text-xs text-pitstop-muted flex-wrap">
                              <span className="flex items-center gap-1 font-medium text-pitstop-charcoal">
                                <MapPin className="h-3.5 w-3.5 text-pitstop-yellow-dark shrink-0" />
                                <span>{app.restStopName || 'Partner Rest Stop'}</span>
                              </span>
                              {app.durationMinutes && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5 text-pitstop-muted shrink-0" />
                                    <span>{app.durationMinutes} mins</span>
                                  </span>
                                </>
                              )}
                              {scheduleStr && (
                                <>
                                  <span>•</span>
                                  <span>{scheduleStr}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Rider Notes if any */}
                          {app.notes && (
                            <p className="text-xs text-pitstop-muted italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              <strong className="not-italic text-slate-700 font-semibold">Your Note: </strong>
                              &ldquo;{app.notes}&rdquo;
                            </p>
                          )}

                          {/* Merchant Instructions if accepted */}
                          {app.status === JobApplicationStatus.ACCEPTED && app.instructions && (
                            <div className="text-xs text-emerald-900 bg-emerald-50/80 p-3 rounded-lg border border-emerald-200">
                              <strong className="font-semibold block mb-0.5">Merchant Instructions:</strong>
                              <span>{app.instructions}</span>
                            </div>
                          )}
                        </div>

                        {/* Right: Payout & Actions */}
                        <div className="flex lg:flex-col items-center lg:items-end justify-between gap-4 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-pitstop-border">
                          {app.payAmount !== undefined && (
                            <div className="text-left lg:text-right">
                              <div className="text-xl sm:text-2xl font-black text-pitstop-charcoal flex items-center lg:justify-end gap-0.5">
                                <IndianRupee className="h-4 sm:h-5 w-4 sm:w-5 text-pitstop-yellow-dark" />
                                <span>{app.payAmount}</span>
                              </div>
                              <span className="text-[11px] text-pitstop-muted capitalize block">
                                {app.payType === 'hourly' ? 'Per hour' : 'Fixed payout'}
                              </span>
                            </div>
                          )}

                          <div>
                            {isPending ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleWithdraw(app.id, app.jobTitle)}
                                disabled={Boolean(withdrawingId)}
                                isLoading={isWithdrawing}
                                leftIcon={<XCircle className="h-3.5 w-3.5 text-red-600" />}
                                className="text-xs min-h-[40px] text-red-700 hover:text-red-800 hover:border-red-300"
                              >
                                Withdraw Application
                              </Button>
                            ) : app.status === JobApplicationStatus.ACCEPTED ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Confirmed Assignment
                              </span>
                            ) : (
                              <span className="text-xs text-pitstop-muted">
                                Decision Finalized
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-6 border-t border-pitstop-border text-xs text-pitstop-muted">
                    <span>
                      Page {page} of {totalPages} ({totalApplications} total)
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
              </div>
            ) : (
              <EmptyState
                icon={<Briefcase className="h-8 w-8 text-pitstop-muted" />}
                title="No Applications Found"
                description={
                  statusFilter !== 'all'
                    ? `You don’t have any applications under status "${statusFilter}".`
                    : 'You haven’t applied for any micro-jobs yet. Browse available tasks to earn extra income during off-peak hours.'
                }
                action={
                  <Link href="/jobs">
                    <Button variant="primary" size="md" rightIcon={<ArrowRight className="h-4 w-4" />}>
                      Browse Available Micro-Jobs
                    </Button>
                  </Link>
                }
              />
            )}
          </Container>
        </section>
      </main>
    </PublicLayout>
  );
};
