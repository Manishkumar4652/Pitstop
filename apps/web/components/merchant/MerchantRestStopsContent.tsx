'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  MapPin, 
  Plus, 
  QrCode, 
  Edit3, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  RotateCw, 
  Info,
  ShieldCheck,
  Tag,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { 
  Container, 
  PageHeader, 
  Card, 
  Button, 
  Badge, 
  Input,
  EmptyState 
} from '@/components/ui';
import { 
  Facility, 
  CapacityStatus, 
  RestStopStatus, 
  UserPublicProfile, 
  RestStopMerchantResponse 
} from 'shared-types';
import { fetchMerchantRestStops } from '@/lib/api/merchant-rest-stops';
import { VenueQrModal } from './VenueQrModal';
import { EditRestStopModal } from './EditRestStopModal';

interface MerchantRestStopsContentProps {
  user: UserPublicProfile;
}

export const MerchantRestStopsContent: React.FC<MerchantRestStopsContentProps> = ({ user }) => {
  const [restStops, setRestStops] = useState<RestStopMerchantResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | RestStopStatus>('all');

  // Modal states
  const [selectedForQr, setSelectedForQr] = useState<RestStopMerchantResponse | null>(null);
  const [selectedForEdit, setSelectedForEdit] = useState<RestStopMerchantResponse | null>(null);

  const loadRestStops = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchMerchantRestStops({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchQuery.trim() || undefined,
      });
      setRestStops(data.items);
    } catch (err: any) {
      setError(err.message || 'Failed to load your rest stops.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    loadRestStops();
  }, [loadRestStops]);

  const handleRestStopUpdated = (updated: RestStopMerchantResponse) => {
    setRestStops((prev) =>
      prev.map((stop) => (stop.id === updated.id ? updated : stop))
    );
    if (selectedForQr && selectedForQr.id === updated.id) {
      setSelectedForQr(updated);
    }
  };

  const getStatusBadge = (status: RestStopStatus) => {
    switch (status) {
      case RestStopStatus.ACTIVE:
        return (
          <Badge variant="success" size="sm" className="gap-1 font-semibold">
            <CheckCircle2 className="h-3 w-3" />
            Live &amp; Active
          </Badge>
        );
      case RestStopStatus.PENDING_APPROVAL:
        return (
          <Badge variant="warning" size="sm" className="gap-1 font-semibold">
            <Clock className="h-3 w-3" />
            Pending Admin Approval
          </Badge>
        );
      case RestStopStatus.SUSPENDED:
        return (
          <Badge variant="danger" size="sm" className="gap-1 font-semibold">
            <AlertCircle className="h-3 w-3" />
            Suspended
          </Badge>
        );
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  const getCapacityBadge = (status: CapacityStatus) => {
    switch (status) {
      case CapacityStatus.AVAILABLE:
        return <Badge variant="success" size="sm">Available</Badge>;
      case CapacityStatus.BUSY:
        return <Badge variant="warning" size="sm">Busy</Badge>;
      case CapacityStatus.FULL:
        return <Badge variant="danger" size="sm">Full</Badge>;
      default:
        return null;
    }
  };

  const activeCount = restStops.filter((s) => s.status === RestStopStatus.ACTIVE).length;
  const pendingCount = restStops.filter((s) => s.status === RestStopStatus.PENDING_APPROVAL).length;

  return (
    <main id="main-content" className="pb-20 md:pb-12">
      <PageHeader
        title="My Rest Stops Overview"
        description="Manage your physical rest facilities, review amenity provisions, track administrative approval, and access venue QR check-in posters."
        badge="Merchant Station"
        backHref="/merchant"
        action={
          <Link href="/merchant/rest-stops/new">
            <Button variant="primary" size="md" leftIcon={<Plus className="h-4 w-4" />}>
              Add New Rest Stop
            </Button>
          </Link>
        }
      />

      <section className="py-6 sm:py-8" aria-label="Rest stop management list">
        <Container size="xl">
          {/* Top Metric & Info Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card className="p-4 bg-white border-pitstop-border shadow-subtle flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-pitstop-muted uppercase tracking-wider">
                  Total Listed Venues
                </p>
                <p className="text-2xl font-black text-pitstop-charcoal mt-1">
                  {restStops.length}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-pitstop-bg border border-pitstop-border flex items-center justify-center text-pitstop-charcoal">
                <Building2 className="h-5 w-5" />
              </div>
            </Card>

            <Card className="p-4 bg-white border-pitstop-border shadow-subtle flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-pitstop-muted uppercase tracking-wider">
                  Live on Public Discovery
                </p>
                <p className="text-2xl font-black text-emerald-700 mt-1">
                  {activeCount}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </Card>

            <Card className="p-4 bg-white border-pitstop-border shadow-subtle flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-pitstop-muted uppercase tracking-wider">
                  Pending Admin Verification
                </p>
                <p className="text-2xl font-black text-amber-700 mt-1">
                  {pendingCount}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <Clock className="h-5 w-5" />
              </div>
            </Card>
          </div>

          {/* Filter Bar */}
          <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-pitstop-border shadow-subtle">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === 'all'
                    ? 'bg-pitstop-yellow text-pitstop-charcoal shadow-xs'
                    : 'text-pitstop-muted hover:text-pitstop-charcoal hover:bg-pitstop-bg'
                }`}
              >
                All ({restStops.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter(RestStopStatus.ACTIVE)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === RestStopStatus.ACTIVE
                    ? 'bg-pitstop-yellow text-pitstop-charcoal shadow-xs'
                    : 'text-pitstop-muted hover:text-pitstop-charcoal hover:bg-pitstop-bg'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter(RestStopStatus.PENDING_APPROVAL)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === RestStopStatus.PENDING_APPROVAL
                    ? 'bg-pitstop-yellow text-pitstop-charcoal shadow-xs'
                    : 'text-pitstop-muted hover:text-pitstop-charcoal hover:bg-pitstop-bg'
                }`}
              >
                Pending Review
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter(RestStopStatus.SUSPENDED)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === RestStopStatus.SUSPENDED
                    ? 'bg-pitstop-yellow text-pitstop-charcoal shadow-xs'
                    : 'text-pitstop-muted hover:text-pitstop-charcoal hover:bg-pitstop-bg'
                }`}
              >
                Suspended
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-pitstop-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search venues..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-pitstop-border bg-pitstop-bg text-xs text-pitstop-charcoal placeholder:text-pitstop-muted focus:bg-white focus:border-pitstop-yellow focus:outline-hidden"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadRestStops}
                className="shrink-0 p-2"
                aria-label="Refresh venues"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* List Content */}
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-pitstop-yellow border-t-transparent mx-auto" />
              <p className="text-xs text-pitstop-muted font-medium">Loading your listed rest stops...</p>
            </div>
          ) : error ? (
            <div className="p-6 rounded-2xl border border-red-200 bg-red-50 text-red-800 text-xs text-center space-y-3 my-4">
              <AlertTriangle className="h-6 w-6 text-red-600 mx-auto" />
              <p className="font-semibold">{error}</p>
              <Button variant="outline" size="sm" onClick={loadRestStops} className="mx-auto">
                Retry Loading
              </Button>
            </div>
          ) : restStops.length === 0 ? (
            <EmptyState
              icon={<MapPin className="h-8 w-8 text-pitstop-muted" />}
              title={
                statusFilter !== 'all' || searchQuery
                  ? 'No matching venues found'
                  : 'No Rest Stops Registered Yet'
              }
              description={
                statusFilter !== 'all' || searchQuery
                  ? 'No venues matched your active status or search filter. Try clearing filters to see all registered venues.'
                  : `Your partner account currently has no registered rest stops. Register your physical venue to offer water, seating, and phone charging to delivery riders.`
              }
              action={
                statusFilter !== 'all' || searchQuery ? (
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => {
                      setStatusFilter('all');
                      setSearchQuery('');
                    }}
                  >
                    Reset All Filters
                  </Button>
                ) : (
                  <Link href="/merchant/rest-stops/new">
                    <Button variant="primary" size="md" leftIcon={<Plus className="h-4 w-4" />}>
                      Register Your First Rest Stop
                    </Button>
                  </Link>
                )
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {restStops.map((stop) => {
                const formattedAddress = [
                  stop.address.street,
                  stop.address.area,
                  stop.address.city,
                ].filter(Boolean).join(', ');

                const isActive = stop.status === RestStopStatus.ACTIVE;
                const isPending = stop.status === RestStopStatus.PENDING_APPROVAL;

                return (
                  <Card 
                    key={stop.id} 
                    className="p-5 bg-white border-pitstop-border shadow-subtle hover:shadow-card transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        {getStatusBadge(stop.status)}
                        {getCapacityBadge(stop.capacity.status)}
                      </div>

                      {/* Venue Title & Address */}
                      <h3 className="text-base font-bold text-pitstop-charcoal line-clamp-1 mb-1">
                        {stop.name}
                      </h3>
                      <p className="text-xs text-pitstop-muted flex items-start gap-1.5 mb-3 line-clamp-2">
                        <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-pitstop-muted" />
                        <span>{formattedAddress}</span>
                      </p>

                      <p className="text-xs text-pitstop-charcoal/80 line-clamp-2 mb-4 leading-relaxed">
                        {stop.description}
                      </p>

                      {/* Amenities pills */}
                      {(() => {
                        const safeFacilities = (stop.facilities || []).filter(
                          (f): f is Facility => Boolean(f) && typeof f === 'string'
                        );
                        return (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {safeFacilities.slice(0, 4).map((f) => (
                              <span 
                                key={f}
                                className="px-2 py-0.5 rounded-md bg-pitstop-bg border border-pitstop-border text-[11px] font-medium text-pitstop-muted capitalize"
                              >
                                {f.replace(/_/g, ' ')}
                              </span>
                            ))}
                            {safeFacilities.length > 4 && (
                              <span className="px-2 py-0.5 rounded-md bg-pitstop-bg border border-pitstop-border text-[11px] font-medium text-pitstop-muted">
                                +{safeFacilities.length - 4} more
                              </span>
                            )}
                          </div>
                        );
                      })()}

                      {/* Capacity & Timing info */}
                      <div className="text-[11px] text-pitstop-muted border-t border-pitstop-border pt-3 space-y-1 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" /> Capacity:
                          </span>
                          <span className="font-semibold text-pitstop-charcoal">
                            {stop.capacity.maxRiders} riders max
                          </span>
                        </div>
                        {stop.operatingHours?.[0] && (
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" /> Hours:
                            </span>
                            <span className="font-semibold text-pitstop-charcoal">
                              {stop.operatingHours[0].openTime} – {stop.operatingHours[0].closeTime}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Pending Notice callout */}
                      {isPending && (
                        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-800 flex items-start gap-2">
                          <Info className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                          <span>
                            Under review by PitStop moderation. Once approved, you can generate and print desk QR codes.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className="border-t border-pitstop-border pt-3 flex items-center justify-between gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedForEdit(stop)}
                        leftIcon={<Edit3 className="h-3.5 w-3.5" />}
                        className="text-xs"
                      >
                        Edit
                      </Button>

                      {isActive ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setSelectedForQr(stop)}
                          leftIcon={<QrCode className="h-3.5 w-3.5" />}
                          className="text-xs"
                        >
                          View QR &amp; Poster
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled
                          className="text-xs text-pitstop-muted cursor-not-allowed opacity-60"
                        >
                          QR Unavailable
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </Container>
      </section>

      {/* QR & Printable Poster Modal */}
      {selectedForQr && (
        <VenueQrModal
          restStop={selectedForQr}
          isOpen={Boolean(selectedForQr)}
          onClose={() => setSelectedForQr(null)}
          onRestStopUpdated={loadRestStops}
        />
      )}

      {/* Edit Details Modal */}
      {selectedForEdit && (
        <EditRestStopModal
          restStop={selectedForEdit}
          isOpen={Boolean(selectedForEdit)}
          onClose={() => setSelectedForEdit(null)}
          onUpdated={handleRestStopUpdated}
        />
      )}
    </main>
  );
};
