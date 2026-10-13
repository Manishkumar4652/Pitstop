'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Tag, 
  Plus, 
  MapPin, 
  Clock, 
  Info, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Percent,
  IndianRupee,
  Gift,
  Search,
  Filter,
  X,
  RefreshCw,
  Calendar,
  Layers,
  Edit,
  Play,
  Pause
} from 'lucide-react';
import { PublicLayout, MerchantNav } from '@/components/layout';
import { 
  Container, 
  PageHeader, 
  Card, 
  Button, 
  Input, 
  Select, 
  Badge, 
  EmptyState 
} from '@/components/ui';
import { 
  UserPublicProfile, 
  DealMerchantResponse, 
  RestStopMerchantResponse,
  DealDiscountType,
  RestStopStatus 
} from 'shared-types';
import { 
  fetchMerchantDeals, 
  toggleMerchantDealStatus 
} from '@/lib/api/merchant-deals';
import { fetchMerchantRestStops } from '@/lib/api/merchant-rest-stops';
import { CreateDealModal } from './CreateDealModal';
import { EditDealModal } from './EditDealModal';

interface MerchantDealsContentProps {
  user: UserPublicProfile;
}

export const MerchantDealsContent: React.FC<MerchantDealsContentProps> = ({ user }) => {
  const [deals, setDeals] = useState<DealMerchantResponse[]>([]);
  const [restStops, setRestStops] = useState<RestStopMerchantResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
  const [selectedRestStopId, setSelectedRestStopId] = useState<string>('all');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [dealToEdit, setDealToEdit] = useState<DealMerchantResponse | null>(null);

  // Toast / Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [dealsRes, restStopsRes] = await Promise.all([
        fetchMerchantDeals({
          status: statusFilter,
          restStopId: selectedRestStopId !== 'all' ? selectedRestStopId : undefined,
          search: searchQuery.trim() || undefined,
        }),
        fetchMerchantRestStops({ limit: 50 }),
      ]);

      setDeals(dealsRes.items);
      setRestStops(restStopsRes.items);
    } catch (err: any) {
      setError(err.message || 'Failed to load promotional deals from backend service.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, selectedRestStopId, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Dismiss feedback
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Quick Toggle Handler
  const handleToggleStatus = async (deal: DealMerchantResponse) => {
    const isCurrentlyActive = deal.isActive;
    const now = new Date();
    const isExpired = deal.validUntil && new Date(deal.validUntil) < now;

    if (!isCurrentlyActive && isExpired) {
      setFeedback({
        type: 'error',
        message: 'Cannot activate an expired deal. Please edit the deal to extend its validity date first.',
      });
      return;
    }

    setTogglingId(deal.id);
    try {
      const updated = await toggleMerchantDealStatus(deal.id, !isCurrentlyActive);
      setDeals((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setFeedback({
        type: 'success',
        message: `Deal "${updated.title}" ${updated.isActive ? 'activated' : 'paused'} successfully.`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update deal status.',
      });
    } finally {
      setTogglingId(null);
    }
  };

  // Metrics
  const now = new Date();
  const totalDeals = deals.length;
  const activeDeals = deals.filter((d) => d.isActive && (!d.validUntil || new Date(d.validUntil) > now)).length;
  const pausedDeals = deals.filter((d) => !d.isActive).length;
  const expiredDeals = deals.filter((d) => d.validUntil && new Date(d.validUntil) <= now).length;
  const activeRestStops = restStops.filter((rs) => rs.status === RestStopStatus.ACTIVE);

  return (
    <PublicLayout>
      <div className="bg-pitstop-bg min-h-screen pb-16">
        <MerchantNav />

        <Container className="py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-pitstop-muted mb-1">
                <span>Merchant Hub</span>
                <span>/</span>
                <span className="text-pitstop-charcoal">Promotional Offers</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-pitstop-charcoal tracking-tight">
                Rider Exclusive Deals
              </h1>
              <p className="text-sm text-pitstop-muted mt-1 max-w-2xl">
                Create and manage exclusive food, beverage, and service discounts for delivery riders visiting your rest stops.
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => setIsCreateOpen(true)}
              className="gap-2 shrink-0 font-bold shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Create Promotional Deal
            </Button>
          </div>

          {/* Feedback Toast */}
          {feedback && (
            <div
              className={`mb-6 rounded-xl border p-4 text-xs font-medium flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
                feedback.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-red-200 bg-red-50 text-red-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
              <button
                onClick={() => setFeedback(null)}
                className="text-pitstop-muted hover:text-pitstop-charcoal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Active Rest Stops Warning if none */}
          {!isLoading && restStops.length > 0 && activeRestStops.length === 0 && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Venues Pending Moderation Approval</strong>
                Promotional deals require an approved and active rest stop venue. Your rest stops are currently pending administrative review. Once approved, deals can be published immediately.
              </div>
            </div>
          )}

          {/* Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <Card className="p-4 bg-white border-pitstop-border">
              <div className="flex items-center justify-between text-pitstop-muted mb-1 text-xs">
                <span>Total Deals</span>
                <Tag className="h-3.5 w-3.5 text-pitstop-charcoal/60" />
              </div>
              <div className="text-2xl font-black text-pitstop-charcoal">
                {isLoading ? '—' : totalDeals}
              </div>
              <div className="text-[11px] text-pitstop-muted mt-0.5">Configured deals</div>
            </Card>

            <Card className="p-4 bg-white border-pitstop-border">
              <div className="flex items-center justify-between text-emerald-700 mb-1 text-xs">
                <span>Active Deals</span>
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-600">
                {isLoading ? '—' : activeDeals}
              </div>
              <div className="text-[11px] text-pitstop-muted mt-0.5">Live for verified riders</div>
            </Card>

            <Card className="p-4 bg-white border-pitstop-border">
              <div className="flex items-center justify-between text-amber-700 mb-1 text-xs">
                <span>Paused Deals</span>
                <Pause className="h-3.5 w-3.5 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-amber-600">
                {isLoading ? '—' : pausedDeals}
              </div>
              <div className="text-[11px] text-pitstop-muted mt-0.5">Temporarily inactive</div>
            </Card>

            <Card className="p-4 bg-white border-pitstop-border">
              <div className="flex items-center justify-between text-red-700 mb-1 text-xs">
                <span>Expired Deals</span>
                <Calendar className="h-3.5 w-3.5 text-red-600" />
              </div>
              <div className="text-2xl font-black text-red-600">
                {isLoading ? '—' : expiredDeals}
              </div>
              <div className="text-[11px] text-pitstop-muted mt-0.5">Past validity date</div>
            </Card>
          </div>

          {/* Filter Bar */}
          <Card className="p-4 mb-6 bg-white border-pitstop-border">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Status Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                {[
                  { id: 'all', label: 'All Deals' },
                  { id: 'active', label: 'Active' },
                  { id: 'inactive', label: 'Paused' },
                  { id: 'expired', label: 'Expired' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      statusFilter === tab.id
                        ? 'bg-pitstop-charcoal text-white'
                        : 'bg-pitstop-bg text-pitstop-muted hover:text-pitstop-charcoal hover:bg-pitstop-border/60'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Venue Selector & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                {restStops.length > 0 && (
                  <select
                    value={selectedRestStopId}
                    onChange={(e) => setSelectedRestStopId(e.target.value)}
                    className="h-9 px-3 rounded-xl border border-pitstop-border bg-pitstop-bg text-xs text-pitstop-charcoal font-medium focus:outline-none focus:ring-1 focus:ring-pitstop-yellow"
                  >
                    <option value="all">All Rest Stops</option>
                    {restStops.map((rs) => (
                      <option key={rs.id} value={rs.id}>
                        {rs.name}
                      </option>
                    ))}
                  </select>
                )}

                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-pitstop-muted" />
                  <input
                    type="text"
                    placeholder="Search deals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 pl-9 pr-8 rounded-xl border border-pitstop-border bg-pitstop-bg text-xs text-pitstop-charcoal placeholder:text-pitstop-muted focus:outline-none focus:ring-1 focus:ring-pitstop-yellow w-full sm:w-48"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-pitstop-muted hover:text-pitstop-charcoal"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadData}
                  disabled={isLoading}
                  className="gap-1.5 shrink-0"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </Card>

          {/* Deals Content Area */}
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <RefreshCw className="h-8 w-8 text-pitstop-yellow animate-spin mb-3" />
              <p className="text-sm font-semibold text-pitstop-charcoal">Loading promotional deals...</p>
              <p className="text-xs text-pitstop-muted">Fetching verified records from backend</p>
            </div>
          ) : error ? (
            <Card className="p-8 text-center border-red-200 bg-red-50/50">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-red-800">Error Loading Deals</h3>
              <p className="text-xs text-red-700 mt-1 max-w-md mx-auto mb-4">{error}</p>
              <Button variant="primary" size="sm" onClick={loadData}>
                Retry Loading
              </Button>
            </Card>
          ) : deals.length === 0 ? (
            <EmptyState
              title={
                searchQuery || statusFilter !== 'all' || selectedRestStopId !== 'all'
                  ? 'No deals match your search criteria'
                  : 'No promotional deals yet'
              }
              description={
                searchQuery || statusFilter !== 'all' || selectedRestStopId !== 'all'
                  ? 'Try clearing your search query or changing your status filter.'
                  : 'Create exclusive food, beverage, and service discounts for delivery riders visiting your rest stops.'
              }
              action={
                searchQuery || statusFilter !== 'all' || selectedRestStopId !== 'all' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setSelectedRestStopId('all');
                    }}
                  >
                    Reset Filters
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setIsCreateOpen(true)}
                    className="font-bold gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create Your First Deal
                  </Button>
                )
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {deals.map((deal) => {
                const isExpired = deal.validUntil && new Date(deal.validUntil) < now;
                const isLive = deal.isActive && !isExpired;

                return (
                  <Card
                    key={deal.id}
                    className="flex flex-col overflow-hidden bg-white border-pitstop-border hover:shadow-md transition-shadow"
                  >
                    <div className="p-5 flex-1 flex flex-col">
                      {/* Top Badges */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {deal.discountType === DealDiscountType.PERCENTAGE && (
                            <Badge variant="yellow" size="sm" className="font-extrabold gap-1">
                              <Percent className="h-3 w-3" />
                              {deal.discountPercentage}% OFF
                            </Badge>
                          )}
                          {deal.discountType === DealDiscountType.FIXED_PRICE && (
                            <Badge variant="yellow" size="sm" className="font-extrabold gap-1">
                              <IndianRupee className="h-3 w-3" />
                              ₹{deal.dealPrice} Deal
                            </Badge>
                          )}
                          {deal.discountType === DealDiscountType.FREE_ITEM && (
                            <Badge variant="yellow" size="sm" className="font-extrabold gap-1">
                              <Gift className="h-3 w-3" />
                              FREE ITEM
                            </Badge>
                          )}
                        </div>

                        {/* Status Badge */}
                        {isLive ? (
                          <Badge variant="success" size="sm" className="gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </Badge>
                        ) : isExpired ? (
                          <Badge variant="danger" size="sm">
                            Expired
                          </Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">
                            Paused
                          </Badge>
                        )}
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-base font-bold text-pitstop-charcoal line-clamp-2 mb-1.5">
                        {deal.title}
                      </h3>
                      <p className="text-xs text-pitstop-muted line-clamp-2 leading-relaxed mb-4">
                        {deal.description}
                      </p>

                      {/* Linked Rest Stop */}
                      <div className="mt-auto pt-3 border-t border-pitstop-border/60 space-y-2 text-xs text-pitstop-muted">
                        <div className="flex items-center gap-1.5 font-medium text-pitstop-charcoal">
                          <MapPin className="h-3.5 w-3.5 text-pitstop-yellow-dark shrink-0" />
                          <span className="truncate">{deal.restStopName || deal.restStopId}</span>
                        </div>

                        {deal.validHours && (
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Clock className="h-3.5 w-3.5 text-pitstop-muted shrink-0" />
                            <span>{deal.validHours}</span>
                          </div>
                        )}

                        {deal.validUntil && (
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Calendar className="h-3.5 w-3.5 text-pitstop-muted shrink-0" />
                            <span>Expires: {new Date(deal.validUntil).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="px-5 py-3 bg-pitstop-bg/60 border-t border-pitstop-border flex items-center justify-between gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(deal)}
                        disabled={togglingId === deal.id}
                        className="gap-1 text-xs"
                      >
                        {deal.isActive ? (
                          <>
                            <Pause className="h-3.5 w-3.5 text-amber-600" />
                            Pause Deal
                          </>
                        ) : (
                          <>
                            <Play className="h-3.5 w-3.5 text-emerald-600" />
                            Activate
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDealToEdit(deal)}
                        className="gap-1 text-xs"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </Container>
      </div>

      {/* Modals */}
      <CreateDealModal
        restStops={restStops}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(newDeal) => {
          setDeals((prev) => [newDeal, ...prev]);
          setFeedback({
            type: 'success',
            message: `Promotional deal "${newDeal.title}" created successfully!`,
          });
        }}
      />

      {dealToEdit && (
        <EditDealModal
          deal={dealToEdit}
          isOpen={true}
          onClose={() => setDealToEdit(null)}
          onUpdated={(updated) => {
            setDeals((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
            setFeedback({
              type: 'success',
              message: `Deal "${updated.title}" updated successfully!`,
            });
          }}
        />
      )}
    </PublicLayout>
  );
};
