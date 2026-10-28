'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Briefcase, 
  Plus, 
  MapPin, 
  Clock, 
  IndianRupee, 
  Users, 
  Info, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  X, 
  PackageCheck, 
  Truck, 
  FileText, 
  Sparkle, 
  Store, 
  Layers,
  RefreshCw,
  Edit,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { PublicLayout, MerchantNav } from '@/components/layout';
import { 
  Container, 
  PageHeader, 
  Card, 
  Button, 
  Badge, 
  EmptyState 
} from '@/components/ui';
import { 
  JobCategory, 
  JobStatus, 
  UserPublicProfile, 
  JobMerchantResponse, 
  RestStopMerchantResponse 
} from 'shared-types';
import { 
  fetchMerchantJobs, 
  updateMerchantJob 
} from '@/lib/api/merchant-jobs';
import { fetchMerchantRestStops } from '@/lib/api/merchant-rest-stops';
import { CreateJobModal } from './CreateJobModal';
import { EditJobModal } from './EditJobModal';
import { JobApplicantsModal } from './JobApplicantsModal';
import { useLanguage } from '@/lib/i18n';

interface MerchantJobsContentProps {
  user: UserPublicProfile;
}

export const MerchantJobsContent: React.FC<MerchantJobsContentProps> = ({ user }) => {
  const { isHindi } = useLanguage();
  const [jobs, setJobs] = useState<JobMerchantResponse[]>([]);
  const [restStops, setRestStops] = useState<RestStopMerchantResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [jobToEdit, setJobToEdit] = useState<JobMerchantResponse | null>(null);
  const [jobForApplicants, setJobForApplicants] = useState<JobMerchantResponse | null>(null);

  // Toast / Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [statusTogglingId, setStatusTogglingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [jobsRes, restStopsRes] = await Promise.all([
        fetchMerchantJobs({
          page,
          limit: 10,
          search: searchQuery.trim() || undefined,
          category: categoryFilter !== 'all' ? (categoryFilter as JobCategory) : undefined,
          status: statusFilter !== 'all' ? (statusFilter as any) : undefined,
        }),
        fetchMerchantRestStops({ limit: 50 }),
      ]);

      setJobs(jobsRes.items);
      setTotalPages(jobsRes.pagination.totalPages || 1);
      setTotalJobs(jobsRes.pagination.total);
      setRestStops(restStopsRes.items);
    } catch (err: any) {
      setError(err.message || 'Failed to load micro-jobs from server.');
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, categoryFilter, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleJobCreated = (newJob: JobMerchantResponse) => {
    setFeedback({
      type: 'success',
      message: `Micro-job "${newJob.title}" has been published successfully!`,
    });
    setPage(1);
    loadData();
  };

  const handleJobUpdated = (updatedJob: JobMerchantResponse) => {
    setFeedback({
      type: 'success',
      message: `Micro-job "${updatedJob.title}" updated successfully.`,
    });
    loadData();
  };

  const handleToggleStatus = async (job: JobMerchantResponse) => {
    if (statusTogglingId) return;
    setStatusTogglingId(job.id);
    setFeedback(null);

    try {
      const targetStatus = job.status === JobStatus.OPEN ? JobStatus.CANCELLED : JobStatus.OPEN;
      const updated = await updateMerchantJob(job.id, { status: targetStatus });
      setFeedback({
        type: 'success',
        message: `Job status changed to ${targetStatus === JobStatus.OPEN ? 'Open' : 'Cancelled'}.`,
      });
      await loadData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to change job status.',
      });
    } finally {
      setStatusTogglingId(null);
    }
  };

  const formatCategory = (cat: JobCategory) => {
    switch (cat) {
      case JobCategory.PARCEL_SORTING:
        return isHindi ? 'पार्सल सॉर्टिंग व डिस्पैच' : 'Parcel Sorting & Dispatch';
      case JobCategory.LOADING_UNLOADING:
        return isHindi ? 'लोडिंग व अनलोडिंग' : 'Loading & Unloading';
      case JobCategory.FLYER_DISTRIBUTION:
        return isHindi ? 'पैम्फलेट वितरण' : 'Flyer Distribution';
      case JobCategory.CLEANING_PREP:
        return isHindi ? 'सफाई व तैयारी सहायता' : 'Cleaning & Prep Support';
      case JobCategory.STORE_ASSISTANT:
        return isHindi ? 'स्टोर काउंटर सहायक' : 'Store Counter Assistant';
      case JobCategory.OTHER:
        return isHindi ? 'सामान्य कार्य' : 'General Task';
    }
  };

  const getCategoryIcon = (cat: JobCategory) => {
    switch (cat) {
      case JobCategory.PARCEL_SORTING:
        return <PackageCheck className="h-4 w-4 text-amber-700" aria-hidden="true" />;
      case JobCategory.LOADING_UNLOADING:
        return <Truck className="h-4 w-4 text-blue-700" aria-hidden="true" />;
      case JobCategory.FLYER_DISTRIBUTION:
        return <FileText className="h-4 w-4 text-purple-700" aria-hidden="true" />;
      case JobCategory.CLEANING_PREP:
        return <Sparkle className="h-4 w-4 text-emerald-700" aria-hidden="true" />;
      case JobCategory.STORE_ASSISTANT:
        return <Store className="h-4 w-4 text-orange-700" aria-hidden="true" />;
      case JobCategory.OTHER:
        return <Layers className="h-4 w-4 text-slate-700" aria-hidden="true" />;
    }
  };

  const getStatusBadge = (status: JobStatus) => {
    switch (status) {
      case JobStatus.OPEN:
        return <Badge variant="success" size="sm">{isHindi ? 'राइडर्स के लिए खुला' : 'Open for Riders'}</Badge>;
      case JobStatus.IN_PROGRESS:
        return <Badge variant="warning" size="sm">{isHindi ? 'प्रगति में' : 'In Progress'}</Badge>;
      case JobStatus.COMPLETED:
        return <Badge variant="neutral" size="sm">{isHindi ? 'पूर्ण' : 'Completed'}</Badge>;
      case JobStatus.CANCELLED:
        return <Badge variant="danger" size="sm">{isHindi ? 'रद्द' : 'Cancelled'}</Badge>;
    }
  };

  const formatTimeSlot = (startTimeStr: string, endTimeStr: string) => {
    try {
      const start = new Date(startTimeStr);
      const end = new Date(endTimeStr);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';
      const timeOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
      const dateOpts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
      return `${start.toLocaleDateString(isHindi ? 'hi-IN' : 'en-IN', dateOpts)}, ${start.toLocaleTimeString(isHindi ? 'hi-IN' : 'en-IN', timeOpts)} – ${end.toLocaleTimeString(isHindi ? 'hi-IN' : 'en-IN', timeOpts)}`;
    } catch {
      return '';
    }
  };

  // Find venue name for a job
  const getVenueName = (job: JobMerchantResponse) => {
    if (job.restStopName) return job.restStopName;
    const match = restStops.find((rs) => rs.id === job.restStopId);
    return match ? match.name : (isHindi ? 'रेस्ट स्टॉप वेन्यू' : 'Rest Stop Venue');
  };

  return (
    <PublicLayout>
      <MerchantNav />

      <main id="main-content" className="pb-20 md:pb-12">
        <PageHeader
          title={isHindi ? 'मर्चेंट माइक्रो-जॉब्स पोर्टल' : 'Merchant Micro-Jobs Portal'}
          description={
            isHindi
              ? 'दोपहर के खाली समय में त्वरित टास्क पोस्ट करें ताकि डिलीवरी राइडर्स आराम करते हुए अतिरिक्त कमाई कर सकें।'
              : 'Publish quick on-demand tasks during quiet hours to help delivery riders earn extra income while resting.'
          }
          badge={isHindi ? 'लाइव स्टेशन' : 'Live Station'}
          backHref="/merchant"
          action={
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsCreateOpen(true)}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              {isHindi ? 'नया माइक्रो-जॉब पोस्ट करें' : 'Post Micro-Job'}
            </Button>
          }
        />

        <section className="py-6 sm:py-8" aria-label="Micro-jobs management">
          <Container size="xl">
            {/* Live Metrics Cards */}
            <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-white border border-pitstop-border">
                <span className="text-xs font-medium text-pitstop-muted block">
                  {isHindi ? 'कुल माइक्रो-जॉब्स' : 'Total Micro-Jobs'}
                </span>
                <span className="text-2xl font-extrabold text-pitstop-charcoal mt-1 block">
                  {totalJobs}
                </span>
                <span className="text-[11px] text-pitstop-muted mt-0.5 block">
                  {isHindi ? 'आपके खाते में प्रबंधित' : 'Managed in your account'}
                </span>
              </Card>

              <Card className="p-4 bg-white border border-pitstop-border">
                <span className="text-xs font-medium text-pitstop-muted block">
                  {isHindi ? 'खुले / सक्रिय कार्य' : 'Open / Active Tasks'}
                </span>
                <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">
                  {jobs.filter((j) => j.status === JobStatus.OPEN).length}
                </span>
                <span className="text-[11px] text-pitstop-muted mt-0.5 block">
                  {isHindi ? 'राइडर्स के आवेदन स्वीकार्य' : 'Accepting rider applicants'}
                </span>
              </Card>

              <Card className="p-4 bg-white border border-pitstop-border">
                <span className="text-xs font-medium text-pitstop-muted block">
                  {isHindi ? 'स्वीकृत राइडर्स' : 'Accepted Riders'}
                </span>
                <span className="text-2xl font-extrabold text-pitstop-charcoal mt-1 block">
                  {jobs.reduce((acc, j) => acc + (j.acceptedRidersCount || 0), 0)}
                </span>
                <span className="text-[11px] text-pitstop-muted mt-0.5 block">
                  {isHindi ? 'पुष्टि क्षमता भरी गई' : 'Confirmed capacity filled'}
                </span>
              </Card>

              <Card className="p-4 bg-white border border-pitstop-border">
                <span className="text-xs font-medium text-pitstop-muted block">
                  {isHindi ? 'लंबित आवेदक' : 'Pending Applicants'}
                </span>
                <span className="text-2xl font-extrabold text-amber-600 mt-1 block">
                  {jobs.reduce((acc, j) => acc + (j.pendingApplicationsCount || 0), 0)}
                </span>
                <span className="text-[11px] text-pitstop-muted mt-0.5 block">
                  {isHindi ? 'मर्चेंट समीक्षा प्रतीक्षित' : 'Awaiting merchant review'}
                </span>
              </Card>
            </div>

            {/* Feedback Alert */}
            {feedback && (
              <div 
                className={`mb-6 rounded-lg p-4 text-xs sm:text-sm flex items-center justify-between gap-2 border ${
                  feedback.type === 'success' 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
                role="status"
              >
                <div className="flex items-center gap-2">
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0" aria-hidden="true" />
                  )}
                  <span>{feedback.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFeedback(null)}
                  className="font-bold px-2 py-1 min-h-[32px] hover:opacity-75"
                  aria-label="Dismiss message"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Server Error Banner with Retry */}
            {error && (
              <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800 flex items-center justify-between gap-4" role="alert">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
                <Button size="sm" variant="secondary" onClick={loadData}>
                  Retry
                </Button>
              </div>
            )}

            {/* Filter and Search Bar */}
            <div className="mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-pitstop-muted" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search jobs by title or instructions..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-pitstop-border bg-white text-pitstop-charcoal placeholder:text-pitstop-muted/70 focus:outline-none focus:ring-2 focus:ring-pitstop-yellow min-h-[44px]"
                  aria-label="Search jobs"
                />
              </div>

              {/* Category, Status & Refresh Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 text-xs font-semibold rounded-lg border border-pitstop-border bg-white text-pitstop-charcoal focus:outline-none focus:ring-2 focus:ring-pitstop-yellow min-h-[44px]"
                  aria-label="Filter by category"
                >
                  <option value="all">All Categories</option>
                  <option value={JobCategory.PARCEL_SORTING}>Parcel Sorting</option>
                  <option value={JobCategory.LOADING_UNLOADING}>Loading & Unloading</option>
                  <option value={JobCategory.FLYER_DISTRIBUTION}>Flyer Distribution</option>
                  <option value={JobCategory.CLEANING_PREP}>Cleaning & Prep</option>
                  <option value={JobCategory.STORE_ASSISTANT}>Store Assistant</option>
                  <option value={JobCategory.OTHER}>Other</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 text-xs font-semibold rounded-lg border border-pitstop-border bg-white text-pitstop-charcoal focus:outline-none focus:ring-2 focus:ring-pitstop-yellow min-h-[44px]"
                  aria-label="Filter by status"
                >
                  <option value="all">All Statuses</option>
                  <option value={JobStatus.OPEN}>Open</option>
                  <option value={JobStatus.IN_PROGRESS}>In Progress</option>
                  <option value={JobStatus.COMPLETED}>Completed</option>
                  <option value={JobStatus.CANCELLED}>Cancelled</option>
                </select>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={loadData}
                  disabled={isLoading}
                  leftIcon={<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />}
                  aria-label="Refresh jobs"
                >
                  Refresh
                </Button>
              </div>
            </div>

            {/* Jobs List */}
            {isLoading && jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-pitstop-muted">
                <RefreshCw className="h-8 w-8 animate-spin mb-3 text-pitstop-yellow-dark" />
                <p className="text-sm font-medium">Loading merchant micro-jobs...</p>
              </div>
            ) : jobs.length > 0 ? (
              <div className="space-y-4">
                {jobs.map((job) => {
                  const venueName = getVenueName(job);
                  const formattedTime = formatTimeSlot(job.startTime, job.endTime);
                  const isFull = job.acceptedRidersCount >= job.requiredRiders;
                  const hasPending = (job.pendingApplicationsCount || 0) > 0;

                  return (
                    <Card key={job.id} className="p-6 transition-all hover:border-pitstop-yellow/40">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                        {/* Left: Job Details */}
                        <div className="space-y-3 max-w-2xl">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-pitstop-bg border border-pitstop-border text-pitstop-charcoal">
                              {getCategoryIcon(job.category)}
                              <span>{formatCategory(job.category)}</span>
                            </span>

                            {getStatusBadge(job.status)}

                            {isFull && (
                              <Badge variant="neutral" size="sm">
                                Fully Filled ({job.acceptedRidersCount}/{job.requiredRiders})
                              </Badge>
                            )}
                          </div>

                          <div>
                            <h3 className="text-base sm:text-lg font-bold text-pitstop-charcoal">
                              {job.title}
                            </h3>
                            <div className="mt-1 flex items-center gap-2 text-xs text-pitstop-muted flex-wrap">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5 text-pitstop-yellow-dark" />
                                {venueName}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5 text-pitstop-muted" />
                                {job.durationMinutes} mins {formattedTime ? `(${formattedTime})` : ''}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5 text-pitstop-muted" />
                                <span className={isFull ? 'font-semibold text-emerald-700' : ''}>
                                  {job.acceptedRidersCount} / {job.requiredRiders} riders filled
                                </span>
                              </span>
                            </div>
                          </div>

                          {job.instructions && (
                            <p className="text-xs sm:text-sm text-pitstop-charcoal/80 leading-relaxed bg-pitstop-bg/50 p-3 rounded-lg border border-pitstop-border/60">
                              <strong className="text-pitstop-charcoal font-semibold">Instructions: </strong>
                              {job.instructions}
                            </p>
                          )}
                        </div>

                        {/* Right: Payout and Actions */}
                        <div className="flex lg:flex-col items-center lg:items-end justify-between gap-4 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-pitstop-border">
                          <div className="text-left lg:text-right">
                            <div className="text-2xl font-extrabold text-pitstop-charcoal flex items-center lg:justify-end gap-1">
                              <IndianRupee className="h-5 w-5 text-pitstop-yellow-dark" />
                              <span>{job.payAmount}</span>
                            </div>
                            <span className="text-xs text-pitstop-muted capitalize">
                              {job.payType} Payout
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {/* View Applicants action button */}
                            <Button
                              type="button"
                              variant={hasPending ? 'primary' : 'secondary'}
                              size="sm"
                              onClick={() => setJobForApplicants(job)}
                              leftIcon={<Users className="h-4 w-4" />}
                              className="text-xs min-h-[40px]"
                            >
                              Applicants ({job.applicationsCount || 0})
                              {hasPending && (
                                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-bold">
                                  {job.pendingApplicationsCount}
                                </span>
                              )}
                            </Button>

                            {/* Edit Job button */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setJobToEdit(job)}
                              leftIcon={<Edit className="h-3.5 w-3.5" />}
                              className="text-xs min-h-[40px]"
                            >
                              Edit
                            </Button>

                            {/* Status toggle action */}
                            {(job.status === JobStatus.OPEN || job.status === JobStatus.CANCELLED) && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleStatus(job)}
                                disabled={statusTogglingId === job.id}
                                className={`text-xs min-h-[40px] ${
                                  job.status === JobStatus.OPEN ? 'text-red-600 hover:text-red-700' : 'text-emerald-700 hover:text-emerald-800'
                                }`}
                              >
                                {job.status === JobStatus.OPEN ? 'Cancel' : 'Reopen'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 mt-6 border-t border-pitstop-border text-xs text-pitstop-muted">
                    <span>
                      Page {page} of {totalPages} ({totalJobs} micro-jobs total)
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
                title="No Micro-Jobs Found"
                description={
                  searchQuery || categoryFilter !== 'all' || statusFilter !== 'all'
                    ? 'No micro-jobs match your filter selections. Try clearing search or filters.'
                    : 'You haven’t posted any micro-jobs yet. Post quick tasks to assist your venue operations.'
                }
                action={
                  searchQuery || categoryFilter !== 'all' || statusFilter !== 'all' ? (
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => {
                        setSearchQuery('');
                        setCategoryFilter('all');
                        setStatusFilter('all');
                        setPage(1);
                      }}
                    >
                      Reset Filters
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => setIsCreateOpen(true)}
                      leftIcon={<Plus className="h-4 w-4" />}
                    >
                      Post First Micro-Job
                    </Button>
                  )
                }
              />
            )}
          </Container>
        </section>
      </main>

      {/* Modals */}
      <CreateJobModal
        restStops={restStops}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleJobCreated}
      />

      {jobToEdit && (
        <EditJobModal
          job={jobToEdit}
          isOpen={Boolean(jobToEdit)}
          onClose={() => setJobToEdit(null)}
          onUpdated={handleJobUpdated}
        />
      )}

      {jobForApplicants && (
        <JobApplicantsModal
          job={jobForApplicants}
          isOpen={Boolean(jobForApplicants)}
          onClose={() => setJobForApplicants(null)}
          onJobMutated={loadData}
        />
      )}
    </PublicLayout>
  );
};
