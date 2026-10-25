'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Briefcase, 
  Search, 
  Filter, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  IndianRupee,
  MapPin,
  Sparkles
} from 'lucide-react';
import { PublicLayout, RiderNav } from '@/components/layout';
import { Container, PageHeader, Card, Button, Badge, EmptyState } from '@/components/ui';
import { JobPublicResponse, JobCategory } from 'shared-types';
import { fetchPublicJobs, fetchPublicJobById } from '@/lib/api/jobs';
import { JobCard } from './JobCard';
import { JobDetailModal } from './JobDetailModal';
import { useAuth } from '@/lib/auth/AuthContext';

export const JobsContent: React.FC = () => {
  const searchParams = useSearchParams();
  const initialJobId = searchParams.get('jobId');

  const { isAuthenticated, user } = useAuth();
  const isRider = isAuthenticated && user?.role === 'rider';

  const [jobs, setJobs] = useState<JobPublicResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [payTypeFilter, setPayTypeFilter] = useState<'all' | 'fixed' | 'hourly'>('all');
  const [sortOption, setSortOption] = useState<'newest' | 'pay_desc' | 'duration_asc'>('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);

  // Active Job for Modal
  const [selectedJob, setSelectedJob] = useState<JobPublicResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Success Feedback
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetchPublicJobs({
        page,
        limit: 10,
        search: searchQuery.trim() || undefined,
        category: categoryFilter !== 'all' ? (categoryFilter as JobCategory) : undefined,
        payType: payTypeFilter !== 'all' ? payTypeFilter : undefined,
        sort: sortOption,
      });

      setJobs(res.items);
      setTotalPages(res.pagination.totalPages || 1);
      setTotalJobs(res.pagination.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load micro-jobs.');
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, categoryFilter, payTypeFilter, sortOption]);

  // Debounce loadJobs to prevent rapid network calls on keystroke/filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      loadJobs();
    }, 300);

    return () => clearTimeout(timer);
  }, [loadJobs]);

  // Open initial job if query param present
  useEffect(() => {
    if (initialJobId) {
      fetchPublicJobById(initialJobId)
        .then((job) => {
          setSelectedJob(job);
          setIsModalOpen(true);
        })
        .catch(() => {
          // If not found or failed, ignore gracefully
        });
    }
  }, [initialJobId]);

  const handleViewDetails = (job: JobPublicResponse) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const handleApplicationSubmitted = (job: JobPublicResponse) => {
    setFeedback(`Your application for "${job.title}" was submitted successfully!`);
    // Optimistic update to keep UI responsive without full re-fetch
    setJobs((prev) =>
      prev.map((j) =>
        j.id === job.id
          ? { ...j, acceptedRidersCount: (j.acceptedRidersCount || 0) + 1 }
          : j
      )
    );
  };

  return (
    <PublicLayout>
      <RiderNav />

      <main id="main-content" className="pb-20 md:pb-12">
        <PageHeader
          title="Off-Peak Micro-Jobs Marketplace"
          description="Earn extra income during quiet delivery hours (2 PM – 5 PM) with verified short-term helper tasks published by local merchants."
          badge="Gig Worker Opportunities"
          action={
            isRider ? (
              <Link href="/rider/applications">
                <Button variant="outline" size="md">
                  My Applications
                </Button>
              </Link>
            ) : null
          }
        />

        {/* Search & Filter Bar */}
        <section className="py-6 border-b border-pitstop-border bg-white" aria-label="Job filters">
          <Container size="xl">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-pitstop-muted" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search jobs by title or description..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 text-base sm:text-sm rounded-xl border border-pitstop-border bg-white text-pitstop-charcoal placeholder:text-pitstop-muted/70 focus:outline-none focus:ring-2 focus:ring-pitstop-yellow min-h-[46px]"
                  aria-label="Search jobs"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setPage(1);
                  }}
                  className="flex-1 sm:flex-none px-3 py-2 text-base sm:text-xs font-semibold rounded-xl border border-pitstop-border bg-white text-pitstop-charcoal focus:outline-none focus:ring-2 focus:ring-pitstop-yellow min-h-[46px]"
                  aria-label="Filter by category"
                >
                  <option value="all">All Categories</option>
                  <option value={JobCategory.PARCEL_SORTING}>Parcel Sorting</option>
                  <option value={JobCategory.LOADING_UNLOADING}>Loading & Unloading</option>
                  <option value={JobCategory.FLYER_DISTRIBUTION}>Flyer Distribution</option>
                  <option value={JobCategory.CLEANING_PREP}>Cleaning & Prep</option>
                  <option value={JobCategory.STORE_ASSISTANT}>Store Assistant</option>
                  <option value={JobCategory.OTHER}>Other Tasks</option>
                </select>

                <select
                  value={payTypeFilter}
                  onChange={(e) => {
                    setPayTypeFilter(e.target.value as any);
                    setPage(1);
                  }}
                  className="flex-1 sm:flex-none px-3 py-2 text-base sm:text-xs font-semibold rounded-xl border border-pitstop-border bg-white text-pitstop-charcoal focus:outline-none focus:ring-2 focus:ring-pitstop-yellow min-h-[46px]"
                  aria-label="Filter by payout structure"
                >
                  <option value="all">All Payout Types</option>
                  <option value="fixed">Fixed Payout</option>
                  <option value="hourly">Hourly Rate</option>
                </select>

                <select
                  value={sortOption}
                  onChange={(e) => {
                    setSortOption(e.target.value as any);
                    setPage(1);
                  }}
                  className="flex-1 sm:flex-none px-3 py-2 text-base sm:text-xs font-semibold rounded-xl border border-pitstop-border bg-white text-pitstop-charcoal focus:outline-none focus:ring-2 focus:ring-pitstop-yellow min-h-[46px]"
                  aria-label="Sort jobs"
                >
                  <option value="newest">Newest First</option>
                  <option value="pay_desc">Highest Pay</option>
                  <option value="duration_asc">Shortest Duration</option>
                </select>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={loadJobs}
                  disabled={isLoading}
                  className="min-h-[46px]"
                  leftIcon={<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />}
                  aria-label="Refresh job listings"
                >
                  Refresh
                </Button>
              </div>
            </div>
          </Container>
        </section>

        {/* Content Section */}
        <section className="py-8 sm:py-12" aria-label="Available micro-jobs list">
          <Container size="xl">
            {/* Feedback Message */}
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

            {/* Error Banner with Retry */}
            {error && (
              <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800 flex items-center justify-between gap-4" role="alert">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
                <Button size="sm" variant="secondary" onClick={loadJobs}>
                  Retry
                </Button>
              </div>
            )}

            {/* Active Micro-Jobs Grid */}
            {isLoading && jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-pitstop-muted">
                <RefreshCw className="h-8 w-8 animate-spin mb-3 text-pitstop-yellow-dark" />
                <p className="text-sm font-medium">Loading available micro-jobs...</p>
              </div>
            ) : jobs.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between text-xs text-pitstop-muted">
                  <span>
                    Showing {jobs.length} of {totalJobs} active micro-jobs
                  </span>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
                  {jobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-6 border-t border-pitstop-border text-xs text-pitstop-muted">
                    <span>
                      Page {page} of {totalPages}
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
                  searchQuery || categoryFilter !== 'all' || payTypeFilter !== 'all'
                    ? 'No micro-jobs match your filter criteria. Try clearing search keywords or filter selections.'
                    : 'There are currently no active micro-jobs posted. Local merchants publish off-peak tasks daily.'
                }
                action={
                  searchQuery || categoryFilter !== 'all' || payTypeFilter !== 'all' ? (
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => {
                        setSearchQuery('');
                        setCategoryFilter('all');
                        setPayTypeFilter('all');
                        setPage(1);
                      }}
                    >
                      Reset Filters
                    </Button>
                  ) : (
                    <Link href="/explore">
                      <Button variant="primary" size="md" rightIcon={<ArrowRight className="h-4 w-4" />}>
                        Explore Rest Stops Instead
                      </Button>
                    </Link>
                  )
                }
              />
            )}
          </Container>
        </section>
      </main>

      {/* Job Detail Modal */}
      <JobDetailModal
        job={selectedJob}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onApplicationSubmitted={handleApplicationSubmitted}
      />
    </PublicLayout>
  );
};
