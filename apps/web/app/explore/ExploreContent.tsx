'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Filter,
  SlidersHorizontal,
  List,
  Map as MapIcon,
  RotateCcw,
  Check,
  MapPin,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import {
  Container,
  Card,
  Badge,
  Button,
  Select,
  EmptyState,
  PageHeader
} from '@/components/ui';
import { RestStopCard } from '@/components/rest-stops/RestStopCard';
import { RestStopMap } from '@/components/maps/RestStopMap';
import { FILTERABLE_FACILITY_LIST } from '@/components/rest-stops/facility-config';
import {
  RestStopDisplayItem,
  PublicRestStopsResult
} from '@/lib/api/rest-stops';
import { Facility, PaginationMeta } from 'shared-types';
import { useLanguage } from '@/lib/i18n';

type SortOption = 'newest' | 'rating' | 'name_asc' | 'oldest';
type ViewMode = 'list' | 'map';

interface ExploreContentProps {
  initialData?: PublicRestStopsResult | null;
  initialError?: string | null;
}

export function ExploreContent({ initialData, initialError }: ExploreContentProps) {
  const { isHindi } = useLanguage();
  const searchParams = useSearchParams();
  const facilityParam = searchParams.get('facility');
  const viewParam = searchParams.get('view');
  const restStopIdParam = searchParams.get('restStopId');

  const [items, setItems] = useState<RestStopDisplayItem[]>(initialData?.items || []);
  const [pagination, setPagination] = useState<PaginationMeta | null>(initialData?.pagination || null);
  const [isDemoFallback, setIsDemoFallback] = useState<boolean>(initialData?.isDemoFallback || false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError || null);

  const [selectedFacilities, setSelectedFacilities] = useState<Facility[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>(viewParam === 'list' ? 'list' : 'map');
  const [selectedStopId, setSelectedStopId] = useState<string | undefined>(restStopIdParam || undefined);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Guard to prevent redundant fetch on initial mount since SSR provided initialData
  const isFirstRender = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync facility query parameter from navigation
  useEffect(() => {
    if (facilityParam) {
      const matched = Object.values(Facility).find((f) => f === facilityParam);
      if (matched) {
        setSelectedFacilities((prev) => (prev.includes(matched) ? prev : [matched]));
        setPage(1);
      }
    }
  }, [facilityParam]);

  // Client-side query fetcher calling the internal /api/rest-stops route handler
  const loadRestStops = useCallback(
    async (targetPage: number, facilities: Facility[], sort: SortOption) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setError(null);

      const qs = new URLSearchParams();
      qs.set('page', String(targetPage));
      qs.set('limit', '12');

      if (facilities.length > 0) {
        qs.set('facilities', facilities.join(','));
      }
      qs.set('sort', sort);

      try {
        const res = await fetch(`/api/rest-stops?${qs.toString()}`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => null);
          throw new Error(errBody?.message || `Failed to fetch rest stops (Status ${res.status})`);
        }

        const body = await res.json();
        if (!body.success || !body.data) {
          throw new Error('Malformed response from rest-stops service.');
        }

        const data: PublicRestStopsResult = body.data;
        setItems(data.items || []);
        setPagination(data.pagination);
        setIsDemoFallback(Boolean(data.isDemoFallback));
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        setError(err.message || (isHindi ? 'रेस्ट स्टॉप्स सेवा से संपर्क नहीं हो पाया।' : 'Unable to communicate with the rest stops service.'));
      } finally {
        setIsLoading(false);
      }
    },
    [isHindi]
  );

  // Debounced filter watcher
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      loadRestStops(page, selectedFacilities, sortBy);
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedFacilities, sortBy, page, loadRestStops]);

  // Toggle single facility
  const toggleFacility = (facility: Facility) => {
    setSelectedFacilities((prev) =>
      prev.includes(facility) ? prev.filter((f) => f !== facility) : [...prev, facility]
    );
    setPage(1);
  };

  // Reset all filters
  const resetFilters = () => {
    setSelectedFacilities([]);
    setSortBy('newest');
    setPage(1);
  };

  // Pagination navigation
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasActiveFilters = selectedFacilities.length > 0;
  const totalCount = pagination?.total ?? items.length;
  const currentPage = pagination?.page ?? page;
  const totalPages = pagination?.totalPages ?? 1;

  const headerTitle = isHindi ? 'अपना अगला पिटस्टॉप खोजें' : 'Find your next pit stop';
  const headerDesc = isHindi
    ? 'बेंगलुरु में डिलीवरी पार्टनर्स के लिए समर्पित विश्राम स्थल खोजें—जहाँ मिले पीने का पानी, बैठने की जगह, फोन चार्जिंग और साफ वॉशरूम।'
    : 'Browse rest stop locations in Bengaluru designed for delivery partners to drink water, sit down, charge phones, and use restrooms between shifts.';
  const headerBadge = isDemoFallback
    ? (isHindi ? 'सैंपल कैटलॉग (ऑफलाइन मोड)' : 'Sample Catalog (Offline Mode)')
    : error
    ? (isHindi ? 'सर्विस ऑफलाइन' : 'Service Offline')
    : (isHindi ? 'रेस्ट स्टॉप कैटलॉग' : 'Rest Stop Catalog');

  return (
    <>
      {/* Dynamic Bilingual Header */}
      <PageHeader
        title={headerTitle}
        description={headerDesc}
        badge={headerBadge}
      />

      {/* Search & Filter Control Bar */}
      <section className="border-b border-pitstop-border bg-white py-6" aria-label="Search and filter controls">
        <Container size="xl">
          <div className="space-y-4">
            {/* Top Controls: Sort Dropdown + View Toggle (List vs Map) */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              {/* Sort Selector: Honest labels matching backend sorting options */}
              <div className="w-full sm:w-64">
                <Select
                  id="sort-select"
                  label={isHindi ? 'क्रमबद्ध करें' : 'Sort By'}
                  aria-label="Sort rest stops by criteria"
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as SortOption);
                    setPage(1);
                  }}
                  options={[
                    { label: isHindi ? 'नवीनतम जोड़े गए' : 'Newest Added', value: 'newest' },
                    { label: isHindi ? 'सर्वोच्च रेटिंग' : 'Highest Rated', value: 'rating' },
                    { label: isHindi ? 'नाम (A–Z)' : 'Name (A–Z)', value: 'name_asc' },
                    { label: isHindi ? 'पुराने पहले' : 'Oldest First', value: 'oldest' },
                  ]}
                />
              </div>

              {/* View Selector Controls: List vs Map */}
              <div className="w-full sm:w-auto flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-pitstop-charcoal">
                  {isHindi ? 'प्रदर्शन दृश्य' : 'Display View'}
                </span>
                <div
                  className="flex items-center rounded-lg border border-pitstop-border bg-pitstop-bg p-1 min-h-[44px]"
                  role="group"
                  aria-label="View layout switch"
                >
                  <button
                    type="button"
                    onClick={() => setViewMode('map')}
                    className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-1.5 text-xs font-semibold transition-all min-h-[36px] ${
                      viewMode === 'map'
                        ? 'bg-white text-pitstop-charcoal shadow-subtle'
                        : 'text-pitstop-muted hover:text-pitstop-charcoal'
                    }`}
                    aria-pressed={viewMode === 'map'}
                  >
                    <MapIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{isHindi ? 'मैप व्यू' : 'Map View'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-1.5 text-xs font-semibold transition-all min-h-[36px] ${
                      viewMode === 'list'
                        ? 'bg-white text-pitstop-charcoal shadow-subtle'
                        : 'text-pitstop-muted hover:text-pitstop-charcoal'
                    }`}
                    aria-pressed={viewMode === 'list'}
                  >
                    <List className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{isHindi ? 'लिस्ट व्यू' : 'List View'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Filter Toggle Button */}
            <div className="flex md:hidden items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<SlidersHorizontal className="h-4 w-4" />}
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                aria-expanded={showMobileFilters}
                aria-controls="facility-filters-panel"
              >
                {showMobileFilters
                  ? (isHindi ? 'सुविधा फ़िल्टर छिपाएं' : 'Hide Facility Filters')
                  : (isHindi ? 'सुविधाओं से फ़िल्टर करें' : 'Filter by Facilities')}
                {selectedFacilities.length > 0 && ` (${selectedFacilities.length})`}
              </Button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs text-pitstop-muted hover:text-pitstop-charcoal font-semibold inline-flex items-center gap-1 p-2 rounded focus:outline-none focus:ring-2 focus:ring-pitstop-yellow"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  {isHindi ? 'सभी रीसेट करें' : 'Reset all'}
                </button>
              )}
            </div>

            {/* Facility Multi-Select Filters Panel */}
            <div
              id="facility-filters-panel"
              className={`${showMobileFilters ? 'block' : 'hidden'} md:block border-t border-pitstop-border pt-4`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-pitstop-muted shrink-0" aria-hidden="true" />
                  <span className="text-xs font-bold uppercase tracking-wider text-pitstop-charcoal">
                    {isHindi ? 'सुविधाओं के अनुसार फ़िल्टर करें (एक से अधिक चुनें)' : 'Filter by Facility Amenities (Select multiple)'}
                  </span>
                </div>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="hidden md:inline-flex items-center gap-1 text-xs text-pitstop-muted hover:text-pitstop-charcoal font-semibold rounded px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-pitstop-yellow"
                  >
                    <RotateCcw className="h-3 w-3" aria-hidden="true" />
                    {isHindi ? 'सभी फ़िल्टर हटाएं' : 'Reset all filters'}
                  </button>
                )}
              </div>

              {/* Multi-select Facility Filter Pills */}
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="Filter rest stops by facilities"
              >
                {FILTERABLE_FACILITY_LIST.map(({ id, label, labelHi, icon }) => {
                  const isSelected = selectedFacilities.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleFacility(id)}
                      className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all min-h-[44px] active:scale-95 focus:outline-none focus:ring-2 focus:ring-pitstop-yellow ${isSelected
                          ? 'border-pitstop-yellow bg-pitstop-yellow-light text-pitstop-charcoal shadow-subtle ring-1 ring-pitstop-yellow/40'
                          : 'border-pitstop-border bg-white text-pitstop-charcoal hover:bg-pitstop-bg hover:border-pitstop-muted'
                        }`}
                      aria-pressed={isSelected}
                    >
                      <span className="inline-flex shrink-0">{icon}</span>
                      <span>{isHindi ? labelHi : label}</span>
                      {isSelected ? (
                        <Check className="h-3.5 w-3.5 text-pitstop-charcoal ml-0.5 stroke-[2.5]" aria-hidden="true" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Main Results Section */}
      <section className="py-8 sm:py-12" aria-label="Rest stop search results">
        <Container size="xl">
          {/* Visible Demo Fallback Notice when offline demo fallback is active */}
          {isDemoFallback && (
            <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 shadow-subtle flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-xs text-amber-900 space-y-1">
                <p className="font-bold">
                  {isHindi ? 'सैंपल कैटलॉग सक्रिय (ऑफलाइन डेवलपमेंट मोड)' : 'Sample Catalog Active (Offline Development Mode)'}
                </p>
                <p>
                  {isHindi
                    ? 'बैकएंड सेवा ऑफ़लाइन चल रही है। इंटरफ़ेस परीक्षण के लिए सांकेतिक रेस्ट स्टॉप्स दिखाए गए हैं।'
                    : 'The backend API service is unreachable or running in offline mode. Illustrative demo rest stops are shown for interface testing.'}
                </p>
              </div>
            </div>
          )}

          {/* Status & Summary Bar */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-pitstop-border bg-white p-4 shadow-subtle">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-pitstop-charcoal">
                {isLoading ? (
                  isHindi ? 'रेस्ट स्टॉप्स अपडेट हो रहे हैं...' : 'Updating rest stops...'
                ) : (
                  isHindi ? (
                    `${totalCount} में से ${items.length > 0 ? (currentPage - 1) * 12 + 1 : 0}–${Math.min(currentPage * 12, totalCount)} रेस्ट स्टॉप्स`
                  ) : (
                    `Showing ${items.length > 0 ? (currentPage - 1) * 12 + 1 : 0}–${Math.min(currentPage * 12, totalCount)} of ${totalCount} rest stops`
                  )
                )}
              </span>
              <span className="text-xs text-pitstop-muted">
                {isDemoFallback
                  ? (isHindi ? '(सैंपल कैटलॉग — बेंगलुरु)' : '(Sample Catalog — Bengaluru)')
                  : (isHindi ? '(सक्रिय रेस्ट स्टॉप्स)' : '(Active Rest Stops)')}
              </span>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-pitstop-muted">{isHindi ? 'सक्रिय:' : 'Active:'}</span>
                {selectedFacilities.map((fac) => (
                  <Badge key={fac} variant="yellow" size="sm">
                    {fac.replace('_', ' ')}
                  </Badge>
                ))}
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs text-pitstop-muted hover:text-red-600 underline ml-1 focus:outline-none focus:ring-2 focus:ring-pitstop-yellow rounded"
                >
                  {isHindi ? 'सभी हटाएं' : 'Clear all'}
                </button>
              </div>
            )}
          </div>

          {/* Content Rendering: Error vs List vs Map */}
          {error && !isDemoFallback ? (
            <Card className="p-8 border border-red-200 bg-red-50/50 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mb-3">
                <AlertTriangle className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-red-900">
                {isHindi ? 'रेस्ट स्टॉप्स लोड नहीं हो पाए' : 'Unable to Load Rest Stops'}
              </h3>
              <p className="mt-1 text-xs text-red-700 max-w-md mx-auto">
                {error}
              </p>
              <div className="mt-4">
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<RefreshCw className="h-4 w-4" />}
                  onClick={() => loadRestStops(page, selectedFacilities, sortBy)}
                >
                  {isHindi ? 'पुनः प्रयास करें' : 'Retry Request'}
                </Button>
              </div>
            </Card>
          ) : viewMode === 'list' ? (
            <>
              {items.length > 0 ? (
                <>
                  <div
                    className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch"
                    role="feed"
                    aria-busy={isLoading}
                    aria-label="Rest stop cards grid"
                  >
                    {items.map((stop) => (
                      <RestStopCard key={stop.id} stop={stop} />
                    ))}
                  </div>

                  {/* Server Pagination Controls */}
                  {totalPages > 1 && (
                    <nav
                      className="mt-8 flex items-center justify-between border-t border-pitstop-border bg-white p-4 rounded-xl shadow-subtle"
                      aria-label="Pagination Navigation"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<ChevronLeft className="h-4 w-4" />}
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1 || isLoading}
                        aria-label="Go to previous page"
                      >
                        {isHindi ? 'पिछला' : 'Previous'}
                      </Button>

                      <span className="text-xs font-semibold text-pitstop-charcoal">
                        {isHindi
                          ? `पृष्ठ ${currentPage} का ${totalPages}`
                          : `Page ${currentPage} of ${totalPages}`}
                      </span>

                      <Button
                        variant="outline"
                        size="sm"
                        rightIcon={<ChevronRight className="h-4 w-4" />}
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages || isLoading}
                        aria-label="Go to next page"
                      >
                        {isHindi ? 'अगला' : 'Next'}
                      </Button>
                    </nav>
                  )}
                </>
              ) : (
                <EmptyState
                  title={isHindi ? 'कोई रेस्ट स्टॉप नहीं मिला' : 'No Rest Stops Found'}
                  description={
                    isHindi
                      ? 'चुनी गई सुविधाओं से मेल खाने वाला कोई स्थान नहीं मिला। अधिक स्टॉप देखने के लिए कुछ फ़िल्टर हटाएं।'
                      : 'No rest stops match all selected facility amenities. Try removing some filters to see available stops.'
                  }
                  icon={<Filter className="h-7 w-7 text-pitstop-yellow-dark" />}
                  action={
                    <Button variant="primary" size="sm" onClick={resetFilters} leftIcon={<RotateCcw className="h-4 w-4" />}>
                      {isHindi ? 'सभी फ़िल्टर हटाएं' : 'Reset All Filters'}
                    </Button>
                  }
                />
              )}
            </>
          ) : (
            /* Live Interactive Google Map View + Rest Stops List */
            <div className="space-y-8">
              <RestStopMap
                stops={items}
                selectedStopId={selectedStopId}
                onSelectStop={(stop) => setSelectedStopId(stop.id)}
                height="600px"
                showLocateMe={true}
              />

              {/* Rest Stops List directly under the Map for easy browsing */}
              {items.length > 0 && (
                <div className="pt-6 border-t border-pitstop-border space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-pitstop-yellow-dark" />
                      <h3 className="text-base font-bold text-pitstop-charcoal">
                        {isHindi ? `आसपास के रेस्ट स्टॉप्स (${items.length})` : `Nearby Rest Stops (${items.length})`}
                      </h3>
                    </div>
                    <span className="text-xs text-pitstop-muted">
                      {isHindi
                        ? 'सुविधाएं और चेक-इन विकल्प देखने के लिए किसी भी कार्ड को चुनें'
                        : 'Select any rest stop card to see facilities and check-in options'}
                    </span>
                  </div>

                  <div
                    className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch"
                    role="feed"
                    aria-busy={isLoading}
                    aria-label="Rest stop cards grid"
                  >
                    {items.map((stop) => (
                      <RestStopCard key={stop.id} stop={stop} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <nav
                      className="mt-6 flex items-center justify-between border-t border-pitstop-border bg-white p-4 rounded-xl shadow-subtle"
                      aria-label="Pagination Navigation"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<ChevronLeft className="h-4 w-4" />}
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1 || isLoading}
                        aria-label="Go to previous page"
                      >
                        {isHindi ? 'पिछला' : 'Previous'}
                      </Button>

                      <span className="text-xs font-semibold text-pitstop-charcoal">
                        {isHindi
                          ? `पृष्ठ ${currentPage} का ${totalPages}`
                          : `Page ${currentPage} of ${totalPages}`}
                      </span>

                      <Button
                        variant="outline"
                        size="sm"
                        rightIcon={<ChevronRight className="h-4 w-4" />}
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages || isLoading}
                        aria-label="Go to next page"
                      >
                        {isHindi ? 'अगला' : 'Next'}
                      </Button>
                    </nav>
                  )}
                </div>
              )}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
