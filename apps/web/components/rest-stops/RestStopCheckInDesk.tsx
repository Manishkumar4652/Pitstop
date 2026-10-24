'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { QrCode, CheckCircle2, ShieldCheck, Sparkles, UserCheck, Navigation } from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui';
import { useAuth } from '@/lib/auth/AuthContext';
import { QrScannerModal } from '@/components/rider/QrScannerModal';
import { CheckInRiderResponse, UserRole } from 'shared-types';

interface RestStopCheckInDeskProps {
  restStopId: string;
  restStopName: string;
  restStopSlug: string;
  coordinates?: [number, number];
}

export function RestStopCheckInDesk({
  restStopId,
  restStopName,
  restStopSlug,
  coordinates,
}: RestStopCheckInDeskProps) {
  const { user, isAuthenticated } = useAuth();
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [verifiedStay, setVerifiedStay] = useState<CheckInRiderResponse | null>(null);

  const isRider = isAuthenticated && user?.role === UserRole.RIDER;

  return (
    <>
      <Card className="p-6 border-pitstop-border bg-white shadow-subtle">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pitstop-yellow text-pitstop-charcoal shrink-0 font-bold">
              <QrCode className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-pitstop-charcoal">
                Rest-Stop Check-in Desk
              </h3>
              <p className="text-[11px] text-pitstop-muted">
                Physical arrival verification
              </p>
            </div>
          </div>
          {verifiedStay && (
            <Badge variant="success" size="sm" icon={<ShieldCheck className="h-3 w-3" />}>
              Active Stay
            </Badge>
          )}
        </div>

        {verifiedStay ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-2 animate-fade-in">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>You are checked in!</span>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Stay verified at {new Date(verifiedStay.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Show your active profile at the desk for partner food perks.
            </p>
            <div className="pt-1 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => setIsScannerOpen(true)}
              >
                Scan Again
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-pitstop-muted leading-relaxed mb-4">
              Scan the physical venue QR poster at this stop to verify rest hours, unlock exclusive meal deals, and build platform trust.
            </p>

            {isRider ? (
              <div className="space-y-2">
                <Button
                  variant="primary"
                  fullWidth
                  leftIcon={<QrCode className="h-4 w-4" aria-hidden="true" />}
                  onClick={() => setIsScannerOpen(true)}
                  aria-label={`Open QR scanner to check in at ${restStopName}`}
                >
                  Check In via Venue QR
                </Button>
                <p className="text-[11px] text-pitstop-muted text-center flex items-center justify-center gap-1">
                  <Sparkles className="h-3 w-3 text-pitstop-yellow-dark" />
                  <span>Unlocks partner discounts and logs safe break</span>
                </p>
              </div>
            ) : isAuthenticated ? (
              <div className="rounded-xl bg-pitstop-bg p-3.5 text-center text-xs text-pitstop-muted">
                <p className="font-semibold text-pitstop-charcoal">Rider Account Required</p>
                <p className="text-[11px] mt-1">
                  Only registered delivery partners can record check-in rest stops.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Link href={`/rider/login?returnUrl=/rest-stops/${restStopSlug}`}>
                  <Button
                    variant="primary"
                    fullWidth
                    leftIcon={<UserCheck className="h-4 w-4" aria-hidden="true" />}
                  >
                    Log In as Rider to Check In
                  </Button>
                </Link>
                <p className="text-[11px] text-pitstop-muted text-center">
                  Sign in with your mobile number to unlock verified rest stops.
                </p>
              </div>
            )}
          </>
        )}
      </Card>

      {/* QR Scanner Modal pre-scoped to this rest stop */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        restStopId={restStopId}
        restStopName={restStopName}
        onSuccess={(result) => {
          setVerifiedStay(result);
        }}
      />

      {/* Mobile Sticky Quick-Action Bar for Delivery Riders */}
      <aside 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-pitstop-border px-4 py-2.5 shadow-elevation flex items-center justify-between gap-3 pb-[max(10px,env(safe-area-inset-bottom))]"
        aria-label="Mobile rest stop quick actions"
      >
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-pitstop-charcoal truncate">
            {restStopName}
          </div>
          <div className="text-[11px] text-pitstop-muted flex items-center gap-1">
            {verifiedStay ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Checked In
              </span>
            ) : (
              <span>Physical Arrival Desk</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {coordinates && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${coordinates[1]},${coordinates[0]}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-pitstop-border bg-pitstop-bg text-pitstop-charcoal hover:bg-slate-200 transition-colors"
              aria-label="Get Directions in Google Maps"
            >
              <Navigation className="h-4 w-4 text-pitstop-yellow-dark" />
            </a>
          )}

          {isRider ? (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<QrCode className="h-4 w-4" />}
              onClick={() => setIsScannerOpen(true)}
              className="font-bold min-h-[42px] px-4"
            >
              {verifiedStay ? 'Scan Again' : 'Check In'}
            </Button>
          ) : isAuthenticated ? (
            <span className="text-[11px] text-pitstop-muted font-medium px-2 py-1 bg-slate-100 rounded-md">
              Rider Only
            </span>
          ) : (
            <Link href={`/rider/login?returnUrl=/rest-stops/${restStopSlug}`}>
              <Button variant="primary" size="sm" className="font-bold min-h-[42px] px-4">
                Log In
              </Button>
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
