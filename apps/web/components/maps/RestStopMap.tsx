'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  GoogleMap, 
  useJsApiLoader, 
  MarkerF, 
  InfoWindowF 
} from '@react-google-maps/api';
import { 
  MapPin, 
  Navigation, 
  Crosshair, 
  ExternalLink, 
  Copy, 
  Check, 
  Key, 
  Maximize2, 
  Layers, 
  AlertCircle,
  Loader2,
  Clock,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { RestStopDisplayItem } from '@/lib/api/rest-stops';
import { Badge, Button, Card } from '@/components/ui';
import { CapacityStatus, Facility } from 'shared-types';
import { FACILITY_METADATA } from '@/components/rest-stops/facility-config';

// Libraries array memoized outside component to prevent re-instantiation
const LIBRARIES: ('places' | 'geometry')[] = [];

// Default map center: Jaipur Central
const DEFAULT_CENTER = {
  lat: 26.9124,
  lng: 75.7873,
};

// Subtle custom map styling adhering to PitStop design system
const PITSTOP_MAP_STYLES: google.maps.MapTypeStyle[] = [
  {
    featureType: 'administrative',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#374151' }],
  },
  {
    featureType: 'landscape',
    elementType: 'all',
    stylers: [{ color: '#f8fafc' }],
  },
  {
    featureType: 'poi',
    elementType: 'all',
    stylers: [{ visibility: 'simplified' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry.fill',
    stylers: [{ color: '#e2f2e9' }],
  },
  {
    featureType: 'road',
    elementType: 'all',
    stylers: [{ saturation: -40 }, { lightness: 20 }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.fill',
    stylers: [{ color: '#fde68a' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry.fill',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'water',
    elementType: 'all',
    stylers: [{ color: '#dbeafe' }],
  },
];

// Helper to create PitStop brand SVG marker icon for Google Maps
function getCustomMarkerIcon(isSelected: boolean) {
  const primaryColor = isSelected ? '#D97706' : '#F7B928'; // PitStop Yellow / Amber
  const strokeColor = '#202124'; // PitStop Charcoal

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="38" height="46" viewBox="0 0 38 46" fill="none">
      <path d="M19 0C8.50659 0 0 8.50659 0 19C0 30.2 16.5 44.5 17.5 45.4C18.3 46.1 19.7 46.1 20.5 45.4C21.5 44.5 38 30.2 38 19C38 8.50659 29.4934 0 19 0Z" fill="${primaryColor}" stroke="${strokeColor}" stroke-width="2"/>
      <circle cx="19" cy="18" r="9" fill="${strokeColor}"/>
      <circle cx="19" cy="18" r="4.5" fill="#FFFFFF"/>
    </svg>
  `;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: { width: 38, height: 46 } as google.maps.Size,
    anchor: { x: 19, y: 46 } as google.maps.Point,
  };
}

// User location marker icon (GPS Pulsing Blue Pin)
const USER_LOCATION_ICON = {
  path: 0, // google.maps.SymbolPath.CIRCLE
  scale: 8,
  fillColor: '#2563EB',
  fillOpacity: 1,
  strokeColor: '#FFFFFF',
  strokeWeight: 3,
};

export interface RestStopMapProps {
  stops: RestStopDisplayItem[];
  selectedStopId?: string;
  onSelectStop?: (stop: RestStopDisplayItem) => void;
  height?: string;
  interactive?: boolean;
  showLocateMe?: boolean;
  initialZoom?: number;
  center?: { lat: number; lng: number };
  className?: string;
}

export function RestStopMap({
  stops,
  selectedStopId,
  onSelectStop,
  height = '560px',
  interactive = true,
  showLocateMe = true,
  initialZoom = 13,
  center,
  className = '',
}: RestStopMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '';

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'pitstop-google-maps-script',
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [activeStop, setActiveStop] = useState<RestStopDisplayItem | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [effectiveHeight, setEffectiveHeight] = useState<string>(height);

  // Dynamic responsive height: cap height gracefully on small viewports
  useEffect(() => {
    const updateDimensions = () => {
      if (typeof window !== 'undefined') {
        if (window.innerWidth < 640) {
          // On mobile phones, cap height to 380px or 60vh
          setEffectiveHeight('380px');
        } else {
          setEffectiveHeight(height);
        }
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [height]);

  // Sync selectedStopId prop with activeStop
  useEffect(() => {
    if (selectedStopId) {
      const found = stops.find((s) => s.id === selectedStopId);
      if (found) {
        setActiveStop(found);
      }
    }
  }, [selectedStopId, stops]);

  // Compute map center
  const computedCenter = useMemo(() => {
    if (center) return center;
    if (stops.length === 1 && stops[0].location?.coordinates) {
      return {
        lat: stops[0].location.coordinates[1],
        lng: stops[0].location.coordinates[0],
      };
    }
    if (stops.length > 0) {
      const avgLat = stops.reduce((acc, s) => acc + (s.location?.coordinates?.[1] || 0), 0) / stops.length;
      const avgLng = stops.reduce((acc, s) => acc + (s.location?.coordinates?.[0] || 0), 0) / stops.length;
      if (avgLat && avgLng) return { lat: avgLat, lng: avgLng };
    }
    return DEFAULT_CENTER;
  }, [center, stops]);

  // Map onLoad callback
  const onLoad = useCallback(
    (mapInstance: google.maps.Map) => {
      setMap(mapInstance);

      if (stops.length > 1 && window.google?.maps) {
        const bounds = new window.google.maps.LatLngBounds();
        stops.forEach((stop) => {
          if (stop.location?.coordinates) {
            bounds.extend({
              lat: stop.location.coordinates[1],
              lng: stop.location.coordinates[0],
            });
          }
        });
        mapInstance.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
      }
    },
    [stops]
  );

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Fit all stops in view
  const fitAllStops = useCallback(() => {
    if (!map || !window.google?.maps || stops.length === 0) return;
    const bounds = new window.google.maps.LatLngBounds();
    stops.forEach((stop) => {
      if (stop.location?.coordinates) {
        bounds.extend({
          lat: stop.location.coordinates[1],
          lng: stop.location.coordinates[0],
        });
      }
    });
    if (userLocation) {
      bounds.extend(userLocation);
    }
    map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
  }, [map, stops, userLocation]);

  // Rider "Locate Me" GPS action
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      setLocateError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocateError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(coords);
        setIsLocating(false);

        if (map) {
          map.panTo(coords);
          map.setZoom(15);
        }
      },
      (err) => {
        setIsLocating(false);
        setLocateError(err.message || 'Unable to retrieve your current location.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [map]);

  const handleCopyEnvSnippet = () => {
    navigator.clipboard.writeText('NEXT_PUBLIC_GOOGLE_MAPS_KEY=');
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // 1. Fallback State: API Key Not Yet Configured in .env.local
  if (!apiKey || apiKey.trim() === '') {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Setup Notification Card */}
        <div className="rounded-2xl border-2 border-pitstop-yellow/30 bg-pitstop-yellow-light/20 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pitstop-yellow text-pitstop-charcoal shadow-sm">
                <Key className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-base font-bold text-pitstop-charcoal">
                  Google Maps API Key Setup Ready
                </h3>
                <p className="mt-1 text-xs text-pitstop-muted leading-relaxed max-w-xl">
                  Humne <code className="px-1.5 py-0.5 rounded bg-white font-mono text-pitstop-charcoal border border-pitstop-border">apps/web/.env.local</code> create kar di hai. Apni Google Maps API key paste karein aur Next.js server restart karein to view live map tiles.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyEnvSnippet}
              leftIcon={copiedKey ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            >
              {copiedKey ? 'Copied key name!' : 'Copy Config Variable'}
            </Button>
          </div>

          <div className="mt-4 rounded-xl bg-pitstop-charcoal p-3.5 text-xs text-white font-mono flex items-center justify-between overflow-x-auto">
            <span>NEXT_PUBLIC_GOOGLE_MAPS_KEY=YOUR_API_KEY_HERE</span>
            <span className="text-pitstop-muted text-[11px] ml-4 shrink-0">File: apps/web/.env.local</span>
          </div>
        </div>

        {/* Offline Venue Geo-Card Table Fallback */}
        <div className="rounded-2xl border border-pitstop-border bg-white p-6 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-pitstop-yellow-dark" />
              <h4 className="text-sm font-bold text-pitstop-charcoal">
                Active Rest Stops Coordinates ({stops.length} Venues)
              </h4>
            </div>
            <span className="text-xs text-pitstop-muted">
              Live Directions Links Available Below
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stops.map((stop) => {
              const [lng, lat] = stop.location?.coordinates || [77.5946, 12.9716];
              const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

              return (
                <div
                  key={stop.id}
                  className="rounded-xl border border-pitstop-border bg-pitstop-bg/40 p-4 flex flex-col justify-between hover:border-pitstop-yellow transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="text-sm font-bold text-pitstop-charcoal leading-snug">
                        {stop.name}
                      </h5>
                      <Badge
                        variant={
                          stop.capacity.status === CapacityStatus.AVAILABLE
                            ? 'success'
                            : stop.capacity.status === CapacityStatus.BUSY
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {stop.capacity.status}
                      </Badge>
                    </div>

                    <p className="mt-1 text-xs text-pitstop-muted">
                      {stop.address.area}, {stop.address.city}
                    </p>

                    <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-mono text-pitstop-muted bg-white px-2 py-1 rounded border border-pitstop-border">
                      <Navigation className="h-3 w-3 text-pitstop-yellow-dark shrink-0" />
                      <span>{lat.toFixed(4)}° N, {lng.toFixed(4)}° E</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-pitstop-border/60 flex items-center justify-between gap-2">
                    <Link
                      href={`/rest-stops/${stop.slug}`}
                      className="text-xs font-semibold text-pitstop-charcoal hover:underline"
                    >
                      View Details →
                    </Link>
                    <a
                      href={directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-pitstop-yellow-dark hover:underline"
                    >
                      <span>Directions</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 2. Error Loading Google Maps Script
  if (loadError) {
    return (
      <Card className={`p-8 border border-red-200 bg-red-50/50 text-center ${className}`}>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mb-3">
          <AlertCircle className="h-6 w-6" aria-hidden="true" />
        </div>
        <h3 className="text-base font-bold text-red-900">
          Failed to Load Google Maps
        </h3>
        <p className="mt-1 text-xs text-red-700 max-w-md mx-auto">
          {loadError.message || 'Google Maps API script could not be downloaded. Please verify your API key and network connection.'}
        </p>
      </Card>
    );
  }

  // 3. Loading Skeleton State
  if (!isLoaded) {
    return (
      <div 
        style={{ height: effectiveHeight }}
        className={`w-full rounded-2xl border border-pitstop-border bg-slate-100 flex flex-col items-center justify-center relative overflow-hidden animate-pulse ${className}`}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-pitstop-yellow animate-spin" />
          <p className="text-xs font-bold text-pitstop-charcoal">
            Initializing PitStop Map Canvas...
          </p>
          <span className="text-[11px] text-pitstop-muted">
            Plotting {stops.length} rest stop venues
          </span>
        </div>
      </div>
    );
  }

  // 4. Live Interactive Google Map
  return (
    <div className={`relative w-full rounded-2xl border border-pitstop-border overflow-hidden shadow-subtle ${className}`}>
      {/* Floating Toolbar Controls */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex flex-wrap items-center gap-1.5 sm:gap-2 max-w-[calc(100%-24px)]">
        {showLocateMe && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLocateMe}
            disabled={isLocating}
            className="bg-white/95 backdrop-blur-sm shadow-md hover:bg-white text-xs font-bold min-h-[38px] active:scale-95"
            leftIcon={
              isLocating ? (
                <Loader2 className="h-3.5 w-3.5 text-blue-600 animate-spin" />
              ) : (
                <Crosshair className="h-3.5 w-3.5 text-blue-600" />
              )
            }
          >
            {isLocating ? 'Locating...' : 'Locate Me'}
          </Button>
        )}

        {stops.length > 1 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fitAllStops}
            className="bg-white/95 backdrop-blur-sm shadow-md hover:bg-white text-xs font-bold min-h-[38px] active:scale-95"
            leftIcon={<Maximize2 className="h-3.5 w-3.5 text-pitstop-charcoal" />}
          >
            View All ({stops.length})
          </Button>
        )}

        {locateError && (
          <span className="bg-red-50 border border-red-200 text-red-700 text-[11px] px-2 py-1 rounded shadow">
            {locateError}
          </span>
        )}
      </div>

      {/* Google Map Container */}
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: effectiveHeight }}
        center={computedCenter}
        zoom={initialZoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          styles: PITSTOP_MAP_STYLES,
          disableDefaultUI: !interactive,
          zoomControl: interactive,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: interactive,
          gestureHandling: interactive ? 'cooperative' : 'none',
        }}
      >
        {/* Rider GPS Marker */}
        {userLocation && (
          <MarkerF
            position={userLocation}
            icon={USER_LOCATION_ICON}
            title="Your Current Location"
          />
        )}

        {/* Rest Stop Markers */}
        {stops.map((stop) => {
          if (!stop.location?.coordinates) return null;
          const pos = {
            lat: stop.location.coordinates[1],
            lng: stop.location.coordinates[0],
          };
          const isSelected = activeStop?.id === stop.id;

          return (
            <MarkerF
              key={stop.id}
              position={pos}
              icon={getCustomMarkerIcon(isSelected)}
              title={stop.name}
              onClick={() => {
                setActiveStop(stop);
                if (onSelectStop) onSelectStop(stop);
              }}
            />
          );
        })}

        {/* InfoWindow for Selected / Clicked Rest Stop */}
        {activeStop && activeStop.location?.coordinates && (
          <InfoWindowF
            position={{
              lat: activeStop.location.coordinates[1],
              lng: activeStop.location.coordinates[0],
            }}
            onCloseClick={() => setActiveStop(null)}
          >
            <div className="max-w-[280px] p-1 font-sans text-pitstop-charcoal">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-extrabold text-pitstop-charcoal leading-snug">
                  {activeStop.name}
                </h4>
                <Badge
                  variant={
                    activeStop.capacity.status === CapacityStatus.AVAILABLE
                      ? 'success'
                      : activeStop.capacity.status === CapacityStatus.BUSY
                      ? 'warning'
                      : 'danger'
                  }
                  size="sm"
                >
                  {activeStop.capacity.status}
                </Badge>
              </div>

              <p className="mt-1 text-xs text-pitstop-muted">
                {activeStop.address.area}, {activeStop.address.city}
              </p>

              {/* Amenity Icons Row */}
              <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                {activeStop.facilities.slice(0, 4).map((f) => {
                  const meta = FACILITY_METADATA[f];
                  if (!meta) return null;
                  return (
                    <span
                      key={f}
                      title={meta.label}
                      className="inline-flex items-center justify-center p-1 rounded-md bg-pitstop-bg border border-pitstop-border"
                    >
                      {meta.icon}
                    </span>
                  );
                })}
                {activeStop.facilities.length > 4 && (
                  <span className="text-[10px] text-pitstop-muted font-bold">
                    +{activeStop.facilities.length - 4} more
                  </span>
                )}
              </div>

              {/* Capacity info */}
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-pitstop-muted border-t border-pitstop-border/60 pt-2">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Occupancy: {activeStop.capacity.currentOccupancy}/{activeStop.capacity.maxRiders}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="mt-3 pt-2 border-t border-pitstop-border/60 flex items-center gap-2">
                <Link
                  href={`/rest-stops/${activeStop.slug}`}
                  className="flex-1 text-center text-xs font-bold bg-pitstop-yellow text-pitstop-charcoal py-1.5 px-2.5 rounded-lg hover:bg-pitstop-yellow-dark transition-colors"
                >
                  View Details
                </Link>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${activeStop.location.coordinates[1]},${activeStop.location.coordinates[0]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center text-xs font-bold text-pitstop-charcoal bg-pitstop-bg hover:bg-pitstop-border/80 border border-pitstop-border py-1.5 px-2.5 rounded-lg transition-colors"
                  title="Open directions in Google Maps"
                >
                  <Navigation className="h-3.5 w-3.5 mr-1 text-pitstop-yellow-dark" />
                  Directions
                </a>
              </div>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>
    </div>
  );
}
