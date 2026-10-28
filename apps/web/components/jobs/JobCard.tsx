'use client';

import React from 'react';
import Link from 'next/link';
import { 
  PackageCheck, 
  Truck, 
  FileText, 
  Sparkle, 
  Store, 
  Layers, 
  MapPin, 
  Clock, 
  IndianRupee, 
  Users, 
  ArrowRight
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import { JobPublicResponse, JobCategory } from 'shared-types';
import { useLanguage } from '@/lib/i18n';

interface JobCardProps {
  job: JobPublicResponse;
  onViewDetails: (job: JobPublicResponse) => void;
  onApplyClick?: (job: JobPublicResponse) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onViewDetails,
}) => {
  const { isHindi } = useLanguage();

  const formatCategory = (cat: JobCategory) => {
    switch (cat) {
      case JobCategory.PARCEL_SORTING:
        return isHindi ? 'पार्सल सॉर्टिंग' : 'Parcel Sorting';
      case JobCategory.LOADING_UNLOADING:
        return isHindi ? 'लोडिंग व अनलोडिंग' : 'Loading & Unloading';
      case JobCategory.FLYER_DISTRIBUTION:
        return isHindi ? 'पर्चे वितरण' : 'Flyer Distribution';
      case JobCategory.CLEANING_PREP:
        return isHindi ? 'सफाई व तैयारी' : 'Cleaning & Prep';
      case JobCategory.STORE_ASSISTANT:
        return isHindi ? 'दुकान सहायक' : 'Store Assistant';
      case JobCategory.OTHER:
        return isHindi ? 'सामान्य कार्य' : 'General Task';
    }
  };

  const getCategoryIcon = (cat: JobCategory) => {
    switch (cat) {
      case JobCategory.PARCEL_SORTING:
        return <PackageCheck className="h-3.5 w-3.5 text-amber-700" aria-hidden="true" />;
      case JobCategory.LOADING_UNLOADING:
        return <Truck className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />;
      case JobCategory.FLYER_DISTRIBUTION:
        return <FileText className="h-3.5 w-3.5 text-purple-700" aria-hidden="true" />;
      case JobCategory.CLEANING_PREP:
        return <Sparkle className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />;
      case JobCategory.STORE_ASSISTANT:
        return <Store className="h-3.5 w-3.5 text-orange-700" aria-hidden="true" />;
      case JobCategory.OTHER:
        return <Layers className="h-3.5 w-3.5 text-slate-700" aria-hidden="true" />;
    }
  };

  const formatTimeSlot = (startIso: string, endIso: string) => {
    try {
      const s = new Date(startIso);
      const e = new Date(endIso);
      if (isNaN(s.getTime()) || isNaN(e.getTime())) return '';
      const timeOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
      const dateOpts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
      return `${s.toLocaleDateString(isHindi ? 'hi-IN' : 'en-IN', dateOpts)}, ${s.toLocaleTimeString('en-IN', timeOpts)} – ${e.toLocaleTimeString('en-IN', timeOpts)}`;
    } catch {
      return '';
    }
  };

  const formattedTime = formatTimeSlot(job.startTime, job.endTime);
  const remainingSlots = Math.max(0, job.requiredRiders - job.acceptedRidersCount);

  return (
    <Card className="p-5 sm:p-6 transition-all hover:border-pitstop-yellow/50 hover:shadow-card flex flex-col justify-between">
      <div className="space-y-3">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pitstop-bg border border-pitstop-border text-pitstop-charcoal">
            {getCategoryIcon(job.category)}
            <span>{formatCategory(job.category)}</span>
          </span>

          <Badge variant="success" size="sm">
            {isHindi ? 'राइडर्स के लिए खुला' : 'Open for Riders'}
          </Badge>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-base sm:text-lg font-bold text-pitstop-charcoal line-clamp-1">
            {job.title}
          </h3>
          <div className="mt-1 flex items-center gap-2 text-xs text-pitstop-muted flex-wrap">
            <span className="flex items-center gap-1 font-medium text-pitstop-charcoal">
              <MapPin className="h-3.5 w-3.5 text-pitstop-yellow-dark shrink-0" />
              <span>{job.restStopName || (isHindi ? 'पार्टनर रेस्ट स्टॉप' : 'Partner Rest Stop')}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-pitstop-muted shrink-0" />
              <span>{job.durationMinutes} {isHindi ? 'मिनट' : 'mins'}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <Users className="h-3.5 w-3.5 shrink-0" />
              <span>
                {isHindi
                  ? `${job.requiredRiders} में से ${remainingSlots} स्थान खाली`
                  : `${remainingSlots} of ${job.requiredRiders} ${remainingSlots === 1 ? 'slot' : 'slots'} open`}
              </span>
            </span>
          </div>
        </div>

        {/* Time Window */}
        {formattedTime && (
          <p className="text-xs text-pitstop-muted bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-pitstop-yellow-dark shrink-0" />
            <span>{isHindi ? 'शिफ्ट' : 'Shift'}: {formattedTime}</span>
          </p>
        )}

        {/* Short Description */}
        <p className="text-xs sm:text-sm text-pitstop-charcoal/80 line-clamp-2 leading-relaxed">
          {job.description}
        </p>
      </div>

      {/* Bottom Payout & Actions */}
      <div className="mt-5 pt-4 border-t border-pitstop-border flex items-center justify-between gap-3">
        <div>
          <div className="text-xl sm:text-2xl font-black text-pitstop-charcoal flex items-center gap-0.5">
            <IndianRupee className="h-4 sm:h-5 w-4 sm:w-5 text-pitstop-yellow-dark shrink-0" />
            <span>{job.payAmount}</span>
          </div>
          <span className="text-[11px] text-pitstop-muted capitalize block">
            {job.payType === 'hourly'
              ? (isHindi ? 'प्रति घंटा दर' : 'Per Hour Rate')
              : (isHindi ? 'निश्चित कार्य भुगतान' : 'Fixed Task Payout')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => onViewDetails(job)}
            rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
          >
            {isHindi ? 'देखें व आवेदन करें' : 'View & Apply'}
          </Button>
        </div>
      </div>
    </Card>
  );
};
