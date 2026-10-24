'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Store, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldAlert, 
  ShieldCheck, 
  Phone, 
  Mail,
  MapPin, 
  Calendar, 
  FileText,
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
import { fetchAdminMerchants, updateAdminMerchantStatus } from '@/lib/api/admin';
import { AdminMerchantResponse, PaginationMeta } from 'shared-types';

export default function AdminMerchantsPage() {
  const [merchants, setMerchants] = useState<AdminMerchantResponse[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Moderation Action Modal state
  const [activeModal, setActiveModal] = useState<{
    merchant: AdminMerchantResponse;
    targetStatus: 'verified' | 'rejected' | 'suspended';
  } | null>(null);
  const [moderationReason, setModerationReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadMerchants = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchAdminMerchants({
        page,
        limit: 10,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchQuery.trim() || undefined,
      });

      if (res.success && res.data) {
        setMerchants(res.data.items);
        setPagination(res.data.pagination);
      } else {
        setError(res.message || 'Failed to retrieve merchants list.');
      }
    } catch {
      setError('Network communication failure. Please verify connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, searchQuery]);

  useEffect(() => {
    loadMerchants();
  }, [loadMerchants]);

  const handleOpenModal = (
    merchant: AdminMerchantResponse,
    targetStatus: 'verified' | 'rejected' | 'suspended'
  ) => {
    setActiveModal({ merchant, targetStatus });
    setModerationReason('');
  };

  const handleConfirmStatusChange = async () => {
    if (!activeModal) return;

    setIsSubmitting(true);
    try {
      const res = await updateAdminMerchantStatus(activeModal.merchant.id, {
        status: activeModal.targetStatus,
        reason: moderationReason.trim() || undefined,
      });

      if (res.success && res.data) {
        setFeedbackMessage(
          `Successfully updated "${activeModal.merchant.name}" status to "${activeModal.targetStatus}".`
        );
        setActiveModal(null);
        loadMerchants();
      } else {
        setError(res.message || 'Failed to update merchant status.');
      }
    } catch {
      setError('Network error while processing merchant moderation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <AdminNav />

      <main id="main-content" className="pb-28 md:pb-12 bg-pitstop-bg min-h-[calc(100vh-64px)]">
        <PageHeader
          title="Merchant Partner Moderation"
          description="Review business credentials, approve new store partnerships, and supervise trade licenses across the PitStop India network."
          badge="Partner Verification"
          action={
            <Button
              variant="outline"
              size="md"
              onClick={loadMerchants}
              isLoading={isLoading}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Refresh Data
            </Button>
          }
        />

        <section className="py-6 sm:py-8" aria-label="Merchant management">
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
                <Button variant="outline" size="sm" onClick={loadMerchants}>
                  Retry
                </Button>
              </div>
            )}

            {/* Filter & Search Bar */}
            <Card className="p-4 mb-6 shadow-subtle border-pitstop-border">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-pitstop-secondary" />
                  <input
                    type="text"
                    placeholder="Search by merchant name, business, or phone..."
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
                    { id: 'all', label: 'All Partners' },
                    { id: 'pending_review', label: 'Pending Review' },
                    { id: 'verified', label: 'Verified' },
                    { id: 'rejected', label: 'Rejected' },
                    { id: 'suspended', label: 'Suspended' },
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
                    <div className="h-5 bg-gray-200 rounded w-1/4 mb-3" />
                    <div className="h-4 bg-gray-100 rounded w-1/2 mb-4" />
                    <div className="h-8 bg-gray-100 rounded w-full" />
                  </Card>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && merchants.length === 0 && (
              <Card className="p-12 text-center border-pitstop-border shadow-subtle">
                <EmptyState
                  icon={<Store className="w-8 h-8 text-gray-400" />}
                  title="No merchants match your criteria"
                  description={
                    searchQuery || statusFilter !== 'all'
                      ? 'Try modifying your search keywords or resetting the status filters.'
                      : 'There are currently no registered merchant partners in the system database.'
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

            {/* Merchants List */}
            {!isLoading && merchants.length > 0 && (
              <div className="space-y-4">
                {merchants.map((merchant) => {
                  const verificationStatus =
                    merchant.merchantProfile?.verificationStatus ||
                    (merchant.isVerified ? 'verified' : 'pending_review');

                  return (
                    <Card
                      key={merchant.id}
                      className="p-5 sm:p-6 border-pitstop-border shadow-card hover:shadow-card-hover transition-shadow"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <h2 className="text-lg font-bold text-pitstop-charcoal">
                              {merchant.merchantProfile?.businessName || merchant.name}
                            </h2>

                            {verificationStatus === 'verified' && (
                              <Badge variant="success" className="flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3" />
                                Verified Partner
                              </Badge>
                            )}
                            {verificationStatus === 'pending_review' && (
                              <Badge variant="warning" className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Pending Verification
                              </Badge>
                            )}
                            {verificationStatus === 'rejected' && (
                              <Badge variant="danger" className="flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Application Rejected
                              </Badge>
                            )}
                            {verificationStatus === 'suspended' && (
                              <Badge variant="neutral" className="flex items-center gap-1">
                                <ShieldAlert className="h-3 w-3" />
                                Account Suspended
                              </Badge>
                            )}

                            <span className="text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                              {merchant.merchantProfile?.businessType || 'Partner'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-1.5 gap-x-4 text-xs text-pitstop-secondary">
                            <span className="flex items-center gap-1.5">
                              <Store className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                              Contact: <strong>{merchant.name}</strong>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                              {merchant.phone}
                            </span>
                            {merchant.email && (
                              <span className="flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                                {merchant.email}
                              </span>
                            )}
                            {merchant.merchantProfile?.gstNumber && (
                              <span className="flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                                GSTIN: <strong>{merchant.merchantProfile.gstNumber}</strong>
                              </span>
                            )}
                            {merchant.merchantProfile?.address && (
                              <span className="flex items-center gap-1.5 sm:col-span-2">
                                <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                                {merchant.merchantProfile.address}
                              </span>
                            )}
                          </div>

                          {merchant.merchantProfile?.verificationReason && (
                            <div className="text-xs bg-gray-50 border border-pitstop-border/60 rounded p-2 text-pitstop-secondary mt-2">
                              <strong>Moderation Notes:</strong> {merchant.merchantProfile.verificationReason}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-pitstop-border">
                          {verificationStatus !== 'verified' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleOpenModal(merchant, 'verified')}
                              leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                            >
                              Approve
                            </Button>
                          )}
                          {verificationStatus !== 'rejected' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenModal(merchant, 'rejected')}
                              leftIcon={<AlertCircle className="h-3.5 w-3.5" />}
                              className="text-red-600 hover:bg-red-50 hover:border-red-200"
                            >
                              Reject
                            </Button>
                          )}
                          {verificationStatus !== 'suspended' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenModal(merchant, 'suspended')}
                              leftIcon={<ShieldAlert className="h-3.5 w-3.5" />}
                            >
                              Suspend
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}

                {/* Pagination Controls */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-pitstop-border">
                    <span className="text-xs text-pitstop-secondary text-center sm:text-left">
                      Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} merchants total)
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

        {/* Moderation Confirmation Modal */}
        {activeModal && (
          <div 
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <Card className="w-full sm:max-w-md p-6 shadow-xl border-pitstop-border bg-white rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 id="modal-title" className="text-lg font-bold text-pitstop-charcoal">
                  Confirm Status Change
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
                You are about to change the verification status of{' '}
                <strong>{activeModal.merchant.name}</strong> to{' '}
                <Badge variant={
                  activeModal.targetStatus === 'verified' ? 'success' :
                  activeModal.targetStatus === 'rejected' ? 'danger' : 'neutral'
                }>
                  {activeModal.targetStatus}
                </Badge>.
              </p>

              <div className="mb-6">
                <label 
                  htmlFor="moderation-reason" 
                  className="block text-xs font-semibold text-pitstop-charcoal mb-1"
                >
                  Moderation Reason / Audit Notes (Optional)
                </label>
                <textarea
                  id="moderation-reason"
                  rows={3}
                  value={moderationReason}
                  onChange={(e) => setModerationReason(e.target.value)}
                  placeholder="e.g. Verified physical shop and valid trade certificate on site..."
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
                  variant={activeModal.targetStatus === 'rejected' ? 'outline' : 'primary'}
                  size="md"
                  onClick={handleConfirmStatusChange}
                  isLoading={isSubmitting}
                  className={`w-full sm:w-auto min-h-[46px] sm:min-h-0 ${activeModal.targetStatus === 'rejected' ? 'text-red-600 border-red-300 hover:bg-red-50' : ''}`}
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
