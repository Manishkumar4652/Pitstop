'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  QrCode, 
  Printer, 
  RotateCw, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  Layers, 
  ShieldCheck, 
  Info,
  Building2,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import { RestStopMerchantResponse } from 'shared-types';
import { 
  fetchVenueQrCredential, 
  rotateVenueQrCredential, 
  VenueQrCredentialResponse 
} from '@/lib/api/merchant-rest-stops';

interface VenueQrModalProps {
  restStop: RestStopMerchantResponse;
  isOpen: boolean;
  onClose: () => void;
  onRestStopUpdated?: () => void;
}

export const VenueQrModal: React.FC<VenueQrModalProps> = ({
  restStop,
  isOpen,
  onClose,
  onRestStopUpdated,
}) => {
  const [credentialData, setCredentialData] = useState<VenueQrCredentialResponse | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Rotation confirmation state machine
  const [isConfirmingRotate, setIsConfirmingRotate] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [rotateSuccess, setRotateSuccess] = useState<string | null>(null);

  // Printable view toggle
  const [isPrintView, setIsPrintView] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCredentialData(null);
      setQrDataUrl(null);
      setIsLoading(true);
      setError(null);
      setIsConfirmingRotate(false);
      setIsRotating(false);
      setRotateSuccess(null);
      setIsPrintView(false);
      return;
    }

    let isMounted = true;

    async function loadCredential() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchVenueQrCredential(restStop.id);
        if (!isMounted) return;
        setCredentialData(data);

        // Generate high-resolution QR image data URL
        const dataUrl = await QRCode.toDataURL(data.qrCredential, {
          width: 320,
          margin: 2,
          color: {
            dark: '#202124',
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'H',
        });
        if (!isMounted) return;
        setQrDataUrl(dataUrl);
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message || 'Failed to load venue QR credential.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCredential();

    return () => {
      isMounted = false;
    };
  }, [isOpen, restStop.id]);

  const handleRotate = async () => {
    setIsRotating(true);
    setError(null);
    setRotateSuccess(null);
    try {
      const data = await rotateVenueQrCredential(restStop.id);
      setCredentialData(data);

      const dataUrl = await QRCode.toDataURL(data.qrCredential, {
        width: 320,
        margin: 2,
        color: {
          dark: '#202124',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      });
      setQrDataUrl(dataUrl);
      setIsConfirmingRotate(false);
      setRotateSuccess(
        `Credential successfully rotated to Version ${data.version}. All previously printed QR codes for this venue are now revoked.`
      );
      if (onRestStopUpdated) {
        onRestStopUpdated();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to rotate credential. Please try again.');
    } finally {
      setIsRotating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  const formattedAddress = [
    restStop.address.street,
    restStop.address.area,
    restStop.address.city,
    restStop.address.pincode,
  ].filter(Boolean).join(', ');

  const formattedExpiry = credentialData?.expiresAt
    ? new Date(credentialData.expiresAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-pitstop-charcoal/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="venue-qr-modal-title"
    >
      {/* Printable Poster Section (Optimized for CSS print media) */}
      <div className="hidden print:block fixed inset-0 bg-white p-8 z-9999 text-pitstop-charcoal font-sans">
        <div className="max-w-xl mx-auto border-4 border-pitstop-charcoal p-8 text-center rounded-2xl">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-pitstop-yellow flex items-center justify-center font-bold text-xl text-pitstop-charcoal">
              P
            </div>
            <span className="text-3xl font-extrabold tracking-tight">PitStop</span>
          </div>

          <p className="text-xs font-semibold uppercase tracking-widest text-pitstop-muted mb-6">
            Official Gig Worker Partner Rest Station
          </p>

          <h1 className="text-2xl font-bold text-pitstop-charcoal mb-2">
            {restStop.name}
          </h1>
          <p className="text-sm text-pitstop-muted mb-6">{formattedAddress}</p>

          <div className="my-6 flex justify-center">
            {qrDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={qrDataUrl} 
                alt={`PitStop Check-in QR for ${restStop.name}`} 
                className="w-64 h-64 border-2 border-pitstop-border rounded-xl p-2"
              />
            )}
          </div>

          <div className="bg-pitstop-bg border border-pitstop-border rounded-xl p-4 mb-6 text-left text-xs space-y-2">
            <p className="font-semibold text-pitstop-charcoal">
              📱 Instructions for Delivery Riders:
            </p>
            <ol className="list-decimal list-inside text-pitstop-muted space-y-1">
              <li>Open the <strong>PitStop App</strong> on your mobile device.</li>
              <li>Tap <strong>Check-In</strong> and point your camera at this QR code.</li>
              <li>Enjoy complimentary drinking water, seating, and phone charging while you rest.</li>
            </ol>
          </div>

          <div className="text-[10px] text-pitstop-muted border-t border-pitstop-border pt-4 flex justify-between items-center">
            <span>Credential Version {credentialData?.version || 1}</span>
            <span>Valid through {formattedExpiry}</span>
            <span>pitstop.app</span>
          </div>
        </div>
      </div>

      {/* Screen Interactive Modal Card */}
      <Card className="w-full max-w-lg bg-white shadow-lift border border-pitstop-border overflow-hidden my-8 print:hidden">
        {/* Header */}
        <div className="p-5 border-b border-pitstop-border flex items-center justify-between bg-pitstop-bg">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-pitstop-yellow text-pitstop-charcoal">
              <QrCode className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="venue-qr-modal-title" className="text-base font-bold text-pitstop-charcoal">
                Venue QR Credential
              </h2>
              <p className="text-xs text-pitstop-muted">
                {restStop.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-pitstop-muted hover:text-pitstop-charcoal hover:bg-white transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-pitstop-yellow border-t-transparent" />
              <p className="text-sm text-pitstop-muted font-medium">Generating cryptographic venue QR...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-xs flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Unable to load credential</p>
                <p>{error}</p>
                {restStop.status !== 'active' && (
                  <p className="text-pitstop-muted mt-2">
                    Note: QR credentials are only active for venues approved by administrators. Once approved, you can generate and print desk posters.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Success Notification on Rotate */}
              {rotateSuccess && (
                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="font-medium">{rotateSuccess}</p>
                </div>
              )}

              {/* QR Image Display */}
              <div className="flex flex-col items-center justify-center bg-pitstop-bg border border-pitstop-border rounded-2xl p-5">
                {qrDataUrl && (
                  <div className="bg-white p-3 rounded-xl shadow-subtle border border-pitstop-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={qrDataUrl} 
                      alt={`PitStop Check-in QR for ${restStop.name}`} 
                      className="w-56 h-56 sm:w-64 sm:h-64 object-contain"
                    />
                  </div>
                )}
                
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <Badge variant="neutral" size="sm" className="gap-1">
                    <Layers className="h-3 w-3" />
                    Version {credentialData?.version || 1}
                  </Badge>
                  {formattedExpiry && (
                    <Badge variant="neutral" size="sm" className="gap-1">
                      <Calendar className="h-3 w-3" />
                      Expires: {formattedExpiry}
                    </Badge>
                  )}
                  <Badge variant="success" size="sm" className="gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    HMAC Verified
                  </Badge>
                </div>
              </div>

              {/* Protocol Security Notice */}
              <div className="rounded-xl border border-pitstop-border bg-pitstop-bg p-3.5 text-xs text-pitstop-muted space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-pitstop-charcoal">
                  <Info className="h-4 w-4 text-pitstop-yellow-dark shrink-0" />
                  Physical Presence & Anti-Abuse Protocol
                </div>
                <p>
                  This QR code binds riders&apos; digital check-ins to this physical venue. A 15-minute anti-abuse cooldown prevents duplicate entries.
                </p>
                <p className="text-[11px] text-pitstop-muted/80">
                  <em>Note:</em> A reusable static printed QR does not guarantee physical presence if photographed or shared remotely. If you suspect an unauthorized photo has been taken of your desk poster, use <strong>Rotate Credential</strong> below to immediately revoke the old code.
                </p>
              </div>

              {/* Rotation Confirmation Warning */}
              {isConfirmingRotate && (
                <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-xs space-y-3">
                  <div className="flex items-start gap-2.5 text-amber-900 font-semibold">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p>Revoke current QR and issue new version?</p>
                      <p className="text-xs font-normal text-amber-800 mt-1">
                        All previously printed posters or saved images will immediately become invalid. Riders will receive an error until the new poster is displayed.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsConfirmingRotate(false)}
                      disabled={isRotating}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleRotate}
                      isLoading={isRotating}
                      leftIcon={<RotateCw className="h-3.5 w-3.5" />}
                    >
                      Confirm Rotation
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-pitstop-bg border-t border-pitstop-border flex flex-wrap items-center justify-between gap-3">
          <div>
            {!isConfirmingRotate && !isLoading && !error && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConfirmingRotate(true)}
                leftIcon={<RotateCw className="h-3.5 w-3.5" />}
              >
                Rotate Credential
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
            {qrDataUrl && !isLoading && (
              <Button
                variant="primary"
                size="sm"
                onClick={handlePrint}
                leftIcon={<Printer className="h-4 w-4" />}
              >
                Print Desk Poster
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
