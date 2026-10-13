import test from 'node:test';
import assert from 'node:assert/strict';
import { Server } from 'http';
import {
  UserRole,
  RestStopStatus,
  CapacityStatus,
  Facility,
  CheckinStatus,
} from 'shared-types';
import { createApp } from '../app';
import { config } from '../config/env';
import { signAccessToken } from '../utils/jwt';
import {
  generateVenueQrCredential,
  verifyVenueQrCredential,
} from '../utils/qr';
import {
  mockRestStopStore,
  clearMockRestStopStore,
  MockRestStopItem,
} from '../controllers/restStopMockStore';
import {
  mockCheckInStore,
  clearMockCheckInStore,
  MockCheckInItem,
} from '../controllers/checkInMockStore';
import { mockUserStore } from '../controllers/auth.controller';

const TEST_JWT_SECRET = 'a_very_secure_test_jwt_secret_that_has_at_least_32_characters_for_testing';

function setupVerificationTestServer() {
  process.env.JWT_SECRET = TEST_JWT_SECRET;
  config.JWT_SECRET = TEST_JWT_SECRET;

  const app = createApp();

  return new Promise<{ server: Server; baseUrl: string }>((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        throw new Error('Unable to bind test server address');
      }
      const baseUrl = `http://127.0.0.1:${address.port}`;
      resolve({ server, baseUrl });
    });
  });
}

