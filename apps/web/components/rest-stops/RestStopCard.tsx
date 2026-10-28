'use client';

import React from 'react';
import Link from 'next/link';
import { 
  MapPin, 
  Star, 
  Sparkles, 
  Store, 
  ChevronRight, 
  Users 
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { RestStopDisplayItem } from '@/lib/api/rest-stops';
import { FACILITY_METADATA } from './facility-config';
import { CapacityStatus } from 'shared-types';
import { useLanguage } from '@/lib/i18n';

export interface RestStopCardProps {
  stop: RestStopDisplayItem;
}

export const RestStopCard: React.FC<RestStopCardProps> = ({ stop }) => {
  const { isHindi } = useLanguage();

  const {
    slug,
    name,
    merchantName,
    venueType,
    address,
    facilities,
    rating,
    capacity,
    dealBadge,
    isDemoData,
  } = stop;

  // Capacity status badge helper
  const getCapacityBadge = (status: CapacityStatus, current: number, max: number) => {
    switch (status) {
      case CapacityStatus.AVAILABLE:
        return (
          <Badge variant="success" size="sm" icon={<Users className="h-3 w-3" />}>
            {isHindi ? `उपलब्ध (${current}/${max} स्थान)` : `Available (${current}/${max} spots)`}
          </Badge>
        );
      case CapacityStatus.BUSY:
        return (
          <Badge variant="warning" size="sm" icon={<Users className="h-3 w-3" />}>
            {isHindi ? `व्यस्त (${current}/${max} स्थान)` : `Busy (${current}/${max} spots)`}
          </Badge>
        );
      case CapacityStatus.FULL:
        return (
          <Badge variant="danger" size="sm" icon={<Users className="h-3 w-3" />}>
            {isHindi ? `पूर्ण (${current}/${max} स्थान)` : `Full (${current}/${max} spots)`}
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <article className="h-full flex flex-col" aria-labelledby={`stop-title-${stop.id}`}>
      <Card variant="interactive" className="flex flex-col justify-between h-full p-5 sm:p-6">
        <div>
          {/* Top Meta: Capacity Status & Rating */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {getCapacityBadge(capacity.status, capacity.currentOccupancy, capacity.maxRiders)}
              {isDemoData && (
                <span className="text-[10px] text-amber-800 font-semibold tracking-wider bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded uppercase">
                  {isHindi ? 'नमूना डेटा' : 'Sample Data'}
                </span>
              )}
            </div>

            {rating && rating.count > 0 ? (
              <div 
                className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200"
                aria-label={`Rating: ${rating.average.toFixed(1)} out of 5 stars (${rating.count} reviews${isDemoData ? ' - Demo data' : ''})`}
              >
                <Star className="h-3.5 w-3.5 fill-amber-500 stroke-amber-500" aria-hidden="true" />
                <span>{rating.average.toFixed(1)}</span>
                <span className="text-pitstop-muted font-normal">({rating.count})</span>
              </div>
            ) : (
              <span className="text-[11px] text-pitstop-muted bg-pitstop-bg border border-pitstop-border px-2 py-0.5 rounded-full">
                {isHindi ? 'नया वेन्यू' : 'New Venue'}
              </span>
            )}
          </div>

          {/* Rest Stop Title */}
          <h3 id={`stop-title-${stop.id}`} className="text-lg font-bold text-pitstop-charcoal tracking-tight break-words">
            <Link 
              href={`/rest-stops/${slug}`}
              className="hover:text-pitstop-yellow-dark focus:outline-none focus:underline"
            >
              {name}
            </Link>
          </h3>

          {/* Venue & Merchant Information */}
          <p className="mt-1 text-xs text-pitstop-muted flex items-center gap-1.5 break-words">
            <Store className="h-3.5 w-3.5 shrink-0 text-pitstop-muted" aria-hidden="true" />
            <span className="font-medium text-pitstop-charcoal">
              {merchantName || (isHindi ? 'रेस्ट स्टॉप पार्टनर' : 'Rest Stop Partner')}
            </span>
            {venueType && (
              <>
                <span className="text-pitstop-border">•</span>
                <span>{venueType}</span>
              </>
            )}
          </p>

          {/* Address / Area */}
          <p className="mt-1 text-xs text-pitstop-muted flex items-start gap-1.5 break-words">
            <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-pitstop-muted" aria-hidden="true" />
            <span>
              {address.area}, {address.city}
              {address.landmark ? ` (${address.landmark})` : ''}
            </span>
          </p>

          {/* Facility Amenities List */}
          <div className="mt-4">
            <div className="text-[11px] font-semibold text-pitstop-muted uppercase tracking-wider mb-1.5">
              {isHindi ? 'उपलब्ध सुविधाएं' : 'Available Facilities'}
            </div>
            <div className="flex flex-wrap gap-1.5" role="list" aria-label="Available amenities">
              {facilities.map((facilityKey) => {
                const meta = FACILITY_METADATA[facilityKey];
                if (!meta) return null;
                return (
                  <span
                    key={facilityKey}
                    role="listitem"
                    className="inline-flex items-center gap-1 text-[11px] font-medium bg-pitstop-bg border border-pitstop-border px-2 py-0.5 rounded text-pitstop-charcoal"
                    title={meta.description}
                  >
                    {meta.icon}
                    <span>{isHindi ? meta.labelHi : meta.label}</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Rider Deal Badge (if available) */}
          {dealBadge && (
            <div className="mt-4 rounded-lg bg-pitstop-yellow-light/70 border border-pitstop-yellow/30 p-2.5 text-xs text-pitstop-charcoal flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-pitstop-yellow-dark shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <span className="font-semibold text-pitstop-charcoal">{dealBadge}</span>
                <span className="block text-[11px] text-pitstop-muted mt-0.5">
                  {isHindi ? 'चेक-इन पर राइडर लाभ' : 'Rider perk on check-in'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Card Footer: Action Link */}
        <div className="mt-6 border-t border-pitstop-border pt-4 flex items-center justify-between gap-2">
          <span className="text-[11px] text-pitstop-muted">
            {isDemoData
              ? (isHindi ? 'नमूना स्थान' : 'Sample location')
              : (isHindi ? 'रेस्ट स्टॉप स्थान' : 'Rest stop location')}
          </span>
          <Link href={`/rest-stops/${slug}`}>
            <Button 
              variant="primary" 
              size="sm" 
              rightIcon={<ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}
              aria-label={`View details for ${name}`}
            >
              {isHindi ? 'विवरण देखें' : 'View Details'}
            </Button>
          </Link>
        </div>
      </Card>
    </article>
  );
};
