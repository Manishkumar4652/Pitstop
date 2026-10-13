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

function setupCheckInTestServer() {
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

test('Check-In APIs & Verification Test Suite (Phase 3D2B2)', async (t) => {
  const { server, baseUrl } = await setupCheckInTestServer();

  const rider1Id = 'rider-user-001';
  const rider2Id = 'rider-user-002';
  const merchant1Id = 'merchant-owner-001';
  const merchant2Id = 'merchant-owner-002';
  const adminId = 'admin-user-999';

  const rider1Token = signAccessToken({ userId: rider1Id, role: UserRole.RIDER });
  const rider2Token = signAccessToken({ userId: rider2Id, role: UserRole.RIDER });
  const merchant1Token = signAccessToken({ userId: merchant1Id, role: UserRole.MERCHANT });
  const merchant2Token = signAccessToken({ userId: merchant2Id, role: UserRole.MERCHANT });
  const adminToken = signAccessToken({ userId: adminId, role: UserRole.ADMIN });

  t.beforeEach(() => {
    clearMockRestStopStore();
    clearMockCheckInStore();
    mockUserStore.clear();

    // Seed mock users with roles and names
    mockUserStore.set(rider1Id, {
      _id: rider1Id,
      id: rider1Id,
      name: 'Raju Sharma',
      phone: '+919876543210',
      role: UserRole.RIDER,
    });
    mockUserStore.set(rider2Id, {
      _id: rider2Id,
      id: rider2Id,
      name: 'Sunil Verma',
      phone: '+919876543211',
      role: UserRole.RIDER,
    });
    mockUserStore.set(merchant1Id, {
      _id: merchant1Id,
      id: merchant1Id,
      name: 'Chai Point Merchant',
      phone: '+919876543212',
      role: UserRole.MERCHANT,
    });
    mockUserStore.set(merchant2Id, {
      _id: merchant2Id,
      id: merchant2Id,
      name: 'Koramangala Merchant',
      phone: '+919876543213',
      role: UserRole.MERCHANT,
    });
    mockUserStore.set(adminId, {
      _id: adminId,
      id: adminId,
      name: 'Admin User',
      phone: '+919876543214',
      role: UserRole.ADMIN,
    });
  });

  t.after(() => {
    server.close();
    clearMockRestStopStore();
    clearMockCheckInStore();
    mockUserStore.clear();
  });

  function seedSampleStops() {
    const activeStop1: MockRestStopItem = {
      _id: 'rs-active-1',
      id: 'rs-active-1',
      merchantId: merchant1Id,
      name: 'Chai Point Indiranagar',
      slug: 'chai-point-indiranagar',
      description: 'Clean RO drinking water, charging stations, and dedicated seating.',
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
      capacity: { maxRiders: 12, currentOccupancy: 3, status: CapacityStatus.AVAILABLE },
      operatingHours: [{ day: 'mon', openTime: '08:00', closeTime: '23:00', isOpen: true }],
      status: RestStopStatus.ACTIVE,
      rating: { average: 4.8, count: 120 },
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    };

    const activeStop2: MockRestStopItem = {
      _id: 'rs-active-2',
      id: 'rs-active-2',
      merchantId: merchant2Id,
      name: 'Koramangala Hub Cafe',
      slug: 'koramangala-hub-cafe',
      description: 'Air conditioned rider lounge with parking and restrooms.',
      address: {
        street: '80 Feet Road',
        area: 'Koramangala',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560034',
      },
      location: { type: 'Point', coordinates: [77.6245, 12.9352] },
      facilities: [Facility.RESTROOM, Facility.WIFI, Facility.PARKING],
      images: [],
      capacity: { maxRiders: 20, currentOccupancy: 5, status: CapacityStatus.AVAILABLE },
      operatingHours: [{ day: 'mon', openTime: '09:00', closeTime: '22:00', isOpen: true }],
      status: RestStopStatus.ACTIVE,
      rating: { average: 4.6, count: 85 },
      createdAt: new Date('2026-01-02T00:00:00Z'),
      updatedAt: new Date('2026-01-02T00:00:00Z'),
    };

    const inactiveStop: MockRestStopItem = {
      _id: 'rs-inactive-1',
      id: 'rs-inactive-1',
      merchantId: merchant1Id,
      name: 'Closed PitStop',
      slug: 'closed-pitstop',
      description: 'Temporarily closed venue.',
      address: {
        street: 'MG Road',
        area: 'Central',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
      },
      location: { type: 'Point', coordinates: [77.5946, 12.9716] },
      facilities: [Facility.DRINKING_WATER],
      images: [],
      capacity: { maxRiders: 5, currentOccupancy: 0, status: CapacityStatus.FULL },
      operatingHours: [],
      status: RestStopStatus.PENDING_APPROVAL,
      rating: { average: 0, count: 0 },
      createdAt: new Date('2026-01-03T00:00:00Z'),
      updatedAt: new Date('2026-01-03T00:00:00Z'),
    };

    mockRestStopStore.set(activeStop1._id, activeStop1);
    mockRestStopStore.set(activeStop2._id, activeStop2);
    mockRestStopStore.set(inactiveStop._id, inactiveStop);

    return { activeStop1, activeStop2, inactiveStop };
  }

  // ==========================================
  // 1. Rider Check-In Creation Tests
  // ==========================================
  await t.test('POST /api/v1/check-ins rejects unauthenticated requests', async () => {
    seedSampleStops();
    const res = await fetch(`${baseUrl}/api/v1/check-ins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restStopId: 'rs-active-1' }),
    });

    assert.equal(res.status, 401);
  });

  await t.test('POST /api/v1/check-ins rejects non-rider roles', async () => {
    seedSampleStops();
    const merchantRes = await fetch(`${baseUrl}/api/v1/check-ins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${merchant1Token}`,
      },
      body: JSON.stringify({ restStopId: 'rs-active-1' }),
    });
    assert.equal(merchantRes.status, 403);

    const adminRes = await fetch(`${baseUrl}/api/v1/check-ins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ restStopId: 'rs-active-1' }),
    });
    assert.equal(adminRes.status, 403);
  });

  await t.test('POST /api/v1/check-ins rejects client-injected riderId or status (strict validation)', async () => {
    seedSampleStops();
    const res = await fetch(`${baseUrl}/api/v1/check-ins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rider1Token}`,
      },
      body: JSON.stringify({
        restStopId: 'rs-active-1',
        riderId: 'attacker-id',
        status: 'verified',
      }),
    });

    assert.equal(res.status, 400);
  });

  await t.test('POST /api/v1/check-ins rejects non-existent rest stop', async () => {
    seedSampleStops();
    const res = await fetch(`${baseUrl}/api/v1/check-ins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rider1Token}`,
      },
      body: JSON.stringify({ restStopId: 'rs-non-existent' }),
    });

    assert.equal(res.status, 404);
  });

  await t.test('POST /api/v1/check-ins rejects unapproved/inactive rest stop', async () => {
    seedSampleStops();
    const res = await fetch(`${baseUrl}/api/v1/check-ins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rider1Token}`,
      },
      body: JSON.stringify({ restStopId: 'rs-inactive-1' }),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.message || '', /not approved and active/i);
  });

  await t.test('POST /api/v1/check-ins successfully creates a check-in with initial pending status', async () => {
    seedSampleStops();
    const res = await fetch(`${baseUrl}/api/v1/check-ins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rider1Token}`,
      },
      body: JSON.stringify({ restStopId: 'rs-active-1' }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.id);
    assert.equal(body.data.restStopId, 'rs-active-1');
    assert.equal(body.data.restStopName, 'Chai Point Indiranagar');
    assert.equal(body.data.status, CheckinStatus.PENDING);
    // Security: raw verificationCode must never be returned in response DTO
    assert.equal(body.data.verificationCode, undefined);
  });

  await t.test('Duplicate check-in prevention: rejects check-in within 15 minutes at same stop', async () => {
    seedSampleStops();
    // First check-in
    const res1 = await fetch(`${baseUrl}/api/v1/check-ins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rider1Token}`,
      },
      body: JSON.stringify({ restStopId: 'rs-active-1' }),
    });
    assert.equal(res1.status, 201);

    // Immediate duplicate check-in at same stop
    const res2 = await fetch(`${baseUrl}/api/v1/check-ins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rider1Token}`,
      },
      body: JSON.stringify({ restStopId: 'rs-active-1' }),
    });
    assert.equal(res2.status, 409);
    const body2 = await res2.json();
    assert.match(body2.message || '', /already recorded within/i);

    // But check-in by the SAME rider at a DIFFERENT active stop succeeds
    const res3 = await fetch(`${baseUrl}/api/v1/check-ins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rider1Token}`,
      },
      body: JSON.stringify({ restStopId: 'rs-active-2' }),
    });
    assert.equal(res3.status, 201);
  });

  // ==========================================
  // 2. Rider Check-In History and Single View Tests
  // ==========================================
  await t.test('GET /api/v1/check-ins/me returns only authenticated rider records with pagination', async () => {
    seedSampleStops();

    // Seed check-ins directly in mock store
    const item1: MockCheckInItem = {
      _id: 'ci-rider1-stop1',
      id: 'ci-rider1-stop1',
      riderId: rider1Id,
      restStopId: 'rs-active-1',
      merchantId: merchant1Id,
      method: 'qr_code',
      verificationCode: 'SECRET1',
      status: CheckinStatus.VERIFIED,
      checkInTime: new Date('2026-03-01T10:00:00Z'),
      createdAt: new Date('2026-03-01T10:00:00Z'),
      updatedAt: new Date('2026-03-01T10:00:00Z'),
    };
    const item2: MockCheckInItem = {
      _id: 'ci-rider1-stop2',
      id: 'ci-rider1-stop2',
      riderId: rider1Id,
      restStopId: 'rs-active-2',
      merchantId: merchant2Id,
      method: 'qr_code',
      verificationCode: 'SECRET2',
      status: CheckinStatus.PENDING,
      checkInTime: new Date('2026-03-01T11:00:00Z'),
      createdAt: new Date('2026-03-01T11:00:00Z'),
      updatedAt: new Date('2026-03-01T11:00:00Z'),
    };
    const otherItem: MockCheckInItem = {
      _id: 'ci-rider2-stop1',
      id: 'ci-rider2-stop1',
      riderId: rider2Id,
      restStopId: 'rs-active-1',
      merchantId: merchant1Id,
      method: 'qr_code',
      verificationCode: 'SECRET3',
      status: CheckinStatus.VERIFIED,
      checkInTime: new Date('2026-03-01T12:00:00Z'),
      createdAt: new Date('2026-03-01T12:00:00Z'),
      updatedAt: new Date('2026-03-01T12:00:00Z'),
    };
    mockCheckInStore.set(item1._id, item1);
    mockCheckInStore.set(item2._id, item2);
    mockCheckInStore.set(otherItem._id, otherItem);

    // Rider 1 queries history
    const res = await fetch(`${baseUrl}/api/v1/check-ins/me?page=1&limit=10&sort=newest`, {
      headers: { Authorization: `Bearer ${rider1Token}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.items.length, 2);
    assert.equal(body.data.pagination.total, 2);
    // Sort newest first: item2 should be first
    assert.equal(body.data.items[0].id, 'ci-rider1-stop2');
    assert.equal(body.data.items[1].id, 'ci-rider1-stop1');
    // Security: secrets must be excluded
    assert.equal(body.data.items[0].verificationCode, undefined);
  });

  await t.test('GET /api/v1/check-ins/me rejects page size > 50', async () => {
    seedSampleStops();
    const res = await fetch(`${baseUrl}/api/v1/check-ins/me?limit=100`, {
      headers: { Authorization: `Bearer ${rider1Token}` },
    });
    assert.equal(res.status, 400);
  });

  await t.test('GET /api/v1/check-ins/:id returns item for owner and 404 for another rider', async () => {
    seedSampleStops();
    const item: MockCheckInItem = {
      _id: 'ci-private-1',
      id: 'ci-private-1',
      riderId: rider1Id,
      restStopId: 'rs-active-1',
      merchantId: merchant1Id,
      method: 'qr_code',
      verificationCode: 'TOP_SECRET',
      status: CheckinStatus.VERIFIED,
      checkInTime: new Date('2026-03-01T10:00:00Z'),
      createdAt: new Date('2026-03-01T10:00:00Z'),
      updatedAt: new Date('2026-03-01T10:00:00Z'),
    };
    mockCheckInStore.set(item._id, item);

    // Rider 1 (owner) accesses it
    const ownerRes = await fetch(`${baseUrl}/api/v1/check-ins/ci-private-1`, {
      headers: { Authorization: `Bearer ${rider1Token}` },
    });
    assert.equal(ownerRes.status, 200);
    const ownerBody = await ownerRes.json();
    assert.equal(ownerBody.data.id, 'ci-private-1');
    assert.equal(ownerBody.data.verificationCode, undefined);

    // Rider 2 attempts to access Rider 1's record -> must return 404 (do not leak existence)
    const otherRes = await fetch(`${baseUrl}/api/v1/check-ins/ci-private-1`, {
      headers: { Authorization: `Bearer ${rider2Token}` },
    });
    assert.equal(otherRes.status, 404);

    // Non-existent record returns 404
    const notFoundRes = await fetch(`${baseUrl}/api/v1/check-ins/ci-non-existent`, {
      headers: { Authorization: `Bearer ${rider1Token}` },
    });
    assert.equal(notFoundRes.status, 404);
  });

  // ==========================================
  // 3. Merchant Check-In Views & Privacy Safeguards
  // ==========================================
  await t.test('GET /api/v1/merchant/check-ins enforces merchant role', async () => {
    seedSampleStops();
    const riderRes = await fetch(`${baseUrl}/api/v1/merchant/check-ins`, {
      headers: { Authorization: `Bearer ${rider1Token}` },
    });
    assert.equal(riderRes.status, 403);

    const unauthRes = await fetch(`${baseUrl}/api/v1/merchant/check-ins`);
    assert.equal(unauthRes.status, 401);
  });

  await t.test('GET /api/v1/merchant/check-ins returns only check-ins at stops owned by calling merchant', async () => {
    seedSampleStops();

    const m1CheckIn: MockCheckInItem = {
      _id: 'ci-m1-venue',
      id: 'ci-m1-venue',
      riderId: rider1Id,
      restStopId: 'rs-active-1', // owned by merchant1
      merchantId: merchant1Id,
      method: 'qr_code',
      verificationCode: 'M1_SECRET',
      status: CheckinStatus.VERIFIED,
      checkInTime: new Date('2026-03-01T10:00:00Z'),
      createdAt: new Date('2026-03-01T10:00:00Z'),
      updatedAt: new Date('2026-03-01T10:00:00Z'),
    };
    const m2CheckIn: MockCheckInItem = {
      _id: 'ci-m2-venue',
      id: 'ci-m2-venue',
      riderId: rider2Id,
      restStopId: 'rs-active-2', // owned by merchant2
      merchantId: merchant2Id,
      method: 'qr_code',
      verificationCode: 'M2_SECRET',
      status: CheckinStatus.VERIFIED,
      checkInTime: new Date('2026-03-01T10:30:00Z'),
      createdAt: new Date('2026-03-01T10:30:00Z'),
      updatedAt: new Date('2026-03-01T10:30:00Z'),
    };
    mockCheckInStore.set(m1CheckIn._id, m1CheckIn);
    mockCheckInStore.set(m2CheckIn._id, m2CheckIn);

    // Merchant 1 queries check-ins
    const m1Res = await fetch(`${baseUrl}/api/v1/merchant/check-ins`, {
      headers: { Authorization: `Bearer ${merchant1Token}` },
    });
    assert.equal(m1Res.status, 200);
    const m1Body = await m1Res.json();
    assert.equal(m1Body.data.items.length, 1);
    assert.equal(m1Body.data.items[0].id, 'ci-m1-venue');
    // Privacy verification: rider's phone/email and secret verification codes are excluded
    assert.equal(m1Body.data.items[0].verificationCode, undefined);
    assert.equal(m1Body.data.items[0].phone, undefined);
    assert.equal(m1Body.data.items[0].email, undefined);
    assert.equal(m1Body.data.items[0].coordinates, undefined);

    // Merchant 2 queries check-ins
    const m2Res = await fetch(`${baseUrl}/api/v1/merchant/check-ins`, {
      headers: { Authorization: `Bearer ${merchant2Token}` },
    });
    assert.equal(m2Res.status, 200);
    const m2Body = await m2Res.json();
    assert.equal(m2Body.data.items.length, 1);
    assert.equal(m2Body.data.items[0].id, 'ci-m2-venue');
  });

  await t.test('GET /api/v1/merchant/check-ins rejects filtering by another merchant\'s rest stop', async () => {
    seedSampleStops();

    // Merchant 1 attempts to query check-ins for rs-active-2 (owned by Merchant 2)
    const res = await fetch(`${baseUrl}/api/v1/merchant/check-ins?restStopId=rs-active-2`, {
      headers: { Authorization: `Bearer ${merchant1Token}` },
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.match(body.message || '', /permission/i);
  });

  // ==========================================
  // 4. Admin Check-In Moderation Tests
  // ==========================================
  await t.test('GET /api/v1/admin/check-ins enforces admin role', async () => {
    seedSampleStops();
    const riderRes = await fetch(`${baseUrl}/api/v1/admin/check-ins`, {
      headers: { Authorization: `Bearer ${rider1Token}` },
    });
    assert.equal(riderRes.status, 403);

    const merchantRes = await fetch(`${baseUrl}/api/v1/admin/check-ins`, {
      headers: { Authorization: `Bearer ${merchant1Token}` },
    });
    assert.equal(merchantRes.status, 403);
  });

  await t.test('GET /api/v1/admin/check-ins returns check-ins across all venues with filters', async () => {
    seedSampleStops();

    const ci1: MockCheckInItem = {
      _id: 'ci-admin-1',
      id: 'ci-admin-1',
      riderId: rider1Id,
      restStopId: 'rs-active-1',
      merchantId: merchant1Id,
      method: 'qr_code',
      verificationCode: 'CODE1',
      status: CheckinStatus.PENDING,
      checkInTime: new Date('2026-03-01T10:00:00Z'),
      createdAt: new Date('2026-03-01T10:00:00Z'),
      updatedAt: new Date('2026-03-01T10:00:00Z'),
    };
    const ci2: MockCheckInItem = {
      _id: 'ci-admin-2',
      id: 'ci-admin-2',
      riderId: rider2Id,
      restStopId: 'rs-active-2',
      merchantId: merchant2Id,
      method: 'qr_code',
      verificationCode: 'CODE2',
      status: CheckinStatus.VERIFIED,
      checkInTime: new Date('2026-03-01T11:00:00Z'),
      createdAt: new Date('2026-03-01T11:00:00Z'),
      updatedAt: new Date('2026-03-01T11:00:00Z'),
    };
    mockCheckInStore.set(ci1._id, ci1);
    mockCheckInStore.set(ci2._id, ci2);

    // Admin lists all
    const allRes = await fetch(`${baseUrl}/api/v1/admin/check-ins`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(allRes.status, 200);
    const allBody = await allRes.json();
    assert.equal(allBody.data.items.length, 2);
    // Admin DTO has riderId, merchantId, and excludes verificationCode secret (newest item is ci2)
    assert.equal(allBody.data.items[0].riderId, rider2Id);
    assert.equal(allBody.data.items[0].merchantId, merchant2Id);
    assert.equal(allBody.data.items[0].verificationCode, undefined);

    // Admin filters by status=pending
    const filterRes = await fetch(`${baseUrl}/api/v1/admin/check-ins?status=pending`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(filterRes.status, 200);
    const filterBody = await filterRes.json();
    assert.equal(filterBody.data.items.length, 1);
    assert.equal(filterBody.data.items[0].id, 'ci-admin-1');
  });

  // ==========================================
  // 5. Production Environment Guard Test
  // ==========================================
  await t.test('Production guard rejects offline request when NODE_ENV is production without DB', async () => {
    seedSampleStops();
    const originalEnv = config.NODE_ENV;
    try {
      (config as any).NODE_ENV = 'production';
      const res = await fetch(`${baseUrl}/api/v1/check-ins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${rider1Token}`,
        },
        body: JSON.stringify({ restStopId: 'rs-active-1' }),
      });
      // In production without DB, authenticateJwt returns 401 Unauthorized with "Database service unavailable"
      assert.ok([401, 503].includes(res.status));
      const body = await res.json();
      assert.match(body.message || '', /database service unavailable/i);
    } finally {
      (config as any).NODE_ENV = originalEnv;
    }
  });
});
