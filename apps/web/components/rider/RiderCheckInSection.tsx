'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  QrCode,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { Card, Badge, Button, EmptyState } from '@/components/ui';
import { QrScannerModal } from '@/components/rider/QrScannerModal';
import { fetchMyCheckIns, CheckInApiError } from '@/lib/api/check-ins';
import { CheckInRiderResponse, CheckinStatus } from 'shared-types';

export function RiderCheckInSection() {
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [checkIns, setCheckIns] = useState<CheckInRiderResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchMyCheckIns({ limit: 5 });
      setCheckIns(data.items || []);
    } catch (err: any) {
      if (err instanceof CheckInApiError && err.statusCode === 401) {
        // Unauthenticated session handled by server session redirect
        setCheckIns([]);
      } else {
        setError(err?.message || 'Unable to load recent check-ins.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleVerified = (newCheckIn: CheckInRiderResponse) => {
    setCheckIns((prev) => [newCheckIn, ...prev.filter((ci) => ci.id !== newCheckIn.id)]);
  };

  const renderStatusBadge = (status: CheckinStatus) => {
    switch (status) {
      case CheckinStatus.VERIFIED:
        return (
          <Badge variant="success" size="sm" icon={<CheckCircle2 className="h-3 w-3" />}>
            Verified Stay
          </Badge>
        );
      case CheckinStatus.PENDING:
        return (
          <Badge variant="warning" size="sm" icon={<Clock className="h-3 w-3" />}>
            Pending Desk
          </Badge>
        );
      case CheckinStatus.CANCELLED:
        return (
          <Badge variant="neutral" size="sm" icon={<XCircle className="h-3 w-3" />}>
            Cancelled
          </Badge>
        );
      case CheckinStatus.EXPIRED:
        return (
          <Badge variant="neutral" size="sm" icon={<Clock className="h-3 w-3" />}>
            Expired
          </Badge>
        );
      case CheckinStatus.REJECTED:
        return (
          <Badge variant="danger" size="sm">
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between border-b border-pitstop-border pb-3 mb-4">
          <div className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-pitstop-yellow-dark" aria-hidden="true" />
            <h3 className="text-sm font-bold text-pitstop-charcoal">
              Recent Check-In Activity
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="neutral" size="sm">
              {checkIns.length} {checkIns.length === 1 ? 'Visit' : 'Visits'}
            </Badge>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<QrCode className="h-3.5 w-3.5" />}
              onClick={() => setIsScannerOpen(true)}
            >
              Scan QR
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
            <RefreshCw className="h-6 w-6 text-pitstop-muted animate-spin" />
            <p className="text-xs text-pitstop-muted">Loading your check-ins...</p>
          </div>
        ) : error ? (
          <div className="py-6 text-center space-y-3">
            <AlertCircle className="h-6 w-6 text-red-500 mx-auto" />
            <p className="text-xs text-red-600 max-w-xs mx-auto">{error}</p>
            <Button variant="outline" size="sm" onClick={loadHistory} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
              Retry
            </Button>
          </div>
        ) : checkIns.length === 0 ? (
          <EmptyState
            title="No Check-In History"
            description="You haven't recorded any rest stop visits yet. Scan a venue QR code at any verified partner stop to log your break and unlock deals."
            icon={<QrCode className="h-6 w-6 text-pitstop-muted" aria-hidden="true" />}
            action={
              <Button
                variant="primary"
                size="sm"
                leftIcon={<QrCode className="h-3.5 w-3.5" />}
                onClick={() => setIsScannerOpen(true)}
              >
                Scan Venue QR Code
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {checkIns.map((ci) => {
              const checkInDate = new Date(ci.checkInTime);
              return (
                <div
                  key={ci.id}
                  className="rounded-xl border border-pitstop-border bg-white p-3 hover:border-pitstop-yellow transition-colors flex items-center justify-between gap-3 shadow-subtle"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-pitstop-charcoal">
                        {ci.restStopName || 'Partner Rest Stop'}
                      </span>
                      {renderStatusBadge(ci.status)}
                    </div>
                    <p className="text-[11px] text-pitstop-muted">
                      {checkInDate.toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      at{' '}
                      {checkInDate.toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  <Link href={`/explore?restStopId=${ci.restStopId}`}>
                    <Button variant="ghost" size="sm" aria-label={`View ${ci.restStopName || 'rest stop'}`}>
                      <ExternalLink className="h-3.5 w-3.5 text-pitstop-muted" />
                    </Button>
                  </Link>
                </div>
              );
            })}

            <div className="pt-2 text-center">
              <Button
                variant="outline"
                size="sm"
                fullWidth
                leftIcon={<QrCode className="h-3.5 w-3.5" />}
                onClick={() => setIsScannerOpen(true)}
              >
                Scan Another Rest Stop
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Global Venue QR Scanner Modal */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSuccess={handleVerified}
      />
    </>
  );
}
