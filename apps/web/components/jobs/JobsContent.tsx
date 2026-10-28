'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Briefcase, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { PublicLayout, RiderNav } from '@/components/layout';
import { Container, PageHeader, Button, EmptyState } from '@/components/ui';
import { JobPublicResponse, JobCategory } from 'shared-types';
import { fetchPublicJobs, fetchPublicJobById } from '@/lib/api/jobs';
import { JobCard } from './JobCard';
import { JobDetailModal } from './JobDetailModal';
import { useAuth } from '@/lib/auth/AuthContext';
import { useLanguage } from '@/lib/i18n';

export const JobsContent: React.FC = () => {
  const searchParams = useSearchParams();
  const initialJobId = searchParams.get('jobId');

  const { isAuthenticated, user } = useAuth();
  const isRider = isAuthenticated && user?.role === 'rider';
  const { isHindi } = useLanguage();

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
      setError(err.message || (isHindi ? 'माइक्रो-जॉब्स लोड करने में विफल।' : 'Failed to load micro-jobs.'));
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, categoryFilter, payTypeFilter, sortOption, isHindi]);

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

  const handleApplicationSubmitted = () => {
    setIsModalOpen(false);
    setFeedback(
      isHindi
        ? 'आवेदन सफलतापूर्वक सबमिट हो गया! मर्चेंट समीक्षा करेगा और पुष्टि होने पर आपको सूचित किया जाएगा।'
        : 'Application submitted successfully! The merchant will review and you will be notified upon confirmation.'
    );
    loadJobs();
  };

  return (
    <PublicLayout>
      <RiderNav />

      <main id="main-content" className="pb-20 md:pb-12">
        <PageHeader
          title={isHindi ? 'ऑफ-पीक माइक्रो-जॉब्स मार्केटप्लेस' : 'Off-Peak Micro-Jobs Marketplace'}
          description={
            isHindi
              ? 'दोपहर के शांत घंटों (2 PM – 5 PM) में स्थानीय मर्चेंट्स द्वारा पोस्ट किए गए वेरिफाइड अल्पकालिक कार्यों से अतिरिक्त आय अर्जित करें।'
              : 'Earn extra income during quiet delivery hours (2 PM – 5 PM) with verified short-term helper tasks published by local merchants.'
          }
          badge={isHindi ? 'गिग वर्कर अवसर' : 'Gig Worker Opportunities'}
          action={
            isRider ? (
              <Link href="/rider/applications">
                <Button variant="outline" size="md">
                  {isHindi ? 'मेरे आवेदन' : 'My Applications'}
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
                  placeholder={isHindi ? 'शीर्षक या विवरण द्वारा कार्य खोजें...' : 'Search jobs by title or description...'}
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
                  <option value="all">{isHindi ? 'सभी श्रेणियां' : 'All Categories'}</option>
                  <option value={JobCategory.PARCEL_SORTING}>{isHindi ? 'पार्सल सॉर्टिंग' : 'Parcel Sorting'}</option>
                  <option value={JobCategory.LOADING_UNLOADING}>{isHindi ? 'लोडिंग व अनलोडिंग' : 'Loading & Unloading'}</option>
                  <option value={JobCategory.FLYER_DISTRIBUTION}>{isHindi ? 'पर्चे वितरण' : 'Flyer Distribution'}</option>
                  <option value={JobCategory.CLEANING_PREP}>{isHindi ? 'सफाई व तैयारी' : 'Cleaning & Prep'}</option>
                  <option value={JobCategory.STORE_ASSISTANT}>{isHindi ? 'दुकान सहायक' : 'Store Assistant'}</option>
                  <option value={JobCategory.OTHER}>{isHindi ? 'अन्य कार्य' : 'Other Tasks'}</option>
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
                  <option value="all">{isHindi ? 'सभी भुगतान प्रकार' : 'All Payout Types'}</option>
                  <option value="fixed">{isHindi ? 'निश्चित भुगतान' : 'Fixed Payout'}</option>
                  <option value="hourly">{isHindi ? 'प्रति घंटा दर' : 'Hourly Rate'}</option>
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
                  <option value="newest">{isHindi ? 'नवीनतम पहले' : 'Newest First'}</option>
                  <option value="pay_desc">{isHindi ? 'अधिकतम भुगतान' : 'Highest Pay'}</option>
                  <option value="duration_asc">{isHindi ? 'कम समय' : 'Shortest Duration'}</option>
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
                  {isHindi ? 'रिफ्रेश' : 'Refresh'}
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
                  {isHindi ? 'पुनः प्रयास करें' : 'Retry'}
                </Button>
              </div>
            )}

            {/* Active Micro-Jobs Grid */}
            {isLoading && jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-pitstop-muted">
                <RefreshCw className="h-8 w-8 animate-spin mb-3 text-pitstop-yellow-dark" />
                <p className="text-sm font-medium">
                  {isHindi ? 'माइक्रो-जॉब्स लोड हो रहे हैं...' : 'Loading available micro-jobs...'}
                </p>
              </div>
            ) : jobs.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between text-xs text-pitstop-muted">
                  <span>
                    {isHindi
                      ? `${totalJobs} सक्रिय माइक्रो-जॉब्स में से ${jobs.length} प्रदर्शित`
                      : `Showing ${jobs.length} of ${totalJobs} active micro-jobs`}
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
                      {isHindi ? `पृष्ठ ${page} का ${totalPages}` : `Page ${page} of ${totalPages}`}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1 || isLoading}
                        leftIcon={<ChevronLeft className="h-3.5 w-3.5" />}
                      >
                        {isHindi ? 'पिछला' : 'Previous'}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages || isLoading}
                        rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
                      >
                        {isHindi ? 'अगला' : 'Next'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                icon={<Briefcase className="h-8 w-8 text-pitstop-muted" />}
                title={isHindi ? 'कोई माइक्रो-जॉब नहीं मिला' : 'No Micro-Jobs Found'}
                description={
                  searchQuery || categoryFilter !== 'all' || payTypeFilter !== 'all'
                    ? (isHindi
                        ? 'आपके फ़िल्टर से मेल खाने वाला कोई काम नहीं मिला। खोज कीवर्ड या फ़िल्टर साफ़ करें।'
                        : 'No micro-jobs match your filter criteria. Try clearing search keywords or filter selections.')
                    : (isHindi
                        ? 'वर्तमान में कोई सक्रिय काम पोस्ट नहीं है। स्थानीय व्यापारी प्रतिदिन दोपहर के कार्य पोस्ट करते हैं।'
                        : 'There are currently no active micro-jobs posted. Local merchants publish off-peak tasks daily.')
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
                      {isHindi ? 'फ़िल्टर रीसेट करें' : 'Reset Filters'}
                    </Button>
                  ) : (
                    <Link href="/explore">
                      <Button variant="primary" size="md" rightIcon={<ArrowRight className="h-4 w-4" />}>
                        {isHindi ? 'रेस्ट स्टॉप्स खोजें' : 'Explore Rest Stops Instead'}
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
