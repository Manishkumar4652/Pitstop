import test from 'node:test';
import assert from 'node:assert/strict';
import { Server } from 'http';
import { UserRole, RestStopStatus, CapacityStatus, Facility, DealDiscountType } from 'shared-types';
import { createApp } from '../app';
import { config } from '../config/env';
import { signAccessToken } from '../utils/jwt';
import {
  mockRestStopStore,
  clearMockRestStopStore,
  MockRestStopItem,
} from '../controllers/restStopMockStore';
import {
  mockDealStore,
  clearMockDealStore,
  MockDealItem,
} from '../controllers/dealMockStore';

const TEST_JWT_SECRET = 'a_very_secure_test_jwt_secret_that_has_at_least_32_characters_for_testing';

function setupDealTestServer() {
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

test('Deals APIs & Merchant Access Control Test Suite (Phase 3D2A)', async (t) => {
  const { server, baseUrl } = await setupDealTestServer();

  const merchant1Id = 'merchant-owner-001';
  const merchant2Id = 'merchant-other-002';
  const adminId = 'admin-user-999';
  const riderId = 'rider-user-111';

  const merchant1Token = signAccessToken({ userId: merchant1Id, role: UserRole.MERCHANT });
  const merchant2Token = signAccessToken({ userId: merchant2Id, role: UserRole.MERCHANT });
  const adminToken = signAccessToken({ userId: adminId, role: UserRole.ADMIN });
  const riderToken = signAccessToken({ userId: riderId, role: UserRole.RIDER });

  t.beforeEach(() => {
    clearMockRestStopStore();
    clearMockDealStore();
  });

  t.after(() => {
    server.close();
    clearMockRestStopStore();
    clearMockDealStore();
  });

  function seedSampleData() {
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
      images: ['https://images.unsplash.com/photo-1554118811-1e0d58224f24'],
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
      location: { type: 'Point', coordinates: [77.6208, 12.9352] },
      facilities: [Facility.RESTROOM, Facility.WIFI, Facility.PARKING],
      images: [],
      capacity: { maxRiders: 8, currentOccupancy: 1, status: CapacityStatus.AVAILABLE },
      operatingHours: [{ day: 'mon', openTime: '09:00', closeTime: '22:00', isOpen: true }],
      status: RestStopStatus.ACTIVE,
      rating: { average: 4.5, count: 45 },
      createdAt: new Date('2026-01-02T00:00:00Z'),
      updatedAt: new Date('2026-01-02T00:00:00Z'),
    };

    const pendingStop: MockRestStopItem = {
      _id: 'rs-pending-1',
      id: 'rs-pending-1',
      merchantId: merchant1Id,
      name: 'Whitefield Chai Corner (Pending)',
      slug: 'whitefield-chai-corner',
      description: 'Pending verification and physical store audit.',
      address: {
        street: 'ITPL Main Road',
        area: 'Whitefield',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560066',
      },
      location: { type: 'Point', coordinates: [77.75, 12.98] },
      facilities: [Facility.DRINKING_WATER],
      images: [],
      capacity: { maxRiders: 5, currentOccupancy: 0, status: CapacityStatus.AVAILABLE },
      operatingHours: [],
      status: RestStopStatus.PENDING_APPROVAL,
      rating: { average: 0, count: 0 },
      createdAt: new Date('2026-01-03T00:00:00Z'),
      updatedAt: new Date('2026-01-03T00:00:00Z'),
    };

    const suspendedStop: MockRestStopItem = {
      _id: 'rs-suspended-1',
      id: 'rs-suspended-1',
      merchantId: merchant2Id,
      name: 'HSR Fast Bites (Suspended)',
      slug: 'hsr-fast-bites',
      description: 'Suspended venue due to reported amenity outages.',
      address: {
        street: '27th Main',
        area: 'HSR Layout',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560102',
      },
      location: { type: 'Point', coordinates: [77.64, 12.91] },
      facilities: [Facility.DRINKING_WATER],
      images: [],
      capacity: { maxRiders: 5, currentOccupancy: 0, status: CapacityStatus.AVAILABLE },
      operatingHours: [],
      status: RestStopStatus.SUSPENDED,
      rating: { average: 3.0, count: 10 },
      createdAt: new Date('2026-01-04T00:00:00Z'),
      updatedAt: new Date('2026-01-04T00:00:00Z'),
    };

    mockRestStopStore.set(activeStop1._id, activeStop1);
    mockRestStopStore.set(activeStop2._id, activeStop2);
    mockRestStopStore.set(pendingStop._id, pendingStop);
    mockRestStopStore.set(suspendedStop._id, suspendedStop);

    // Deals
    const dealActive1: MockDealItem = {
      _id: 'deal-active-1',
      id: 'deal-active-1',
      restStopId: 'rs-active-1',
      merchantId: merchant1Id,
      title: '50% Off Fresh Masala Chai',
      description: 'Exclusive afternoon energizer for verified delivery riders.',
      discountType: DealDiscountType.PERCENTAGE,
      discountPercentage: 50,
      originalPrice: 30,
      dealPrice: 15,
      validHours: '14:00 - 18:00',
      validFrom: new Date('2026-01-01T00:00:00Z'),
      validUntil: new Date('2026-12-31T23:59:59Z'),
      isActive: true,
      maxRedemptionsPerRider: 2,
      createdAt: new Date('2026-01-05T10:00:00Z'),
      updatedAt: new Date('2026-01-05T10:00:00Z'),
    };

    const dealActive2: MockDealItem = {
      _id: 'deal-active-2',
      id: 'deal-active-2',
      restStopId: 'rs-active-1',
      merchantId: merchant1Id,
      title: 'Flat 20 Rs Off Snack Combo',
      description: 'Samosa and bun maska combo discount for delivery partners.',
      discountType: DealDiscountType.FIXED_PRICE,
      flatDiscountAmount: 20,
      originalPrice: 60,
      dealPrice: 40,
      validFrom: new Date('2026-01-01T00:00:00Z'),
      validUntil: new Date('2026-12-31T23:59:59Z'),
      isActive: true,
      createdAt: new Date('2026-01-06T10:00:00Z'),
      updatedAt: new Date('2026-01-06T10:00:00Z'),
    };

    const dealActive3: MockDealItem = {
      _id: 'deal-active-3',
      id: 'deal-active-3',
      restStopId: 'rs-active-2',
      merchantId: merchant2Id,
      title: 'Free Mineral Water Bottle with Meal',
      description: 'Complimentary chilled water bottle with any lunch purchase.',
      discountType: DealDiscountType.FREE_ITEM,
      validFrom: new Date('2026-01-01T00:00:00Z'),
      validUntil: new Date('2026-12-31T23:59:59Z'),
      isActive: true,
      createdAt: new Date('2026-01-07T10:00:00Z'),
      updatedAt: new Date('2026-01-07T10:00:00Z'),
    };

    const dealInactive: MockDealItem = {
      _id: 'deal-inactive-1',
      id: 'deal-inactive-1',
      restStopId: 'rs-active-1',
      merchantId: merchant1Id,
      title: 'Paused Breakfast Roll Deal',
      description: 'Currently paused by merchant owner during peak rush.',
      discountType: DealDiscountType.PERCENTAGE,
      discountPercentage: 25,
      validFrom: new Date('2026-01-01T00:00:00Z'),
      validUntil: new Date('2026-12-31T23:59:59Z'),
      isActive: false,
      createdAt: new Date('2026-01-08T10:00:00Z'),
      updatedAt: new Date('2026-01-08T10:00:00Z'),
    };

    const dealExpired: MockDealItem = {
      _id: 'deal-expired-1',
      id: 'deal-expired-1',
      restStopId: 'rs-active-1',
      merchantId: merchant1Id,
      title: 'Expired Monsoon Tea Special',
      description: 'Validity expired last month.',
      discountType: DealDiscountType.PERCENTAGE,
      discountPercentage: 40,
      validFrom: new Date('2026-01-01T00:00:00Z'),
      validUntil: new Date('2026-02-01T00:00:00Z'), // Past date
      isActive: true,
      createdAt: new Date('2026-01-01T10:00:00Z'),
      updatedAt: new Date('2026-01-01T10:00:00Z'),
    };

    const dealFuture: MockDealItem = {
      _id: 'deal-future-1',
      id: 'deal-future-1',
      restStopId: 'rs-active-1',
      merchantId: merchant1Id,
      title: 'Future Festival Special',
      description: 'Starts next month.',
      discountType: DealDiscountType.PERCENTAGE,
      discountPercentage: 50,
      validFrom: new Date('2026-12-01T00:00:00Z'), // Far future
      validUntil: new Date('2026-12-31T00:00:00Z'),
      isActive: true,
      createdAt: new Date('2026-01-09T10:00:00Z'),
      updatedAt: new Date('2026-01-09T10:00:00Z'),
    };

    const dealOnPendingStop: MockDealItem = {
      _id: 'deal-pending-stop',
      id: 'deal-pending-stop',
      restStopId: 'rs-pending-1',
      merchantId: merchant1Id,
      title: 'Deal on Pending Venue',
      description: 'Should not be publicly visible.',
      discountType: DealDiscountType.PERCENTAGE,
      discountPercentage: 30,
      validFrom: new Date('2026-01-01T00:00:00Z'),
      validUntil: new Date('2026-12-31T00:00:00Z'),
      isActive: true,
      createdAt: new Date('2026-01-10T10:00:00Z'),
      updatedAt: new Date('2026-01-10T10:00:00Z'),
    };

    const dealOnSuspendedStop: MockDealItem = {
      _id: 'deal-suspended-stop',
      id: 'deal-suspended-stop',
      restStopId: 'rs-suspended-1',
      merchantId: merchant2Id,
      title: 'Deal on Suspended Venue',
      description: 'Should not be publicly visible.',
      discountType: DealDiscountType.PERCENTAGE,
      discountPercentage: 20,
      validFrom: new Date('2026-01-01T00:00:00Z'),
      validUntil: new Date('2026-12-31T00:00:00Z'),
      isActive: true,
      createdAt: new Date('2026-01-11T10:00:00Z'),
      updatedAt: new Date('2026-01-11T10:00:00Z'),
    };

    mockDealStore.set(dealActive1._id, dealActive1);
    mockDealStore.set(dealActive2._id, dealActive2);
    mockDealStore.set(dealActive3._id, dealActive3);
    mockDealStore.set(dealInactive._id, dealInactive);
    mockDealStore.set(dealExpired._id, dealExpired);
    mockDealStore.set(dealFuture._id, dealFuture);
    mockDealStore.set(dealOnPendingStop._id, dealOnPendingStop);
    mockDealStore.set(dealOnSuspendedStop._id, dealOnSuspendedStop);
  }

  // =========================================================================
  // 1. PUBLIC DISCOVERY (GET /api/v1/deals and GET /api/v1/deals/:id)
  // =========================================================================
  await t.test('1. Public Discovery (GET /api/v1/deals and /:id)', async (sub) => {
    await sub.test('Public listing returns ONLY active, non-expired deals linked to active rest stops', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/deals`);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(Array.isArray(json.data.items));

      // Out of 8 seeded deals, only 3 meet all public visibility rules (dealActive1, dealActive2, dealActive3)
      assert.equal(json.data.items.length, 3);
      const ids = json.data.items.map((d: any) => d.id);
      assert.ok(ids.includes('deal-active-1'));
      assert.ok(ids.includes('deal-active-2'));
      assert.ok(ids.includes('deal-active-3'));

      // Inactive, expired, future, and deals on unapproved stops must NEVER appear
      assert.equal(ids.includes('deal-inactive-1'), false);
      assert.equal(ids.includes('deal-expired-1'), false);
      assert.equal(ids.includes('deal-future-1'), false);
      assert.equal(ids.includes('deal-pending-stop'), false);
      assert.equal(ids.includes('deal-suspended-stop'), false);
    });

    await sub.test('Pagination parameters work correctly with metadata', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/deals?page=1&limit=2`);
      assert.equal(res.status, 200);
      const json = await res.json();

      assert.equal(json.data.items.length, 2);
      assert.equal(json.data.pagination.page, 1);
      assert.equal(json.data.pagination.limit, 2);
      assert.equal(json.data.pagination.total, 3);
      assert.equal(json.data.pagination.totalPages, 2);
      assert.equal(json.data.pagination.hasNextPage, true);
      assert.equal(json.data.pagination.hasPrevPage, false);

      // Page 2
      const res2 = await fetch(`${baseUrl}/api/v1/deals?page=2&limit=2`);
      const json2 = await res2.json();
      assert.equal(json2.data.items.length, 1);
      assert.equal(json2.data.pagination.page, 2);
      assert.equal(json2.data.pagination.hasNextPage, false);
      assert.equal(json2.data.pagination.hasPrevPage, true);
    });

    await sub.test('Page size limit is capped at 50 to prevent unbounded queries', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/deals?limit=999`);
      assert.equal(res.status, 400); // Zod schema max(50) rejects limit over 50
    });

    await sub.test('Filtering by restStopId isolates deals for a specific venue', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/deals?restStopId=rs-active-2`);
      assert.equal(res.status, 200);
      const json = await res.json();

      assert.equal(json.data.items.length, 1);
      assert.equal(json.data.items[0].id, 'deal-active-3');
      assert.equal(json.data.items[0].restStopId, 'rs-active-2');
    });

    await sub.test('Filtering by discountType works correctly', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/deals?discountType=fixed_price`);
      assert.equal(res.status, 200);
      const json = await res.json();

      assert.equal(json.data.items.length, 1);
      assert.equal(json.data.items[0].id, 'deal-active-2');
      assert.equal(json.data.items[0].discountType, 'fixed_price');
    });

    await sub.test('Search filter performs case-insensitive match on title or description', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/deals?search=masala`);
      assert.equal(res.status, 200);
      const json = await res.json();

      assert.equal(json.data.items.length, 1);
      assert.equal(json.data.items[0].id, 'deal-active-1');
    });

    await sub.test('Arbitrary sort fields fall back to allowlist or error safely', async () => {
      seedSampleData();

      // Allowlisted sort
      const res = await fetch(`${baseUrl}/api/v1/deals?sort=title_asc`);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.ok(json.data.items[0].title <= json.data.items[1].title);

      // Invalid sort value is rejected by Zod
      const resBad = await fetch(`${baseUrl}/api/v1/deals?sort=injected_column`);
      assert.equal(resBad.status, 400);
    });

    await sub.test('GET /:id returns active deal with safe DTO and venue name', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/deals/deal-active-1`);
      assert.equal(res.status, 200);
      const json = await res.json();

      assert.equal(json.success, true);
      assert.equal(json.data.id, 'deal-active-1');
      assert.equal(json.data.title, '50% Off Fresh Masala Chai');
      assert.equal(json.data.restStopName, 'Chai Point Indiranagar');
      assert.equal(json.data.discountType, 'percentage');
      assert.equal(json.data.discountPercentage, 50);
      // Merchant internal identity must be excluded from public DTO
      assert.equal(json.data.merchantId, undefined);
    });

    await sub.test('GET /:id returns 404 for unknown deal ID', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/deals/nonexistent-deal-999`);
      assert.equal(res.status, 404);
    });

    await sub.test('GET /:id returns 404 for inactive or expired deals (no private leakage)', async () => {
      seedSampleData();

      // Inactive deal
      const resInactive = await fetch(`${baseUrl}/api/v1/deals/deal-inactive-1`);
      assert.equal(resInactive.status, 404);

      // Expired deal
      const resExpired = await fetch(`${baseUrl}/api/v1/deals/deal-expired-1`);
      assert.equal(resExpired.status, 404);

      // Deal on pending stop
      const resPendingStop = await fetch(`${baseUrl}/api/v1/deals/deal-pending-stop`);
      assert.equal(resPendingStop.status, 404);
    });
  });

  // =========================================================================
  // 2. MERCHANT OPERATIONS (POST /api/v1/deals and PATCH /api/v1/deals/:id)
  // =========================================================================
  await t.test('2. Merchant Create & Update (POST and PATCH /api/v1/deals)', async (sub) => {
    await sub.test('Unauthenticated user cannot create a deal (HTTP 401)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/deals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restStopId: 'rs-active-1',
          title: '30% Off Hot Coffee',
          description: 'Special coffee discount for riders',
          discountType: 'percentage',
          discountPercentage: 30,
        }),
      });

      assert.equal(res.status, 401);
    });

    await sub.test('Rider role cannot create a deal (HTTP 403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/deals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${riderToken}`,
        },
        body: JSON.stringify({
          restStopId: 'rs-active-1',
          title: '30% Off Hot Coffee',
          description: 'Special coffee discount for riders',
          discountType: 'percentage',
          discountPercentage: 30,
        }),
      });

      assert.equal(res.status, 403);
    });

    await sub.test('Merchant successfully creates a deal for their own active rest stop', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/deals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchant1Token}`,
        },
        body: JSON.stringify({
          restStopId: 'rs-active-1',
          title: '25% Off Fresh Snacks Combo',
          description: 'Valid for all registered delivery partners on duty.',
          discountType: 'percentage',
          discountPercentage: 25,
          validHours: '11:00 - 16:00',
          terms: 'One coupon per delivery partner per afternoon.',
          maxRedemptionsPerRider: 1,
        }),
      });

      assert.equal(res.status, 201);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.title, '25% Off Fresh Snacks Combo');
      assert.equal(json.data.merchantId, merchant1Id);
      assert.equal(json.data.restStopId, 'rs-active-1');
      assert.equal(json.data.isActive, true);
    });

    await sub.test('Merchant cannot create a deal for another merchant rest stop (HTTP 403 Forbidden)', async () => {
      seedSampleData();

      // merchant1 attempts to create a deal on rs-active-2 (owned by merchant2)
      const res = await fetch(`${baseUrl}/api/v1/deals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchant1Token}`,
        },
        body: JSON.stringify({
          restStopId: 'rs-active-2',
          title: 'Unauthorized Deal on Other Stop',
          description: 'Attempting cross-merchant deal creation.',
          discountType: 'percentage',
          discountPercentage: 20,
        }),
      });

      assert.equal(res.status, 403);
      const json = await res.json();
      assert.ok(json.message.includes('do not own this rest stop'));
    });

    await sub.test('Merchant cannot create a deal on an unapproved/pending rest stop (HTTP 400)', async () => {
      seedSampleData();

      // merchant1 owns rs-pending-1, but venue is pending approval
      const res = await fetch(`${baseUrl}/api/v1/deals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchant1Token}`,
        },
        body: JSON.stringify({
          restStopId: 'rs-pending-1',
          title: 'Premature Deal on Pending Venue',
          description: 'Cannot publish before rest stop is active.',
          discountType: 'percentage',
          discountPercentage: 15,
        }),
      });

      assert.equal(res.status, 400);
      const json = await res.json();
      assert.ok(json.message.includes('not approved and active'));
    });

    await sub.test('Rejects deal creation with validUntil in the past (HTTP 400)', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/deals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchant1Token}`,
        },
        body: JSON.stringify({
          restStopId: 'rs-active-1',
          title: 'Past Expiry Date Deal',
          description: 'Should be rejected as already expired.',
          discountType: 'percentage',
          discountPercentage: 15,
          validUntil: '2025-01-01T00:00:00Z',
        }),
      });

      assert.equal(res.status, 400);
    });

    await sub.test('Rejects invalid discount percentages (0% or over 100%) with HTTP 400', async () => {
      seedSampleData();

      const res1 = await fetch(`${baseUrl}/api/v1/deals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchant1Token}`,
        },
        body: JSON.stringify({
          restStopId: 'rs-active-1',
          title: 'Zero Percent Discount Deal',
          description: 'Invalid percentage boundary.',
          discountType: 'percentage',
          discountPercentage: 0,
        }),
      });
      assert.equal(res1.status, 400);

      const res2 = await fetch(`${baseUrl}/api/v1/deals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchant1Token}`,
        },
        body: JSON.stringify({
          restStopId: 'rs-active-1',
          title: 'Over 100 Percent Deal',
          description: 'Invalid percentage boundary.',
          discountType: 'percentage',
          discountPercentage: 120,
        }),
      });
      assert.equal(res2.status, 400);
    });

    await sub.test('Client cannot inject merchantId or arbitrary extra fields in POST (HTTP 400 due to .strict())', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/deals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchant1Token}`,
        },
        body: JSON.stringify({
          restStopId: 'rs-active-1',
          title: 'Attempt Injected Merchant ID',
          description: 'Payload includes injected merchantId field.',
          discountType: 'percentage',
          discountPercentage: 20,
          merchantId: 'injected-attacker-id',
        }),
      });

      assert.equal(res.status, 400);
    });

    await sub.test('Merchant successfully updates their own deal', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/deals/deal-active-1`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchant1Token}`,
        },
        body: JSON.stringify({
          title: 'Updated 55% Off Masala Chai',
          discountPercentage: 55,
          validHours: '13:00 - 18:00',
        }),
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.data.title, 'Updated 55% Off Masala Chai');
      assert.equal(json.data.discountPercentage, 55);
      assert.equal(json.data.validHours, '13:00 - 18:00');
    });

    await sub.test('Merchant cannot update another merchant deal (HTTP 403 Forbidden)', async () => {
      seedSampleData();

      // merchant2 attempts to update merchant1's deal
      const res = await fetch(`${baseUrl}/api/v1/deals/deal-active-1`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchant2Token}`,
        },
        body: JSON.stringify({
          title: 'Hijacked Deal Title',
        }),
      });

      assert.equal(res.status, 403);
    });

    await sub.test('Merchant cannot activate an expired deal without extending validity (HTTP 400)', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/deals/deal-expired-1`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchant1Token}`,
        },
        body: JSON.stringify({
          isActive: true,
        }),
      });

      assert.equal(res.status, 400);
      const json = await res.json();
      assert.ok(json.message.includes('expired'));
    });

    await sub.test('Merchant PATCH rejects unknown fields (HTTP 400)', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/deals/deal-active-1`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchant1Token}`,
        },
        body: JSON.stringify({
          merchantId: 'new-owner',
        }),
      });

      assert.equal(res.status, 400);
    });

    await sub.test('Merchant PATCH returns 404 for nonexistent deal ID', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/deals/nonexistent-deal-999`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchant1Token}`,
        },
        body: JSON.stringify({
          title: 'Does Not Exist',
        }),
      });

      assert.equal(res.status, 404);
    });
  });

  // =========================================================================
  // 3. ADMIN DEAL MANAGEMENT (GET and PATCH /api/v1/admin/deals)
  // =========================================================================
  await t.test('3. Admin Moderation (GET and PATCH /api/v1/admin/deals)', async (sub) => {
    await sub.test('Unauthenticated caller cannot access admin routes (HTTP 401)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/deals`);
      assert.equal(res.status, 401);
    });

    await sub.test('Riders and merchants cannot access admin routes (HTTP 403)', async () => {
      const resRider = await fetch(`${baseUrl}/api/v1/admin/deals`, {
        headers: { Authorization: `Bearer ${riderToken}` },
      });
      assert.equal(resRider.status, 403);

      const resMerchant = await fetch(`${baseUrl}/api/v1/admin/deals`, {
        headers: { Authorization: `Bearer ${merchant1Token}` },
      });
      assert.equal(resMerchant.status, 403);
    });

    await sub.test('Admin can list all deals with administrative metadata', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/admin/deals`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      // Admin sees all 8 deals including inactive, expired, and pending venues
      assert.equal(json.data.items.length, 8);
      assert.ok(json.data.items[0].merchantId);
      assert.ok(json.data.items[0].status);
    });

    await sub.test('Admin can filter deals by status or isActive', async () => {
      seedSampleData();

      const resActive = await fetch(`${baseUrl}/api/v1/admin/deals?status=active`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(resActive.status, 200);
      const jsonActive = await resActive.json();
      assert.equal(jsonActive.data.items.length, 7); // 7 active deals (including expired/pending venue)

      const resInactive = await fetch(`${baseUrl}/api/v1/admin/deals?status=inactive`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(resInactive.status, 200);
      const jsonInactive = await resInactive.json();
      assert.equal(jsonInactive.data.items.length, 1);
      assert.equal(jsonInactive.data.items[0].id, 'deal-inactive-1');
    });

    await sub.test('Admin successfully pauses/deactivates an active deal', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/admin/deals/deal-active-1/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: 'paused',
          reason: 'Excessive crowds reported at counter.',
        }),
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.data.isActive, false);
      assert.equal(json.data.status, 'inactive');
    });

    await sub.test('Admin successfully reinstates a paused deal', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/admin/deals/deal-inactive-1/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: 'active',
          reason: 'Counter inventory replenished.',
        }),
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.data.isActive, true);
      assert.equal(json.data.status, 'active');
    });

    await sub.test('Admin status update rejects invalid status values (HTTP 400)', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/admin/deals/deal-active-1/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: 'invalid_status_enum',
        }),
      });

      assert.equal(res.status, 400);
    });

    await sub.test('Admin status update rejects extraneous protected fields (HTTP 400)', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/admin/deals/deal-active-1/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: 'active',
          discountPercentage: 99,
        }),
      });

      assert.equal(res.status, 400);
    });
  });

  // ==============================================================
  // 4. Merchant Isolated Deal Management (Phase 6C)
  // ==============================================================
  await t.test('4. Merchant Isolated Listing & Ownership (GET /api/v1/merchant/deals and /:id)', async (sub) => {
    sub.beforeEach(() => {
      clearMockRestStopStore();
      clearMockDealStore();
      seedSampleData();
    });

    await sub.test('Unauthenticated user cannot list merchant deals (HTTP 401)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/merchant/deals`);
      assert.equal(res.status, 401);
    });

    await sub.test('Rider role cannot access merchant deals (HTTP 403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/merchant/deals`, {
        headers: { Authorization: `Bearer ${riderToken}` },
      });
      assert.equal(res.status, 403);
    });

    await sub.test('Merchant 1 only sees their own deals across all statuses', async () => {
      const res = await fetch(`${baseUrl}/api/v1/merchant/deals`, {
        headers: { Authorization: `Bearer ${merchant1Token}` },
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(Array.isArray(json.data.items));
      // Merchant 1 owns 6 deals; Merchant 2 owns 1 deal (deal-active-3)
      assert.equal(json.data.items.length, 6);
      const ids = json.data.items.map((item: any) => item.id);
      assert.ok(ids.includes('deal-active-1'));
      assert.ok(ids.includes('deal-active-2'));
      assert.ok(ids.includes('deal-inactive-1'));
      assert.ok(ids.includes('deal-expired-1'));
      assert.ok(ids.includes('deal-future-1'));
      assert.ok(ids.includes('deal-pending-stop'));
      assert.ok(!ids.includes('deal-active-3')); // Isolated from merchant 2!
      assert.equal(json.data.pagination.total, 6);
    });

    await sub.test('Merchant 1 can filter owned deals by status (inactive)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/merchant/deals?status=inactive`, {
        headers: { Authorization: `Bearer ${merchant1Token}` },
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.data.items.length, 1);
      assert.equal(json.data.items[0].id, 'deal-inactive-1');
      assert.equal(json.data.items[0].isActive, false);
    });

    await sub.test('Merchant 1 can filter owned deals by status (expired)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/merchant/deals?status=expired`, {
        headers: { Authorization: `Bearer ${merchant1Token}` },
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.data.items.length, 1);
      assert.equal(json.data.items[0].id, 'deal-expired-1');
    });

    await sub.test('Merchant 1 can search owned deals by keyword', async () => {
      const res = await fetch(`${baseUrl}/api/v1/merchant/deals?search=Samosa`, {
        headers: { Authorization: `Bearer ${merchant1Token}` },
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.data.items.length, 1);
      assert.equal(json.data.items[0].id, 'deal-active-2');
    });

    await sub.test('Merchant 1 can fetch their own deal by ID (HTTP 200) with populated restStopName', async () => {
      const res = await fetch(`${baseUrl}/api/v1/merchant/deals/deal-active-1`, {
        headers: { Authorization: `Bearer ${merchant1Token}` },
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.id, 'deal-active-1');
      assert.equal(json.data.merchantId, merchant1Id);
      assert.equal(json.data.restStopName, 'Chai Point Indiranagar');
    });

    await sub.test('Merchant 2 is denied access to Merchant 1 deal by ID (HTTP 403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/merchant/deals/deal-active-1`, {
        headers: { Authorization: `Bearer ${merchant2Token}` },
      });

      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.match(json.message, /permission/i);
    });

    await sub.test('Returns 404 for nonexistent deal ID for merchant', async () => {
      const res = await fetch(`${baseUrl}/api/v1/merchant/deals/deal-nonexistent-999`, {
        headers: { Authorization: `Bearer ${merchant1Token}` },
      });

      assert.equal(res.status, 404);
    });
  });
});