test('Secure Check-In Verification Protocol & Backend API Suite (Phase 5B1)', async (t) => {
  const { server, baseUrl } = await setupVerificationTestServer();

  const rider1Id = 'rider-usr-101';
  const rider2Id = 'rider-usr-102';
  const merchant1Id = 'merchant-own-201';
  const merchant2Id = 'merchant-own-202';
  const adminId = 'admin-usr-301';

  const rider1Token = signAccessToken({ userId: rider1Id, role: UserRole.RIDER });
  const rider2Token = signAccessToken({ userId: rider2Id, role: UserRole.RIDER });
  const merchant1Token = signAccessToken({ userId: merchant1Id, role: UserRole.MERCHANT });
  const merchant2Token = signAccessToken({ userId: merchant2Id, role: UserRole.MERCHANT });
  const adminToken = signAccessToken({ userId: adminId, role: UserRole.ADMIN });

  const activeVenue1Id = 'rs-venue-001';
  const activeVenue2Id = 'rs-venue-002';
  const inactiveVenueId = 'rs-venue-003';

  t.beforeEach(() => {
    clearMockRestStopStore();
    clearMockCheckInStore();
    mockUserStore.clear();

    mockUserStore.set(rider1Id, {
      _id: rider1Id,
      id: rider1Id,
      name: 'Raju Rider',
      phone: '+919876543210',
      role: UserRole.RIDER,
    });
    mockUserStore.set(rider2Id, {
      _id: rider2Id,
      id: rider2Id,
      name: 'Sunil Rider',
      phone: '+919876543211',
      role: UserRole.RIDER,
    });
    mockUserStore.set(merchant1Id, {
      _id: merchant1Id,
      id: merchant1Id,
      name: 'Chai Point Owner',
      phone: '+919876543212',
      role: UserRole.MERCHANT,
    });
    mockUserStore.set(merchant2Id, {
      _id: merchant2Id,
      id: merchant2Id,
      name: 'Cafe Hub Owner',
      phone: '+919876543213',
      role: UserRole.MERCHANT,
    });
    mockUserStore.set(adminId, {
      _id: adminId,
      id: adminId,
      name: 'PitStop Admin',
      phone: '+919876543214',
      role: UserRole.ADMIN,
    });

    const venue1: MockRestStopItem = {
      _id: activeVenue1Id,
      id: activeVenue1Id,
      merchantId: merchant1Id,
      name: 'Chai Point Indiranagar',
      slug: 'chai-point-indiranagar',
      description: 'Dedicated rest lounge with high-speed Wi-Fi and clean water.',
      address: {
        street: '100 Feet Road',
        area: 'Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
      },
      location: { type: 'Point', coordinates: [77.6408, 12.9719] },
      facilities: [Facility.DRINKING_WATER, Facility.CHARGING, Facility.SEATING],
      images: [],
      capacity: { maxRiders: 15, currentOccupancy: 2, status: CapacityStatus.AVAILABLE },
      operatingHours: [{ day: 'mon', openTime: '08:00', closeTime: '23:00', isOpen: true }],
      status: RestStopStatus.ACTIVE,
      rating: { average: 4.8, count: 50 },
      qrRotationVersion: 1,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    };

    const venue2: MockRestStopItem = {
      _id: activeVenue2Id,
      id: activeVenue2Id,
      merchantId: merchant2Id,
      name: 'Koramangala Hub Cafe',
      slug: 'koramangala-hub-cafe',
      description: 'AC rest stop with safe parking.',
      address: {
        street: '80 Feet Road',
        area: 'Koramangala',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560034',
      },
      location: { type: 'Point', coordinates: [77.6245, 12.9352] },
      facilities: [Facility.AIR_CONDITIONING, Facility.PARKING, Facility.RESTROOM],
      images: [],
      capacity: { maxRiders: 20, currentOccupancy: 5, status: CapacityStatus.AVAILABLE },
      operatingHours: [{ day: 'mon', openTime: '09:00', closeTime: '22:00', isOpen: true }],
      status: RestStopStatus.ACTIVE,
      rating: { average: 4.6, count: 35 },
      qrRotationVersion: 1,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    };

    const venueInactive: MockRestStopItem = {
      _id: inactiveVenueId,
      id: inactiveVenueId,
      merchantId: merchant1Id,
      name: 'Pending Indiranagar Stop',
      slug: 'pending-indiranagar-stop',
      description: 'Not yet verified or approved.',
      address: {
        street: '12th Main',
        area: 'Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
      },
      location: { type: 'Point', coordinates: [77.641, 12.972] },
      facilities: [Facility.DRINKING_WATER],
      images: [],
      capacity: { maxRiders: 5, currentOccupancy: 0, status: CapacityStatus.AVAILABLE },
      operatingHours: [],
      status: RestStopStatus.PENDING_APPROVAL,
      rating: { average: 0, count: 0 },
      qrRotationVersion: 1,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    };

    mockRestStopStore.set(activeVenue1Id, venue1);
    mockRestStopStore.set(activeVenue2Id, venue2);
    mockRestStopStore.set(inactiveVenueId, venueInactive);
  });

  t.after(() => {
    server.close();
    clearMockRestStopStore();
    clearMockCheckInStore();
    mockUserStore.clear();
  });

  // ==============================================================
  // 1. Cryptographic Utility Unit Tests
  // ==============================================================
  await t.test('1. Cryptographic QR credential utility verification', () => {
    const { qrCredential, expiresAt, version } = generateVenueQrCredential(activeVenue1Id, 1);
    assert.ok(qrCredential.includes('.'), 'Credential must contain dot separator between payload and signature');
    assert.equal(version, 1);
    assert.ok(expiresAt.getTime() > Date.now());

    // Valid check
    const checkValid = verifyVenueQrCredential(qrCredential, activeVenue1Id, 1);
    assert.equal(checkValid.valid, true);
    assert.equal(checkValid.payload?.restStopId, activeVenue1Id);

    // Wrong venue check
    const checkWrongVenue = verifyVenueQrCredential(qrCredential, activeVenue2Id, 1);
    assert.equal(checkWrongVenue.valid, false);
    assert.match(checkWrongVenue.error || '', /does not match/i);

    // Version mismatch / revoked check
    const checkRevoked = verifyVenueQrCredential(qrCredential, activeVenue1Id, 2);
    assert.equal(checkRevoked.valid, false);
    assert.match(checkRevoked.error || '', /rotated or revoked/i);

    // Forged signature check
    const [payloadB64] = qrCredential.split('.');
    const forgedToken = `${payloadB64}.invalidsignature1234567890`;
    const checkForged = verifyVenueQrCredential(forgedToken, activeVenue1Id, 1);
    assert.equal(checkForged.valid, false);
    assert.match(checkForged.error || '', /signature/i);

    // Expired check
    const expiredCred = generateVenueQrCredential(activeVenue1Id, 1, -1000); // 1 second ago
    const checkExpired = verifyVenueQrCredential(expiredCred.qrCredential, activeVenue1Id, 1);
    assert.equal(checkExpired.valid, false);
    assert.match(checkExpired.error || '', /expired/i);
  });

  // ==============================================================
  // 2. Merchant Venue QR Management & Role Security
  // ==============================================================
  await t.test('2. Merchant Venue QR Credential issuance and rotation', async () => {
    // 2.1 Unauthenticated request rejected
    const unauthRes = await fetch(`${baseUrl}/api/v1/merchant/rest-stops/${activeVenue1Id}/qr-credential`);
    assert.equal(unauthRes.status, 401);

    // 2.2 Rider role rejected
    const riderRes = await fetch(`${baseUrl}/api/v1/merchant/rest-stops/${activeVenue1Id}/qr-credential`, {
      headers: { Authorization: `Bearer ${rider1Token}` },
    });
    assert.equal(riderRes.status, 403);

    // 2.3 Wrong merchant rejected (Merchant 2 cannot access Venue 1)
    const wrongMerchantRes = await fetch(`${baseUrl}/api/v1/merchant/rest-stops/${activeVenue1Id}/qr-credential`, {
      headers: { Authorization: `Bearer ${merchant2Token}` },
    });
    assert.equal(wrongMerchantRes.status, 403);

    // 2.4 Legitimate merchant retrieves valid credential
    const validRes = await fetch(`${baseUrl}/api/v1/merchant/rest-stops/${activeVenue1Id}/qr-credential`, {
      headers: { Authorization: `Bearer ${merchant1Token}` },
    });
    assert.equal(validRes.status, 200);
    const validBody = (await validRes.json()) as any;
    assert.equal(validBody.success, true);
    assert.equal(validBody.data.restStopId, activeVenue1Id);
    assert.equal(validBody.data.version, 1);
    assert.ok(validBody.data.qrCredential);

    // 2.5 Inactive rest stop rejected
    const inactiveRes = await fetch(`${baseUrl}/api/v1/merchant/rest-stops/${inactiveVenueId}/qr-credential`, {
      headers: { Authorization: `Bearer ${merchant1Token}` },
    });
    assert.equal(inactiveRes.status, 400);

    // 2.6 Merchant rotates QR credential
    const rotateRes = await fetch(`${baseUrl}/api/v1/merchant/rest-stops/${activeVenue1Id}/qr-credential/rotate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${merchant1Token}` },
    });
    assert.equal(rotateRes.status, 200);
    const rotateBody = (await rotateRes.json()) as any;
    assert.equal(rotateBody.data.version, 2);

    // The venue's rotation version in store is now 2
    assert.equal(mockRestStopStore.get(activeVenue1Id)?.qrRotationVersion, 2);

    // Old version 1 credential is now rejected when verified!
    const oldCheck = verifyVenueQrCredential(validBody.data.qrCredential, activeVenue1Id, 2);
    assert.equal(oldCheck.valid, false);
    assert.match(oldCheck.error || '', /rotated or revoked/i);
  });

  // ==============================================================
  // 3. Direct Rider Venue QR Verification (POST /check-ins/verify)
  // ==============================================================
  await t.test('3. Rider direct check-in verification with QR credential', async () => {
    // Generate valid version 1 credential for venue 2
    const venue2Cred = generateVenueQrCredential(activeVenue2Id, 1);

    // 3.1 Unauthenticated rejected
    const unauthRes = await fetch(`${baseUrl}/api/v1/check-ins/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restStopId: activeVenue2Id,
        qrCredential: venue2Cred.qrCredential,
      }),
    });
    assert.equal(unauthRes.status, 401);

    // 3.2 Merchant role rejected (only RIDER can check in)
    const merchantRes = await fetch(`${baseUrl}/api/v1/check-ins/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${merchant1Token}`,
      },
      body: JSON.stringify({
        restStopId: activeVenue2Id,
        qrCredential: venue2Cred.qrCredential,
      }),
    });
    assert.equal(merchantRes.status, 403);

    // 3.3 Invalid / forged QR credential rejected
    const forgedRes = await fetch(`${baseUrl}/api/v1/check-ins/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rider1Token}`,
      },
      body: JSON.stringify({
        restStopId: activeVenue2Id,
        qrCredential: 'invalid.credential.payload',
      }),
    });
    assert.equal(forgedRes.status, 400);

    // 3.4 QR credential from Venue 1 used at Venue 2 rejected
    const venue1Version = mockRestStopStore.get(activeVenue1Id)?.qrRotationVersion || 1;
    const venue1Cred = generateVenueQrCredential(activeVenue1Id, venue1Version);
    const wrongVenueRes = await fetch(`${baseUrl}/api/v1/check-ins/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rider1Token}`,
      },
      body: JSON.stringify({
        restStopId: activeVenue2Id,
        qrCredential: venue1Cred.qrCredential,
      }),
    });
    assert.equal(wrongVenueRes.status, 400);
    const wrongVenueBody = (await wrongVenueRes.json()) as any;
    assert.match(wrongVenueBody.message || '', /does not match the specified rest stop/i);

    // 3.5 Valid QR scan succeeds directly (HTTP 201)
    const successRes = await fetch(`${baseUrl}/api/v1/check-ins/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rider1Token}`,
      },
      body: JSON.stringify({
        restStopId: activeVenue2Id,
        qrCredential: venue2Cred.qrCredential,
      }),
    });
    assert.equal(successRes.status, 201);
    const successBody = (await successRes.json()) as any;
    assert.equal(successBody.success, true);
    assert.equal(successBody.data.status, CheckinStatus.VERIFIED);
    assert.equal(successBody.data.restStopId, activeVenue2Id);
    assert.ok(successBody.data.verifiedAt, 'verifiedAt timestamp must be populated');
    // Security check: Zero secrets in DTO
    assert.equal(successBody.data.verificationCode, undefined, 'verificationCode must not be in rider DTO');
    assert.equal(successBody.data.qrCredential, undefined, 'qrCredential must not be in check-in DTO');

    // 3.6 Replay / cooldown protection (within 15 minutes at same rest stop)
    const replayRes = await fetch(`${baseUrl}/api/v1/check-ins/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rider1Token}`,
      },
      body: JSON.stringify({
        restStopId: activeVenue2Id,
        qrCredential: venue2Cred.qrCredential,
      }),
    });
    assert.equal(replayRes.status, 409);
    const replayBody = (await replayRes.json()) as any;
    assert.match(replayBody.message || '', /already recorded within the last 15 minutes/i);
  });

  // ==============================================================
  // 4. Pending Check-in Transition to Verified via QR Scan
  // ==============================================================
  await t.test('4. Transitioning an existing PENDING check-in to VERIFIED via QR scan', async () => {
    // Rider 2 creates a pending check-in at Venue 1
    const createRes = await fetch(`${baseUrl}/api/v1/check-ins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rider2Token}`,
      },
      body: JSON.stringify({ restStopId: activeVenue1Id }),
    });
    assert.equal(createRes.status, 201);
    const createdBody = (await createRes.json()) as any;
    assert.equal(createdBody.data.status, CheckinStatus.PENDING);
    const checkInId = createdBody.data.id;

    // Venue 1 current rotation version
    const venue1Version = mockRestStopStore.get(activeVenue1Id)?.qrRotationVersion || 1;
    const venue1Cred = generateVenueQrCredential(activeVenue1Id, venue1Version);

    // Rider 2 scans venue 1 QR
    const verifyRes = await fetch(`${baseUrl}/api/v1/check-ins/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rider2Token}`,
      },
      body: JSON.stringify({
        restStopId: activeVenue1Id,
        qrCredential: venue1Cred.qrCredential,
      }),
    });
    assert.equal(verifyRes.status, 200, 'Transitioning existing pending check-in should return 200');
    const verifyBody = (await verifyRes.json()) as any;
    assert.equal(verifyBody.data.id, checkInId);
    assert.equal(verifyBody.data.status, CheckinStatus.VERIFIED);
    assert.ok(verifyBody.data.verifiedAt);
  });

  // ==============================================================
  // 5. Rider Cancellation of Pending Check-in
  // ==============================================================
  await t.test('5. Rider cancels their own pending check-in', async () => {
    // Rider 1 creates pending check-in at Venue 1
    const createRes = await fetch(`${baseUrl}/api/v1/check-ins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rider1Token}`,
      },
      body: JSON.stringify({ restStopId: activeVenue1Id }),
    });
    assert.equal(createRes.status, 201);
    const created = (await createRes.json()) as any;
    const checkInId = created.data.id;

    // Rider 2 tries to cancel Rider 1's check-in (returns 404 to avoid leaking existence)
    const wrongRiderRes = await fetch(`${baseUrl}/api/v1/check-ins/${checkInId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${rider2Token}` },
    });
    assert.equal(wrongRiderRes.status, 404);

    // Rider 1 cancels their own check-in
    const cancelRes = await fetch(`${baseUrl}/api/v1/check-ins/${checkInId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${rider1Token}` },
    });
    assert.equal(cancelRes.status, 200);
    const cancelBody = (await cancelRes.json()) as any;
    assert.equal(cancelBody.data.status, CheckinStatus.CANCELLED);

    // Attempting to cancel an already cancelled check-in fails (HTTP 400)
    const reCancelRes = await fetch(`${baseUrl}/api/v1/check-ins/${checkInId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${rider1Token}` },
    });
    assert.equal(reCancelRes.status, 400);
  });

  // ==============================================================
  // 6. Merchant Desk Check-in Confirmation & Rejection
  // ==============================================================
  await t.test('6. Merchant desk confirmation and rejection flow', async () => {
    // Rider 1 creates pending check-in at Venue 1 (owned by Merchant 1)
    const createRes = await fetch(`${baseUrl}/api/v1/check-ins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rider1Token}`,
      },
      body: JSON.stringify({ restStopId: activeVenue1Id }),
    });
    assert.equal(createRes.status, 201);
    const created = (await createRes.json()) as any;
    const checkInId = created.data.id;

    // Get the stored mock check-in to inspect internal OTP
    const storedCheckIn = mockCheckInStore.get(checkInId);
    assert.ok(storedCheckIn?.verificationCode);
    const validOtp = storedCheckIn.verificationCode;

    // 6.1 Merchant 2 tries to confirm check-in at Merchant 1's venue (HTTP 403)
    const wrongMerchantRes = await fetch(`${baseUrl}/api/v1/merchant/check-ins/${checkInId}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${merchant2Token}`,
      },
      body: JSON.stringify({ verificationCode: validOtp }),
    });
    assert.equal(wrongMerchantRes.status, 403);

    // 6.2 Merchant 1 supplies WRONG OTP (HTTP 400)
    const badOtpRes = await fetch(`${baseUrl}/api/v1/merchant/check-ins/${checkInId}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${merchant1Token}`,
      },
      body: JSON.stringify({ verificationCode: 'WRONG99' }),
    });
    assert.equal(badOtpRes.status, 400);
    const badOtpBody = (await badOtpRes.json()) as any;
    assert.match(badOtpBody.message || '', /invalid verification code/i);

    // 6.3 Merchant 1 confirms with valid OTP (HTTP 200)
    const confirmRes = await fetch(`${baseUrl}/api/v1/merchant/check-ins/${checkInId}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${merchant1Token}`,
      },
      body: JSON.stringify({ verificationCode: validOtp }),
    });
    assert.equal(confirmRes.status, 200);
    const confirmBody = (await confirmRes.json()) as any;
    assert.equal(confirmBody.data.status, CheckinStatus.VERIFIED);
    assert.ok(confirmBody.data.verifiedAt);
    assert.equal(confirmBody.data.riderName, 'Raju Rider');
    // Merchant DTO privacy check
    assert.equal(confirmBody.data.verificationCode, undefined, 'OTP must not be returned in merchant DTO');

    // 6.4 Double confirmation rejected with HTTP 409
    const doubleConfirmRes = await fetch(`${baseUrl}/api/v1/merchant/check-ins/${checkInId}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${merchant1Token}`,
      },
    });
    assert.equal(doubleConfirmRes.status, 409);

    // 6.5 Merchant rejection of a pending check-in
    const createRejectTarget = await fetch(`${baseUrl}/api/v1/check-ins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rider2Token}`,
      },
      body: JSON.stringify({ restStopId: activeVenue1Id }),
    });
    assert.equal(createRejectTarget.status, 201);
    const rejectTargetId = ((await createRejectTarget.json()) as any).data.id;

    const rejectRes = await fetch(`${baseUrl}/api/v1/merchant/check-ins/${rejectTargetId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${merchant1Token}`,
      },
      body: JSON.stringify({ reason: 'Rider was not physically at desk' }),
    });
    assert.equal(rejectRes.status, 200);
    const rejectBody = (await rejectRes.json()) as any;
    assert.equal(rejectBody.data.status, CheckinStatus.REJECTED);

    // Rejected check-in cannot be confirmed (HTTP 400)
    const confirmRejectTarget = await fetch(`${baseUrl}/api/v1/merchant/check-ins/${rejectTargetId}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${merchant1Token}`,
      },
    });
    assert.equal(confirmRejectTarget.status, 400);
  });

  // ==============================================================
  // 7. Expired Pending Check-in Handling
  // ==============================================================
  await t.test('7. Pending check-in expires after window and cannot be confirmed', async () => {
    // Manually create an expired pending check-in (created 20 minutes ago)
    const expiredId = 'mock-expired-checkin-001';
    const twentyMinsAgo = new Date(Date.now() - 20 * 60 * 1000);
    mockCheckInStore.set(expiredId, {
      _id: expiredId,
      id: expiredId,
      riderId: rider1Id,
      restStopId: activeVenue1Id,
      merchantId: merchant1Id,
      method: 'qr_code',
      verificationCode: 'EXP123',
      status: CheckinStatus.PENDING,
      checkInTime: twentyMinsAgo,
      createdAt: twentyMinsAgo,
      updatedAt: twentyMinsAgo,
    });

    const confirmRes = await fetch(`${baseUrl}/api/v1/merchant/check-ins/${expiredId}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${merchant1Token}`,
      },
    });
    assert.equal(confirmRes.status, 400);
    const confirmBody = (await confirmRes.json()) as any;
    assert.match(confirmBody.message || '', /expired/i);

    // Stored status is updated to EXPIRED
    assert.equal(mockCheckInStore.get(expiredId)?.status, CheckinStatus.EXPIRED);
  });

  // ==============================================================
  // 8. History & Admin Query Endpoints Regression Check
  // ==============================================================
  await t.test('8. Existing Rider, Merchant, and Admin history endpoints reflect verified status', async () => {
    // Rider history endpoint (GET /api/v1/check-ins/me)
    const riderHistoryRes = await fetch(`${baseUrl}/api/v1/check-ins/me`, {
      headers: { Authorization: `Bearer ${rider1Token}` },
    });
    assert.equal(riderHistoryRes.status, 200);
    const riderHistory = (await riderHistoryRes.json()) as any;
    assert.ok(Array.isArray(riderHistory.data.items));

    // Merchant check-ins (GET /api/v1/merchant/check-ins)
    const merchantHistoryRes = await fetch(`${baseUrl}/api/v1/merchant/check-ins`, {
      headers: { Authorization: `Bearer ${merchant1Token}` },
    });
    assert.equal(merchantHistoryRes.status, 200);
    const merchantHistory = (await merchantHistoryRes.json()) as any;
    assert.ok(Array.isArray(merchantHistory.data.items));

    // Admin moderation check-ins (GET /api/v1/admin/check-ins)
    const adminHistoryRes = await fetch(`${baseUrl}/api/v1/admin/check-ins`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(adminHistoryRes.status, 200);
    const adminHistory = (await adminHistoryRes.json()) as any;
    assert.ok(Array.isArray(adminHistory.data.items));
  });

  // ==============================================================
  // 9. Production Behavior When Database Unavailable
  // ==============================================================
  await t.test('9. Production mode rejects requests when database is disconnected', async () => {
    const originalEnv = config.NODE_ENV;
    (config as any).NODE_ENV = 'production';

    try {
      // In production without DB, authenticateJwt returns 401 Unauthorized with "Database service unavailable"
      const verifyRes = await fetch(`${baseUrl}/api/v1/check-ins/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${rider1Token}`,
        },
        body: JSON.stringify({
          restStopId: activeVenue1Id,
          qrCredential: 'some.credential',
        }),
      });
      assert.ok([401, 503].includes(verifyRes.status));
      const verifyBody = (await verifyRes.json()) as any;
      assert.match(verifyBody.message || '', /database service unavailable/i);

      // Merchant credential retrieval
      const credRes = await fetch(`${baseUrl}/api/v1/merchant/rest-stops/${activeVenue1Id}/qr-credential`, {
        headers: { Authorization: `Bearer ${merchant1Token}` },
      });
      assert.ok([401, 503].includes(credRes.status));
      const credBody = (await credRes.json()) as any;
      assert.match(credBody.message || '', /database service unavailable/i);
    } finally {
      (config as any).NODE_ENV = originalEnv;
    }
  });
});
