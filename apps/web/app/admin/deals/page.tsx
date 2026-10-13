'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Tag, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldAlert, 
  ShieldCheck, 
  Percent, 
  IndianRupee, 
  MapPin, 
  ExternalLink,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  Store
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
import { fetchAdminDeals, updateAdminDealStatus } from '@/lib/api/admin';
import { DealAdminResponse, PaginationMeta } from 'shared-types';

export default function AdminDealsPage() {
  const [deals, setDeals] = useState<DealAdminResponse[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Moderation Action Modal
  const [activeModal, setActiveModal] = useState<{
    deal: DealAdminResponse;
    targetActive: boolean;
  } | null>(null);
  const [moderationReason, setModerationReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDeals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchAdminDeals({
        page,
        limit: 10,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchQuery.trim() || undefined,
      });

      if (res.success && res.data) {
        setDeals(res.data.items);
        setPagination(res.data.pagination);
      } else {
        setError(res.message || 'Failed to retrieve deals for moderation.');
      }
    } catch {
      setError('Network communication failure. Please verify connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, searchQuery]);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  const handleOpenModal = (deal: DealAdminResponse, targetActive: boolean) => {
    setActiveModal({ deal, targetActive });
    setModerationReason('');
  };

  const handleConfirmStatusChange = async () => {
    if (!activeModal) return;

    setIsSubmitting(true);
    try {
      const res = await updateAdminDealStatus(activeModal.deal.id, {
        isActive: activeModal.targetActive,
        reason: moderationReason.trim() || undefined,
      });

      if (res.success && res.data) {
        setFeedbackMessage(
          `Deal "${activeModal.deal.title}" status updated to "${activeModal.targetActive ? 'active' : 'inactive'}".`
        );
        setActiveModal(null);
        loadDeals();
      } else {
        setError(res.message || 'Failed to update deal status.');
      }
    } catch {
      setError('Network error while saving deal moderation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <AdminNav />

      <main id="main-content" className="pb-20 md:pb-12 bg-pitstop-bg min-h-[calc(100vh-64px)]">
        <PageHeader
          title="Community Deals Supervision"
          description="Moderate merchant discounts, verify authentic rider promotions, and pause misleading offers across the PitStop India network."
          badge="Offers Oversight"
          action={
            <Button
              variant="outline"
              size="md"
              onClick={loadDeals}
              isLoading={isLoading}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Refresh Deals
            </Button>
          }
        />

        <section className="py-6 sm:py-8" aria-label="Community deals management">
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
                <Button variant="outline" size="sm" onClick={loadDeals}>
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
                    placeholder="Search by deal title or terms..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-pitstop-border focus:outline-none focus:ring-2 focus:ring-pitstop-yellow/40 focus:border-pitstop-yellow bg-white"
                  />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                  <Filter className="h-4 w-4 text-pitstop-secondary hidden sm:inline" />
                  <span className="text-xs font-semibold text-pitstop-secondary hidden sm:inline mr-1">Status:</span>
                  {[
                    { id: 'all', label: 'All Deals' },
                    { id: 'active', label: 'Active & Live' },
                    { id: 'inactive', label: 'Inactive / Paused' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => {
                        setStatusFilter(filter.id);
                        setPage(1);
                      }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
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
            {!isLoading && deals.length === 0 && (
              <Card className="p-12 text-center border-pitstop-border shadow-subtle">
                <EmptyState
                  icon={<Tag className="w-8 h-8 text-gray-400" />}
                  title="No deals match your criteria"
                  description={
                    searchQuery || statusFilter !== 'all'
                      ? 'Try modifying your search query or changing the deal status filter.'
                      : 'There are currently no community deals in the platform database.'
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

            {/* Deals List */}
            {!isLoading && deals.length > 0 && (
              <div className="space-y-4">
                {deals.map((deal) => (
                  <Card
                    key={deal.id}
                    className="p-5 sm:p-6 border-pitstop-border shadow-card hover:shadow-card-hover transition-shadow"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h2 className="text-lg font-bold text-pitstop-charcoal">
                            {deal.title}
                          </h2>

                          {deal.isActive ? (
                            <Badge variant="success" className="flex items-center gap-1">
                              <ShieldCheck className="h-3 w-3" />
                              Active & Live
                            </Badge>
                          ) : (
                            <Badge variant="neutral" className="flex items-center gap-1">
                              <ShieldAlert className="h-3 w-3" />
                              Inactive / Paused
                            </Badge>
                          )}

                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 capitalize">
                            {deal.discountType} discount
                          </span>
                        </div>

                        <p className="text-xs text-pitstop-secondary line-clamp-2">
                          {deal.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-pitstop-secondary">
                          {deal.dealPrice !== undefined && (
                            <span className="flex items-center gap-1 font-semibold text-emerald-700">
                              <IndianRupee className="h-3.5 w-3.5" />
                              Deal Price: ₹{deal.dealPrice}
                              {deal.originalPrice && (
                                <span className="line-through text-gray-400 font-normal ml-1">
                                  ₹{deal.originalPrice}
                                </span>
                              )}
                            </span>
                          )}
                          {deal.discountPercentage && (
                            <span className="flex items-center gap-1 font-semibold text-pitstop-charcoal">
                              <Percent className="h-3.5 w-3.5 text-pitstop-yellow" />
                              {deal.discountPercentage}% OFF
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Store className="h-3.5 w-3.5 text-gray-400" />
                            Merchant ID: <code className="text-gray-600">{deal.merchantId}</code>
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-gray-400" />
                            Venue: <code className="text-gray-600">{deal.restStopId}</code>
                          </span>
                        </div>
                      </div>

                      {/* Moderation Actions */}
                      <div className="flex items-center gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-pitstop-border">
                        {deal.isActive ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenModal(deal, false)}
                            leftIcon={<ShieldAlert className="h-3.5 w-3.5" />}
                            className="text-amber-700 hover:bg-amber-50 hover:border-amber-200"
                          >
                            Pause Deal
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenModal(deal, true)}
                            leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                          >
                            Activate Deal
                          </Button>
                        )}
                        <Link href={`/deals/${deal.id}`} target="_blank" rel="noreferrer">
                          <Button variant="ghost" size="sm" rightIcon={<ExternalLink className="h-3.5 w-3.5" />}>
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}

                {/* Pagination Controls */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-pitstop-border">
                    <span className="text-xs text-pitstop-secondary">
                      Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} deals total)
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!pagination.hasPrevPage}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!pagination.hasNextPage}
                        onClick={() => setPage((p) => p + 1)}
                        rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
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

        {/* Deal Moderation Modal */}
        {activeModal && (
          <div 
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="deal-modal-title"
          >
            <Card className="w-full max-w-md p-6 shadow-xl border-pitstop-border bg-white animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between mb-4">
                <h3 id="deal-modal-title" className="text-lg font-bold text-pitstop-charcoal">
                  Confirm Deal Status Change
                </h3>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-pitstop-secondary mb-4">
                You are about to change the status of{' '}
                <strong>{activeModal.deal.title}</strong> to{' '}
                <Badge variant={activeModal.targetActive ? 'success' : 'neutral'}>
                  {activeModal.targetActive ? 'Active' : 'Inactive / Paused'}
                </Badge>.
              </p>

              <div className="mb-6">
                <label 
                  htmlFor="deal-moderation-reason" 
                  className="block text-xs font-semibold text-pitstop-charcoal mb-1"
                >
                  Reason / Audit Log Note (Optional)
                </label>
                <textarea
                  id="deal-moderation-reason"
                  rows={3}
                  value={moderationReason}
                  onChange={(e) => setModerationReason(e.target.value)}
                  placeholder="e.g. Paused during investigation of promotional terms..."
                  className="w-full text-sm p-3 rounded-lg border border-pitstop-border focus:outline-none focus:ring-2 focus:ring-pitstop-yellow/40 focus:border-pitstop-yellow resize-none"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setActiveModal(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleConfirmStatusChange}
                  isLoading={isSubmitting}
                >
                  Confirm {activeModal.targetActive ? 'Activate' : 'Pause'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>
    </PublicLayout>
  );
}
