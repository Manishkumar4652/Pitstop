'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Clock,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Keyboard,
  CameraOff,
} from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { verifyVenueCheckIn, CheckInApiError } from '@/lib/api/check-ins';
import { CheckInRiderResponse } from 'shared-types';

export interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Pre-selected rest stop ID (e.g. when opened from rest stop details page).
   * If omitted, extracted from scanned QR code payload if available.
   */
  restStopId?: string;
  restStopName?: string;
  onSuccess?: (checkIn: CheckInRiderResponse) => void;
}

type ScannerStatus =
  | 'idle'
  | 'requesting'
  | 'scanning'
  | 'verifying'
  | 'success'
  | 'cooldown'
  | 'error'
  | 'permission_denied'
  | 'camera_unavailable'
  | 'unsupported';

export function QrScannerModal({
  isOpen,
  onClose,
  restStopId: initialRestStopId,
  restStopName: initialRestStopName,
  onSuccess,
}: QrScannerModalProps) {
  const [status, setStatus] = useState<ScannerStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [verifiedCheckIn, setVerifiedCheckIn] = useState<CheckInRiderResponse | null>(null);
  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const [manualToken, setManualToken] = useState<string>('');
  const [manualRestStopId, setManualRestStopId] = useState<string>(initialRestStopId || '');

  const scannerRef = useRef<any>(null);
  const isProcessingRef = useRef<boolean>(false);
  const readerElementId = 'pitstop-qr-reader-viewport';

  // Synchronize manual input with initial prop if changed
  useEffect(() => {
    if (initialRestStopId) {
      setManualRestStopId(initialRestStopId);
    }
  }, [initialRestStopId]);

  // Clean stop and release camera hardware
  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch {
        // Ignore teardown race conditions
      } finally {
        scannerRef.current = null;
      }
    }
  }, []);

  // Handle modal close with full cleanup
  const handleModalClose = useCallback(() => {
    isProcessingRef.current = false;
    stopCamera();
    setStatus('idle');
    setErrorMessage('');
    setVerifiedCheckIn(null);
    onClose();
  }, [onClose, stopCamera]);

  // Listen for Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleModalClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleModalClose]);

  // Cleanup camera on component unmount
  useEffect(() => {
    return () => {
      isProcessingRef.current = false;
      stopCamera();
    };
  }, [stopCamera]);

  /**
   * Safely parse decoded QR text into target restStopId and qrCredential.
   * Supports raw tokens, JSON payloads, and pitstop verification URLs.
   */
  const parseScannedQrText = (decodedText: string): { targetRestStopId: string; qrCredential: string } | null => {
    const raw = decodedText.trim();
    if (!raw) return null;

    // 1. JSON payload: {"restStopId":"...","qrCredential":"..."}
    if (raw.startsWith('{') && raw.endsWith('}')) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.qrCredential) {
          return {
            targetRestStopId: parsed.restStopId || initialRestStopId || '',
            qrCredential: parsed.qrCredential.trim(),
          };
        }
      } catch {
        // Fall through to plain token
      }
    }

    // 2. URL payload: https://.../rest-stops/:id?token=...
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      try {
        const url = new URL(raw);
        const tokenFromQuery = url.searchParams.get('token') || url.searchParams.get('credential');
        if (tokenFromQuery) {
          return {
            targetRestStopId: initialRestStopId || url.searchParams.get('restStopId') || '',
            qrCredential: tokenFromQuery.trim(),
          };
        }
      } catch {
        // Fall through
      }
    }

    // 3. Raw standard token: <base64payload>.<signature>
    return {
      targetRestStopId: initialRestStopId || '',
      qrCredential: raw,
    };
  };

  /**
   * Submits parsed QR credential to server-side verification API.
   * Deduplicates scan attempts to prevent concurrent repeated requests.
   */
  const submitVerification = async (targetRestStopId: string, credential: string) => {
    if (!credential) {
      setStatus('error');
      setErrorMessage('No venue QR credential detected. Please scan a valid PitStop QR code.');
      return;
    }

    const restStopToUse = targetRestStopId || initialRestStopId || manualRestStopId;
    if (!restStopToUse) {
      setStatus('error');
      setErrorMessage('Please specify or select which rest stop you are visiting before verifying.');
      return;
    }

    setStatus('verifying');
    setErrorMessage('');

    try {
      const checkInResult = await verifyVenueCheckIn({
        restStopId: restStopToUse,
        qrCredential: credential,
      });

      setVerifiedCheckIn(checkInResult);
      setStatus('success');
      if (onSuccess) {
        onSuccess(checkInResult);
      }
    } catch (err: any) {
      if (err instanceof CheckInApiError) {
        if (err.statusCode === 409) {
          setStatus('cooldown');
          setErrorMessage(err.message);
        } else {
          setStatus('error');
          setErrorMessage(err.message);
        }
      } else {
        setStatus('error');
        setErrorMessage(err?.message || 'Check-in verification failed. Please try again.');
      }
    } finally {
      isProcessingRef.current = false;
    }
  };

  /**
   * Callback fired by html5-qrcode scanner when a barcode is detected.
   */
  const handleScanSuccess = async (decodedText: string) => {
    // Deduplication guard: ignore redundant scan callbacks while a request is active
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    // Immediately stop camera to release hardware and freeze viewport
    await stopCamera();

    const parsed = parseScannedQrText(decodedText);
    if (!parsed) {
      setStatus('error');
      setErrorMessage('Scanned code could not be decoded. Please scan a genuine PitStop venue QR code.');
      isProcessingRef.current = false;
      return;
    }

    await submitVerification(parsed.targetRestStopId, parsed.qrCredential);
  };

  /**
   * Initializes and starts browser camera stream using html5-qrcode.
   */
  const startCamera = async () => {
    if (typeof window === 'undefined') return;

    if (!navigator?.mediaDevices?.getUserMedia) {
      setStatus('unsupported');
      return;
    }

    setStatus('requesting');
    setErrorMessage('');
    isProcessingRef.current = false;

    try {
      // Dynamic import to prevent SSR/Node.js module resolution issues
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');

      // Teardown any prior instance before creating new one
      await stopCamera();

      const html5QrCode = new Html5Qrcode(readerElementId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      scannerRef.current = html5QrCode;

      const qrConfig = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: 'environment' }, // Prefer back-facing camera on mobile devices
        qrConfig,
        (decodedText: string) => {
          handleScanSuccess(decodedText);
        },
        () => {
          // Frame scan failures are continuous while searching for a QR code; intentionally silent
        }
      );

      setStatus('scanning');
    } catch (err: any) {
      const errStr = (err?.name || err?.message || String(err)).toLowerCase();

      if (errStr.includes('notallowederror') || errStr.includes('permission') || errStr.includes('denied')) {
        setStatus('permission_denied');
      } else if (errStr.includes('notfounderror') || errStr.includes('device') || errStr.includes('camera')) {
        setStatus('camera_unavailable');
      } else {
        setStatus('error');
        setErrorMessage(
          err?.message || 'Unable to start camera scanner. You can use manual token entry below.'
        );
      }
    }
  };

  /**
   * Handles manual fallback token submission.
   */
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;

    await stopCamera();
    await submitVerification(manualRestStopId, manualToken.trim());
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scanner-modal-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl border border-pitstop-border overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-pitstop-border bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pitstop-yellow text-pitstop-charcoal shrink-0 font-bold">
              <Camera className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="scanner-modal-title" className="text-base font-bold text-pitstop-charcoal">
                Scan Venue QR Code
              </h2>
              <p className="text-xs text-pitstop-muted line-clamp-1">
                {initialRestStopName ? `Check in at ${initialRestStopName}` : 'Verify physical arrival at rest stop'}
              </p>
            </div>
          </div>

          <button
            onClick={handleModalClose}
            className="rounded-lg p-1.5 text-pitstop-muted hover:text-pitstop-charcoal hover:bg-pitstop-bg transition-colors focus:outline-none focus:ring-2 focus:ring-pitstop-yellow"
            aria-label="Close scanner modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* STATE: SUCCESS */}
          {status === 'success' && verifiedCheckIn && (
            <div className="text-center py-6 space-y-4 animate-scale-up" role="status">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-2">
                <CheckCircle2 className="h-10 w-10" aria-hidden="true" />
              </div>
              <div>
                <Badge variant="success" size="md" icon={<ShieldCheck className="h-4 w-4" />}>
                  Check-In Verified
                </Badge>
                <h3 className="text-xl font-bold text-pitstop-charcoal mt-2">
                  {verifiedCheckIn.restStopName || initialRestStopName || 'Rest Stop'}
                </h3>
                <p className="text-xs text-pitstop-muted mt-1">
                  Verified at {new Date(verifiedCheckIn.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-left max-w-sm mx-auto space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  <span>Rider Perks Active!</span>
                </div>
                <p className="text-xs text-emerald-800">
                  Your rest time is verified. Show your rider profile at the counter to claim partner meal deals and enjoy free amenities.
                </p>
              </div>

              <div className="pt-2">
                <Button variant="primary" fullWidth onClick={handleModalClose}>
                  Done
                </Button>
              </div>
            </div>
          )}

          {/* STATE: COOLDOWN (HTTP 409) */}
          {status === 'cooldown' && (
            <div className="text-center py-6 space-y-4 animate-scale-up" role="alert">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700 mb-2">
                <Clock className="h-8 w-8" aria-hidden="true" />
              </div>
              <div>
                <Badge variant="warning" size="md">
                  Active Stay in Progress
                </Badge>
                <h3 className="text-lg font-bold text-pitstop-charcoal mt-2">
                  Check-In Already Recorded
                </h3>
                <p className="text-xs text-pitstop-muted mt-1.5 max-w-sm mx-auto leading-relaxed">
                  {errorMessage || 'A verified check-in for this rest stop was already recorded within the last 15 minutes.'}
                </p>
              </div>

              <div className="rounded-xl border border-pitstop-border bg-pitstop-bg p-3.5 text-xs text-pitstop-muted max-w-sm mx-auto">
                Each verified stay is valid for your current break. You do not need to scan again until your next shift break.
              </div>

              <div className="pt-2 flex gap-2">
                <Button variant="outline" fullWidth onClick={handleModalClose}>
                  Close
                </Button>
              </div>
            </div>
          )}

          {/* STATE: ERROR / INVALID QR (HTTP 400, etc.) */}
          {status === 'error' && (
            <div className="text-center py-5 space-y-4" role="alert">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertCircle className="h-8 w-8" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-base font-bold text-pitstop-charcoal">
                  Verification Failed
                </h3>
                <p className="text-xs text-red-600 mt-1 max-w-sm mx-auto leading-relaxed">
                  {errorMessage || 'The scanned QR code is invalid, expired, or does not belong to this venue.'}
                </p>
              </div>

              <div className="pt-2 flex gap-3 max-w-sm mx-auto">
                <Button variant="outline" fullWidth onClick={handleModalClose}>
                  Cancel
                </Button>
                <Button variant="primary" fullWidth onClick={startCamera} leftIcon={<RefreshCw className="h-4 w-4" />}>
                  Scan Again
                </Button>
              </div>
            </div>
          )}

          {/* STATE: PERMISSION DENIED */}
          {status === 'permission_denied' && (
            <div className="text-center py-6 space-y-4" role="alert">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <CameraOff className="h-8 w-8" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-base font-bold text-pitstop-charcoal">
                  Camera Permission Denied
                </h3>
                <p className="text-xs text-pitstop-muted mt-1.5 max-w-sm mx-auto leading-relaxed">
                  Your browser blocked camera access. Please allow camera permissions in your browser site settings, or use manual code entry.
                </p>
              </div>

              <div className="rounded-xl border border-pitstop-border bg-pitstop-bg p-3.5 text-xs text-pitstop-muted text-left max-w-sm mx-auto space-y-1">
                <p className="font-bold text-pitstop-charcoal">How to enable camera:</p>
                <p>1. Tap the lock/tune icon in your browser address bar.</p>
                <p>2. Set Camera permission to &quot;Allow&quot;.</p>
                <p>3. Tap &quot;Retry Camera&quot; below.</p>
              </div>

              <div className="pt-2 flex gap-2 max-w-sm mx-auto">
                <Button variant="outline" fullWidth onClick={handleModalClose}>
                  Cancel
                </Button>
                <Button variant="primary" fullWidth onClick={startCamera} leftIcon={<RefreshCw className="h-4 w-4" />}>
                  Retry Camera
                </Button>
              </div>
            </div>
          )}

          {/* STATE: CAMERA UNAVAILABLE OR UNSUPPORTED */}
          {(status === 'camera_unavailable' || status === 'unsupported') && (
            <div className="text-center py-6 space-y-4" role="alert">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
                <CameraOff className="h-8 w-8" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-base font-bold text-pitstop-charcoal">
                  {status === 'unsupported' ? 'Camera API Not Supported' : 'Camera Unavailable'}
                </h3>
                <p className="text-xs text-pitstop-muted mt-1.5 max-w-sm mx-auto leading-relaxed">
                  No compatible camera was detected on this device. You can verify your check-in using manual token entry below.
                </p>
              </div>

              <div className="pt-2 flex gap-2 max-w-sm mx-auto">
                <Button variant="outline" fullWidth onClick={handleModalClose}>
                  Cancel
                </Button>
                <Button variant="primary" fullWidth onClick={() => setShowManualInput(true)} leftIcon={<Keyboard className="h-4 w-4" />}>
                  Enter Code Manually
                </Button>
              </div>
            </div>
          )}

          {/* STATE: IDLE, REQUESTING, SCANNING, OR VERIFYING */}
          {(status === 'idle' || status === 'requesting' || status === 'scanning' || status === 'verifying') && (
            <div className="space-y-4">
              {/* Viewport Box */}
              <div className="relative aspect-square w-full max-w-[320px] mx-auto rounded-2xl overflow-hidden border-2 border-pitstop-border bg-pitstop-charcoal flex items-center justify-center shadow-subtle">
                {/* HTML5-QRCode Mount Node */}
                <div id={readerElementId} className="w-full h-full" />

                {/* IDLE Overlay with Start Camera CTA */}
                {status === 'idle' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-pitstop-charcoal/95 text-white">
                    <Camera className="h-12 w-12 text-pitstop-yellow mb-3 animate-pulse" />
                    <p className="text-sm font-bold">Ready to Scan</p>
                    <p className="text-xs text-white/70 mt-1 mb-4 max-w-[220px]">
                      Point your phone camera at the venue QR poster at the rest stop counter.
                    </p>
                    <Button variant="primary" size="md" onClick={startCamera} leftIcon={<Camera className="h-4 w-4" />}>
                      Start Camera Scanner
                    </Button>
                  </div>
                )}

                {/* REQUESTING PERMISSION Overlay */}
                {status === 'requesting' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-pitstop-charcoal/90 text-white">
                    <RefreshCw className="h-8 w-8 text-pitstop-yellow animate-spin mb-3" />
                    <p className="text-sm font-bold">Requesting Camera Access...</p>
                    <p className="text-xs text-white/70 mt-1 max-w-[220px]">
                      Please tap &quot;Allow&quot; on the browser prompt to start scanning.
                    </p>
                  </div>
                )}

                {/* SCANNING Overlay Reticle */}
                {status === 'scanning' && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                    <div className="relative w-48 h-48 border-2 border-pitstop-yellow rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-pitstop-yellow -mt-1 -ml-1 rounded-tl" />
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-pitstop-yellow -mt-1 -mr-1 rounded-tr" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-pitstop-yellow -mb-1 -ml-1 rounded-bl" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-pitstop-yellow -mb-1 -mr-1 rounded-br" />
                    </div>
                    <p className="text-[11px] font-semibold text-white/90 mt-4 bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
                      Align QR code inside frame
                    </p>
                  </div>
                )}

                {/* VERIFYING SPINNER Overlay */}
                {status === 'verifying' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-pitstop-charcoal/90 text-white">
                    <RefreshCw className="h-8 w-8 text-pitstop-yellow animate-spin mb-3" />
                    <p className="text-sm font-bold">Verifying Arrival...</p>
                    <p className="text-xs text-white/70 mt-1 max-w-[220px]">
                      Validating venue cryptographic signature with server.
                    </p>
                  </div>
                )}
              </div>

              {/* Camera Scanner Controls */}
              {status === 'scanning' && (
                <div className="text-center">
                  <Button variant="ghost" size="sm" onClick={stopCamera}>
                    Pause Scanner
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Secure Manual-Entry Fallback Accordion */}
          <div className="border-t border-pitstop-border pt-4">
            <button
              type="button"
              onClick={() => setShowManualInput(!showManualInput)}
              className="w-full flex items-center justify-between text-xs font-semibold text-pitstop-muted hover:text-pitstop-charcoal py-1 transition-colors"
              aria-expanded={showManualInput}
            >
              <span className="flex items-center gap-1.5">
                <Keyboard className="h-3.5 w-3.5" />
                <span>Can&apos;t scan? Enter Venue Token Manually</span>
              </span>
              <ChevronRight
                className={`h-4 w-4 transition-transform duration-200 ${showManualInput ? 'rotate-90' : ''}`}
              />
            </button>

            {showManualInput && (
              <form onSubmit={handleManualSubmit} className="mt-3 space-y-3 bg-pitstop-bg p-3.5 rounded-xl border border-pitstop-border">
                <div>
                  <label htmlFor="manual-token-input" className="block text-xs font-bold text-pitstop-charcoal mb-1">
                    Venue QR Credential Token
                  </label>
                  <input
                    id="manual-token-input"
                    type="text"
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    placeholder="Paste or enter venue QR credential string..."
                    className="w-full rounded-lg border border-pitstop-border bg-white px-3 py-2 text-xs text-pitstop-charcoal focus:outline-none focus:ring-2 focus:ring-pitstop-yellow font-mono"
                    required
                  />
                  <p className="text-[10px] text-pitstop-muted mt-1">
                    Enter the token string printed on the venue card or provided by the merchant counter desk.
                  </p>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={status === 'verifying' || !manualToken.trim()}
                    leftIcon={status === 'verifying' ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : undefined}
                  >
                    Verify Code
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-pitstop-border bg-pitstop-bg/50 flex justify-between items-center text-[11px] text-pitstop-muted">
          <span>Protected by PitStop Verification</span>
          <button
            type="button"
            onClick={handleModalClose}
            className="font-medium hover:underline text-pitstop-charcoal"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
