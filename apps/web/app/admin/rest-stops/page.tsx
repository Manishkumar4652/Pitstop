'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  MapPin, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldAlert, 
  ShieldCheck, 
  RefreshCw,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Store,
  Users
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
import { fetchAdminRestStops, updateAdminRestStopStatus } from '@/lib/api/admin';
import { RestStopAdminResponse, PaginationMeta, RestStopStatus } from 'shared-types';

export default function AdminRestStopsPage() {
  const [restStops, setRestStops] = useState<RestStopAdminResponse[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Moderation Action Modal state
  const [activeModal, setActiveModal] = useState<{
    restStop: RestStopAdminResponse;
    targetStatus: 'active' | 'suspended' | 'pending_approval';
  } | null>(null);
  const [moderationReason, setModerationReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRestStops = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchAdminRestStops({
        page,
        limit: 10,
        status: statusFilter === 'all' ? undefined : statusFilter,
        city: cityFilter.trim() || undefined,
        search: searchQuery.trim() || undefined,
      });

      if (res.success && res.data) {
        setRestStops(res.data.items);
        setPagination(res.data.pagination);
      } else {
        setError(res.message || 'Failed to retrieve rest stops.');
      }
    } catch {
      setError('Network communication failure. Please check connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, cityFilter, searchQuery]);

  useEffect(() => {
    loadRestStops();
  }, [loadRestStops]);

  const handleOpenModal = (
    restStop: RestStopAdminResponse,
    targetStatus: 'active' | 'suspended' | 'pending_approval'
  ) => {
    setActiveModal({ restStop, targetStatus });
    setModerationReason('');
  };

  const handleConfirmStatusChange = async () => {
    if (!activeModal) return;

    setIsSubmitting(true);
    try {
      const res = await updateAdminRestStopStatus(activeModal.restStop.id, {
        status: activeModal.targetStatus,
        reason: moderationReason.trim() || undefined,
      });

      if (res.success && res.data) {
        setFeedbackMessage(
          `Rest stop "${activeModal.restStop.name}" status updated to "${activeModal.targetStatus}".`
        );
        setActiveModal(null);
        loadRestStops();
      } else {
        setError(res.message || 'Failed to update rest stop status.');
      }
    } catch {
      setError('Network error while saving rest stop moderation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <AdminNav />

      <main id="main-content" className="pb-28 md:pb-12 bg-pitstop-bg min-h-[calc(100vh-64px)]">
        <PageHeader
          title="Rest-Stop Moderation Queue"
          description="Inspect and approve partner facilities, enforce sanitation and amenity guidelines, and supervise operational status across India."
          badge="Venue Oversight"
          action={
            <Button
              variant="outline"
              size="md"
              onClick={loadRestStops}
              isLoading={isLoading}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Refresh Data
            </Button>
          }
        />

        <section className="py-6 sm:py-8" aria-label="Rest-stop management">
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

            {/* Error Notification with Retry */}
            {error && (
              <div 
                role="alert" 
                className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
                <Button variant="outline" size="sm" onClick={loadRestStops}>
                  Retry
                </Button>
              </div>
            )}

            {/* Filter & Search Bar */}
            <Card className="p-4 mb-6 shadow-subtle border-pitstop-border">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-pitstop-secondary" />
                    <input
                      type="text"
                      placeholder="Search rest stops by name or area..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setPage(1);
                      }}
                      className="w-full pl-9 pr-4 py-2 min-h-[44px] text-base sm:text-sm rounded-lg border border-pitstop-border focus:outline-none focus:ring-2 focus:ring-pitstop-yellow/40 focus:border-pitstop-yellow bg-white"
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="Filter by city (e.g. Bengaluru)..."
                    value={cityFilter}
                    onChange={(e) => {
                      setCityFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full sm:w-56 px-3 py-2 min-h-[44px] text-base sm:text-sm rounded-lg border border-pitstop-border focus:outline-none focus:ring-2 focus:ring-pitstop-yellow/40 focus:border-pitstop-yellow bg-white"
                  />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                  <Filter className="h-4 w-4 text-pitstop-secondary hidden sm:inline" />
                  <span className="text-xs font-semibold text-pitstop-secondary hidden sm:inline mr-1">Status:</span>
                  {[
                    { id: 'all', label: 'All Stops' },
                    { id: RestStopStatus.PENDING_APPROVAL, label: 'Pending Approval' },
                    { id: RestStopStatus.ACTIVE, label: 'Active' },
                    { id: RestStopStatus.SUSPENDED, label: 'Suspended' },
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
            {!isLoading && restStops.length === 0 && (
              <Card className="p-12 text-center border-pitstop-border shadow-subtle">
                <EmptyState
                  icon={<MapPin className="w-8 h-8 text-gray-400" />}
                  title="No rest stops match your filters"
                  description={
                    searchQuery || cityFilter || statusFilter !== 'all'
                      ? 'Try modifying your search query, clearing the city filter, or resetting status filters.'
                      : 'There are currently no rest stop facilities registered in the database.'
                  }
                  action={
                    (searchQuery || cityFilter || statusFilter !== 'all') ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchQuery('');
                          setCityFilter('');
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

            {/* Rest Stops List */}
            {!isLoading && restStops.length > 0 && (
              <div className="space-y-4">
                {restStops.map((stop) => (
                  <Card
                    key={stop.id}
                    className="p-5 sm:p-6 border-pitstop-border shadow-card hover:shadow-card-hover transition-shadow"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h2 className="text-lg font-bold text-pitstop-charcoal">
                            {stop.name}
                          </h2>

                          {stop.status === RestStopStatus.ACTIVE && (
                            <Badge variant="success" className="flex items-center gap-1">
                              <ShieldCheck className="h-3 w-3" />
                              Active & Live
                            </Badge>
                          )}
                          {stop.status === RestStopStatus.PENDING_APPROVAL && (
                            <Badge variant="warning" className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Pending Approval
                            </Badge>
                          )}
                          {stop.status === RestStopStatus.SUSPENDED && (
                            <Badge variant="neutral" className="flex items-center gap-1">
                              <ShieldAlert className="h-3 w-3" />
                              Suspended
                            </Badge>
                          )}

                          <span className="text-xs font-medium text-pitstop-secondary">
                            Slug: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">{stop.slug}</code>
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-pitstop-secondary">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-gray-400" />
                            {stop.address.area}, {stop.address.city} ({stop.address.pincode})
                          </span>
                          <span className="flex items-center gap-1">
                            <Store className="h-3.5 w-3.5 text-gray-400" />
                            Merchant ID: <code className="text-gray-600">{stop.merchantId}</code>
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-gray-400" />
                            Capacity: {stop.capacity.currentOccupancy}/{stop.capacity.maxRiders} spots
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {stop.facilities.map((fac: string) => (
                            <span 
                              key={fac} 
                              className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-pitstop-yellow/20 text-pitstop-charcoal capitalize"
                            >
                              {fac}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Moderation Actions */}
                      <div className="flex items-center gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-pitstop-border">
                        {stop.status !== RestStopStatus.ACTIVE && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenModal(stop, 'active')}
                            leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                          >
                            Approve
                          </Button>
                        )}
                        {stop.status !== RestStopStatus.SUSPENDED && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenModal(stop, 'suspended')}
                            leftIcon={<ShieldAlert className="h-3.5 w-3.5" />}
                            className="text-amber-700 hover:bg-amber-50 hover:border-amber-200"
                          >
                            Suspend
                          </Button>
                        )}
                        <Link 
                          href={`/rest-stops/${stop.slug}`} 
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Button variant="ghost" size="sm" rightIcon={<ExternalLink className="h-3.5 w-3.5" />}>
                            View Public
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
                      Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} rest stops total)
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

        {/* Status Confirmation Modal */}
        {activeModal && (
          <div 
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rest-stop-modal-title"
          >
            <Card className="w-full sm:max-w-md p-6 shadow-xl border-pitstop-border bg-white rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 id="rest-stop-modal-title" className="text-lg font-bold text-pitstop-charcoal">
                  Confirm Rest Stop Status Change
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
                You are about to change the status of{' '}
                <strong>{activeModal.restStop.name}</strong> to{' '}
                <Badge variant={activeModal.targetStatus === 'active' ? 'success' : 'neutral'}>
                  {activeModal.targetStatus}
                </Badge>.
              </p>

              <div className="mb-6">
                <label 
                  htmlFor="rs-moderation-reason" 
                  className="block text-xs font-semibold text-pitstop-charcoal mb-1"
                >
                  Moderation Reason / Audit Notes (Optional)
                </label>
                <textarea
                  id="rs-moderation-reason"
                  rows={3}
                  value={moderationReason}
                  onChange={(e) => setModerationReason(e.target.value)}
                  placeholder="e.g. Approved after physical safety and hygiene verification..."
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
                  variant="primary"
                  size="md"
                  onClick={handleConfirmStatusChange}
                  isLoading={isSubmitting}
                  className="w-full sm:w-auto min-h-[46px] sm:min-h-0"
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
