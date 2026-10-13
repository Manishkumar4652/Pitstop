import test from 'node:test';
import assert from 'node:assert/strict';
import { Server } from 'http';
import { UserRole, RestStopStatus, CapacityStatus, Facility } from 'shared-types';
import { createApp } from '../app';
import { config } from '../config/env';
import { signAccessToken } from '../utils/jwt';
import {
  mockRestStopStore,
  clearMockRestStopStore,
  MockRestStopItem,
} from '../controllers/restStopMockStore';

const TEST_JWT_SECRET = 'a_very_secure_test_jwt_secret_that_has_at_least_32_characters_for_testing';

function setupRestStopTestServer() {
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

test('Rest-Stop APIs & Access Control Test Suite (Phase 3D1)', async (t) => {
  const { server, baseUrl } = await setupRestStopTestServer();

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
  });

  t.after(() => {
    server.close();
    clearMockRestStopStore();
  });

  // Seed sample mock items
  function seedSampleRestStops() {
    const active1: MockRestStopItem = {
      _id: 'rs-active-1',
      id: 'rs-active-1',
      merchantId: merchant1Id,
      name: 'Chai Point Indiranagar',
      slug: 'chai-point-indiranagar',
      description: 'Comfortable seating with charging points and clean drinking water.',
      address: {
        street: '100 Feet Road',
        area: 'Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
      },
      location: {
        type: 'Point',
        coordinates: [77.6413, 12.9719],
      },
      facilities: [Facility.DRINKING_WATER, Facility.SEATING, Facility.CHARGING],
      images: ['https://example.com/chai1.jpg'],
      capacity: {
        maxRiders: 10,
        currentOccupancy: 2,
        status: CapacityStatus.AVAILABLE,
      },
      operatingHours: [
        { day: 'mon', openTime: '08:00', closeTime: '22:00', isOpen: true },
        { day: 'tue', openTime: '08:00', closeTime: '22:00', isOpen: true },
      ],
      status: RestStopStatus.ACTIVE,
      rating: { average: 4.8, count: 42 },
      dealBadge: '15% Off',
      dealDescription: 'Get 15% off hot chai and snacks',
      createdAt: new Date('2026-01-01T10:00:00Z'),
      updatedAt: new Date('2026-01-01T10:00:00Z'),
    };

    const active2: MockRestStopItem = {
      _id: 'rs-active-2',
      id: 'rs-active-2',
      merchantId: merchant2Id,
      name: 'QuickBite Koramangala',
      slug: 'quickbite-koramangala',
      description: 'Air-conditioned rest room with fast Wi-Fi and parking for two-wheelers.',
      address: {
        street: '80 Feet Road',
        area: 'Koramangala',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560034',
      },
      location: {
        type: 'Point',
        coordinates: [77.6200, 12.9352],
      },
      facilities: [Facility.DRINKING_WATER, Facility.WIFI, Facility.PARKING, Facility.AIR_CONDITIONING],
      images: ['https://example.com/qb.jpg'],
      capacity: {
        maxRiders: 15,
        currentOccupancy: 5,
        status: CapacityStatus.BUSY,
      },
      operatingHours: [],
      status: RestStopStatus.ACTIVE,
      rating: { average: 4.5, count: 18 },
      createdAt: new Date('2026-01-02T10:00:00Z'),
      updatedAt: new Date('2026-01-02T10:00:00Z'),
    };

    const pendingItem: MockRestStopItem = {
      _id: 'rs-pending-1',
      id: 'rs-pending-1',
      merchantId: merchant1Id,
      name: 'Pending Dhaba Hebbal',
      slug: 'pending-dhaba-hebbal',
      description: 'Under review dhaba near Hebbal flyover.',
      address: {
        street: 'Bellary Road',
        area: 'Hebbal',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560024',
      },
      location: {
        type: 'Point',
        coordinates: [77.5912, 13.0358],
      },
      facilities: [Facility.DRINKING_WATER],
      images: [],
      capacity: {
        maxRiders: 8,
        currentOccupancy: 0,
        status: CapacityStatus.AVAILABLE,
      },
      operatingHours: [],
      status: RestStopStatus.PENDING_APPROVAL,
      rating: { average: 0, count: 0 },
      createdAt: new Date('2026-01-03T10:00:00Z'),
      updatedAt: new Date('2026-01-03T10:00:00Z'),
    };

    const suspendedItem: MockRestStopItem = {
      _id: 'rs-suspended-1',
      id: 'rs-suspended-1',
      merchantId: merchant2Id,
      name: 'Suspended Cafe Jayanagar',
      slug: 'suspended-cafe-jayanagar',
      description: 'Temporarily suspended due to renovation.',
      address: {
        street: '4th Block',
        area: 'Jayanagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560011',
      },
      location: {
        type: 'Point',
        coordinates: [77.5833, 12.9299],
      },
      facilities: [Facility.SEATING],
      images: [],
      capacity: {
        maxRiders: 5,
        currentOccupancy: 0,
        status: CapacityStatus.FULL,
      },
      operatingHours: [],
      status: RestStopStatus.SUSPENDED,
      rating: { average: 3.2, count: 5 },
      createdAt: new Date('2026-01-04T10:00:00Z'),
      updatedAt: new Date('2026-01-04T10:00:00Z'),
    };

    mockRestStopStore.set(active1.id, active1);
    mockRestStopStore.set(active2.id, active2);
    mockRestStopStore.set(pendingItem.id, pendingItem);
    mockRestStopStore.set(suspendedItem.id, suspendedItem);
  }

  // ==========================================
  // 1. Public Discovery Endpoints
  // ==========================================
  await t.test('1. Public Discovery (GET /api/v1/rest-stops and /:slug)', async (sub) => {
    sub.beforeEach(() => {
      seedSampleRestStops();
    });

    await sub.test('Public listing returns ONLY approved/active rest stops', async () => {
      const res = await fetch(`${baseUrl}/api/v1/rest-stops`);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.items.length, 2); // Only 2 active items out of 4 total

      const slugs = json.data.items.map((i: any) => i.slug);
      assert.ok(slugs.includes('chai-point-indiranagar'));
      assert.ok(slugs.includes('quickbite-koramangala'));
      assert.ok(!slugs.includes('pending-dhaba-hebbal'));
      assert.ok(!slugs.includes('suspended-cafe-jayanagar'));
    });

    await sub.test('Pagination parameters work correctly with metadata', async () => {
      const res = await fetch(`${baseUrl}/api/v1/rest-stops?page=1&limit=1`);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.data.items.length, 1);
      assert.equal(json.data.pagination.page, 1);
      assert.equal(json.data.pagination.limit, 1);
      assert.equal(json.data.pagination.total, 2);
      assert.equal(json.data.pagination.totalPages, 2);
      assert.equal(json.data.pagination.hasNextPage, true);
      assert.equal(json.data.pagination.hasPrevPage, false);
    });

    await sub.test('Page size limit is capped at 50 to prevent unbounded queries', async () => {
      const res = await fetch(`${baseUrl}/api/v1/rest-stops?limit=100`);
      assert.equal(res.status, 400); // Exceeds max 50 validation constraint
    });

    await sub.test('Filtering by facility returns only matching rest stops', async () => {
      // Look for wifi (only QuickBite has wifi)
      const res = await fetch(`${baseUrl}/api/v1/rest-stops?facilities=wifi`);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.data.items.length, 1);
      assert.equal(json.data.items[0].slug, 'quickbite-koramangala');
    });

    await sub.test('Search filter performs case-insensitive match on name or area', async () => {
      const res = await fetch(`${baseUrl}/api/v1/rest-stops?search=indiranagar`);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.data.items.length, 1);
      assert.equal(json.data.items[0].slug, 'chai-point-indiranagar');
    });

    await sub.test('City filter isolates rest stops by city', async () => {
      const res = await fetch(`${baseUrl}/api/v1/rest-stops?city=Bengaluru`);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.data.items.length, 2);

      const resOther = await fetch(`${baseUrl}/api/v1/rest-stops?city=Mumbai`);
      assert.equal(resOther.status, 200);
      const jsonOther = await resOther.json();
      assert.equal(jsonOther.data.items.length, 0);
    });

    await sub.test('Arbitrary sort fields are rejected or fall back to allowlist', async () => {
      const res = await fetch(`${baseUrl}/api/v1/rest-stops?sort=malicious_sort`);
      assert.equal(res.status, 400); // Invalid sort enum rejected by Zod
    });

    await sub.test('GET /:slug returns active rest stop by slug with safe DTO', async () => {
      const res = await fetch(`${baseUrl}/api/v1/rest-stops/chai-point-indiranagar`);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.slug, 'chai-point-indiranagar');
      assert.equal(json.data.name, 'Chai Point Indiranagar');
      assert.equal(json.data.address.city, 'Bengaluru');
      assert.equal(json.data.status, undefined); // Status excluded from public DTO
      assert.equal(json.data.merchantId, undefined); // Merchant ID excluded from public DTO
    });

    await sub.test('GET /:slug returns 404 for unknown slug', async () => {
      const res = await fetch(`${baseUrl}/api/v1/rest-stops/non-existent-stop`);
      assert.equal(res.status, 404);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.ok(json.message.includes('not found'));
    });

    await sub.test('GET /:slug returns 404 for pending or suspended rest stop', async () => {
      const resPending = await fetch(`${baseUrl}/api/v1/rest-stops/pending-dhaba-hebbal`);
      assert.equal(resPending.status, 404);

      const resSuspended = await fetch(`${baseUrl}/api/v1/rest-stops/suspended-cafe-jayanagar`);
      assert.equal(resSuspended.status, 404);
    });
  });

  // ==========================================
  // 2. Merchant Create and Update
  // ==========================================
  await t.test('2. Merchant Create & Update (POST and PATCH /api/v1/rest-stops)', async (sub) => {
    sub.beforeEach(() => {
      seedSampleRestStops();
    });

    await sub.test('Unauthenticated user cannot create a rest stop (HTTP 401)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/rest-stops`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Unauthorized Stop' }),
      });
      assert.equal(res.status, 401);
    });

    await sub.test('Rider role cannot create a rest stop (HTTP 403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/rest-stops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${riderToken}`,
        },
        body: JSON.stringify({
          name: 'Rider Attempt Stop',
          description: 'A rider should not be allowed to post a rest stop location.',
          address: {
            street: 'MG Road',
            area: 'Central',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560001',
          },
          location: { type: 'Point', coordinates: [77.59, 12.97] },
          facilities: [Facility.DRINKING_WATER],
          capacity: { maxRiders: 5 },
        }),
      });
      assert.equal(res.status, 403);
    });

    await sub.test('Merchant successfully creates a rest stop with pending_approval status', async () => {
      const newStopPayload = {
        name: 'New Tea Cafe Whitefield',
        description: 'Spacious rest area for delivery riders with free tea and seating.',
        address: {
          street: 'ITPL Main Road',
          area: 'Whitefield',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560066',
        },
        location: {
          type: 'Point',
          coordinates: [77.7499, 12.9698],
        },
        facilities: [Facility.DRINKING_WATER, Facility.SEATING, Facility.CHARGING],
        capacity: {
          maxRiders: 12,
        },
        operatingHours: [
          { day: 'mon', openTime: '09:00', closeTime: '21:00', isOpen: true },
        ],
      };

      const res = await fetch(`${baseUrl}/api/v1/rest-stops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchant1Token}`,
        },
        body: JSON.stringify(newStopPayload),
      });

      assert.equal(res.status, 201);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.name, 'New Tea Cafe Whitefield');
      assert.equal(json.data.merchantId, merchant1Id); // Ownership derived from token
      assert.equal(json.data.status, RestStopStatus.PENDING_APPROVAL); // Always pending approval initially
      assert.ok(typeof json.data.slug === 'string');
    });

    await sub.test('Client cannot inject merchantId, status, or rating in POST request', async () => {
      const exploitPayload = {
        name: 'Exploit Attempt Stop',
        description: 'Attempting to inject admin approval and fake merchant ID.',
        address: {
          street: 'Kengeri Ring Rd',
          area: 'Kengeri',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560060',
        },
        location: { type: 'Point', coordinates: [77.48, 12.91] },
        facilities: [Facility.DRINKING_WATER],
        capacity: { maxRiders: 5 },
        // Malicious fields:
        merchantId: 'hacked-merchant-id',
        status: RestStopStatus.ACTIVE,
        rating: { average: 5.0, count: 999 },
      };

      const res = await fetch(`${baseUrl}/api/v1/rest-stops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchant1Token}`,
        },
        body: JSON.stringify(exploitPayload),
      });

      // Strict validation rejects unexpected extra keys
      assert.equal(res.status, 400);
    });

    await sub.test('Duplicate slug creation is rejected with HTTP 409 Conflict', async () => {
      const duplicatePayload = {
        name: 'Another Chai Point',
        slug: 'chai-point-indiranagar', // already exists in seeded data
        description: 'Attempting to create another rest stop with existing slug.',
        address: {
          street: '100 Feet Rd',
          area: 'Indiranagar',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560038',
        },
        location: { type: 'Point', coordinates: [77.64, 12.97] },
        facilities: [Facility.DRINKING_WATER],
        capacity: { maxRiders: 5 },
      };

      const res = await fetch(`${baseUrl}/api/v1/rest-stops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchant1Token}`,
        },
        body: JSON.stringify(duplicatePayload),
      });

      assert.equal(res.status, 409);
      const json = await res.json();
      assert.ok(json.error.includes('Conflict'));
    });

    await sub.test('Merchant successfully updates their own rest stop (HTTP 200)', async () => {
      const updatePayload = {
        name: 'Chai Point Indiranagar — Renovated',
        description: 'Updated description: now with 15 seats and enhanced charging station.',
        capacity: {
          maxRiders: 15,
          status: CapacityStatus.AVAILABLE,
        },
      };

      const res = await fetch(`${baseUrl}/api/v1/rest-stops/rs-active-1`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchant1Token}`,
        },
        body: JSON.stringify(updatePayload),
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.data.name, 'Chai Point Indiranagar — Renovated');
      assert.equal(json.data.capacity.maxRiders, 15);
    });

    await sub.test('Merchant cannot update another merchant rest stop (HTTP 403 Forbidden)', async () => {
      // Merchant 2 attempts to patch Merchant 1's rest stop (rs-active-1)
      const res = await fetch(`${baseUrl}/api/v1/rest-stops/rs-active-1`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchant2Token}`,
        },
        body: JSON.stringify({ name: 'Hacked Name' }),
      });

      assert.equal(res.status, 403);
      const json = await res.json();
      assert.ok(json.error.includes('Forbidden'));
    });

    await sub.test('Merchant PATCH cannot modify protected fields like status or merchantId (HTTP 400)', async () => {
      const maliciousPatch = {
        status: RestStopStatus.ACTIVE,
        merchantId: 'new-owner',
      };

      const res = await fetch(`${baseUrl}/api/v1/rest-stops/rs-active-1`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchant1Token}`,
        },
        body: JSON.stringify(maliciousPatch),
      });

      assert.equal(res.status, 400); // Strict schema rejects status and merchantId
    });

    await sub.test('Merchant PATCH returns 404 for nonexistent rest stop ID', async () => {
      const res = await fetch(`${baseUrl}/api/v1/rest-stops/nonexistent-id-999`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchant1Token}`,
        },
        body: JSON.stringify({ name: 'Updated Name' }),
      });

      assert.equal(res.status, 404);
    });
  });

  // ==========================================
  // 3. Admin Moderation
  // ==========================================
  await t.test('3. Admin Moderation (GET and PATCH /api/v1/admin/rest-stops)', async (sub) => {
    sub.beforeEach(() => {
      seedSampleRestStops();
    });

    await sub.test('Unauthenticated caller cannot access admin routes (HTTP 401)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/rest-stops`);
      assert.equal(res.status, 401);
    });

    await sub.test('Riders and merchants cannot access admin routes (HTTP 403)', async () => {
      const resRider = await fetch(`${baseUrl}/api/v1/admin/rest-stops`, {
        headers: { Authorization: `Bearer ${riderToken}` },
      });
      assert.equal(resRider.status, 403);

      const resMerchant = await fetch(`${baseUrl}/api/v1/admin/rest-stops`, {
        headers: { Authorization: `Bearer ${merchant1Token}` },
      });
      assert.equal(resMerchant.status, 403);
    });

    await sub.test('Admin can list rest stops with all statuses and metadata (HTTP 200)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/rest-stops`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.items.length, 4); // All 4 items returned (active, pending, suspended)
      assert.ok(json.data.items[0].merchantId);
      assert.ok(json.data.items[0].status);
    });

    await sub.test('Admin can filter by status (e.g. pending_approval)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/rest-stops?status=pending_approval`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.data.items.length, 1);
      assert.equal(json.data.items[0].slug, 'pending-dhaba-hebbal');
    });

    await sub.test('Admin successfully approves a pending rest stop (HTTP 200)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/rest-stops/rs-pending-1/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: RestStopStatus.ACTIVE }),
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.data.status, RestStopStatus.ACTIVE);

      // Verify that approved stop is now visible on public discovery endpoint
      const publicRes = await fetch(`${baseUrl}/api/v1/rest-stops/pending-dhaba-hebbal`);
      assert.equal(publicRes.status, 200);
    });

    await sub.test('Admin successfully suspends an active rest stop (HTTP 200)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/rest-stops/rs-active-1/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: RestStopStatus.SUSPENDED,
          reason: 'Maintenance violation reported',
        }),
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.data.status, RestStopStatus.SUSPENDED);

      // Verify suspended stop is no longer accessible publicly
      const publicRes = await fetch(`${baseUrl}/api/v1/rest-stops/chai-point-indiranagar`);
      assert.equal(publicRes.status, 404);
    });

    await sub.test('Admin status update rejects invalid status values (HTTP 400)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/rest-stops/rs-active-1/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: 'invalid_status_xyz' }),
      });

      assert.equal(res.status, 400);
    });

    await sub.test('Admin status update rejects extraneous protected fields (HTTP 400)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/rest-stops/rs-active-1/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: RestStopStatus.ACTIVE,
          name: 'Hacked Name In Status Endpoint',
        }),
      });

      assert.equal(res.status, 400); // Strict schema rejection
    });
  });

  // ==============================================================
  // 4. Merchant Isolated Rest-Stop Management (Phase 6B)
  // ==============================================================
  await t.test('4. Merchant Isolated Listing & Ownership (GET /api/v1/merchant/rest-stops and /:id)', async (sub) => {
    sub.beforeEach(() => {
      clearMockRestStopStore();
      seedSampleRestStops();
    });

    await sub.test('Unauthenticated user cannot list merchant rest stops (HTTP 401)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/merchant/rest-stops`);
      assert.equal(res.status, 401);
    });

    await sub.test('Rider role cannot access merchant rest stops (HTTP 403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/merchant/rest-stops`, {
        headers: { Authorization: `Bearer ${riderToken}` },
      });
      assert.equal(res.status, 403);
    });

    await sub.test('Merchant 1 only sees their own rest stops across all statuses', async () => {
      const res = await fetch(`${baseUrl}/api/v1/merchant/rest-stops`, {
        headers: { Authorization: `Bearer ${merchant1Token}` },
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(Array.isArray(json.data.items));
      // Merchant 1 owns rs-active-1 and rs-pending-1; merchant 2 owns rs-active-2
      assert.equal(json.data.items.length, 2);
      const ids = json.data.items.map((item: any) => item.id);
      assert.ok(ids.includes('rs-active-1'));
      assert.ok(ids.includes('rs-pending-1'));
      assert.ok(!ids.includes('rs-active-2')); // Isolated from merchant 2!
      // Verify pagination meta
      assert.equal(json.data.pagination.total, 2);
    });

    await sub.test('Merchant 1 can filter owned venues by status (pending_approval)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/merchant/rest-stops?status=pending_approval`, {
        headers: { Authorization: `Bearer ${merchant1Token}` },
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.data.items.length, 1);
      assert.equal(json.data.items[0].id, 'rs-pending-1');
      assert.equal(json.data.items[0].status, RestStopStatus.PENDING_APPROVAL);
    });

    await sub.test('Merchant 1 can search owned venues by keyword', async () => {
      const res = await fetch(`${baseUrl}/api/v1/merchant/rest-stops?search=Hebbal`, {
        headers: { Authorization: `Bearer ${merchant1Token}` },
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.data.items.length, 1);
      assert.equal(json.data.items[0].id, 'rs-pending-1');
    });

    await sub.test('Merchant 1 can fetch their own rest stop by ID (HTTP 200)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/merchant/rest-stops/rs-active-1`, {
        headers: { Authorization: `Bearer ${merchant1Token}` },
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.id, 'rs-active-1');
      assert.equal(json.data.merchantId, merchant1Id);
    });

    await sub.test('Merchant 2 is denied access to Merchant 1 rest stop by ID (HTTP 403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/merchant/rest-stops/rs-active-1`, {
        headers: { Authorization: `Bearer ${merchant2Token}` },
      });

      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.match(json.message, /permission/i);
    });

    await sub.test('Returns 404 for nonexistent rest stop ID for merchant', async () => {
      const res = await fetch(`${baseUrl}/api/v1/merchant/rest-stops/rs-nonexistent-999`, {
        headers: { Authorization: `Bearer ${merchant1Token}` },
      });

      assert.equal(res.status, 404);
    });
  });
});

