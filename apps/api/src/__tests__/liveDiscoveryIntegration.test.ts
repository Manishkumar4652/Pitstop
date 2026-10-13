import test from 'node:test';
import assert from 'node:assert/strict';
import { Server } from 'http';
import mongoose from 'mongoose';
import { createApp } from '../app';
import { config } from '../config/env';
import {
  RestStopStatus,
  CapacityStatus,
  Facility,
} from 'shared-types';
import {
  mockRestStopStore,
  clearMockRestStopStore,
  MockRestStopItem,
} from '../controllers/restStopMockStore';
import { isDatabaseConnected } from '../config/database';

function startTestExpressApp() {
  const app = createApp();
  return new Promise<{ server: Server; baseUrl: string }>((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        throw new Error('Failed to bind Express test server');
      }
      resolve({ server, baseUrl: `http://127.0.0.1:${address.port}` });
    });
  });
}

const SEED_ACTIVE_STOPS: MockRestStopItem[] = [
  {
    _id: 'rs-indiranagar-01',
    id: 'rs-indiranagar-01',
    merchantId: 'merchant-user-secret-123', // Private field that MUST NOT be exposed
    name: 'Chai Point Indiranagar',
    slug: 'chai-point-indiranagar',
    description: 'Clean RO drinking water, charging stations, and dedicated seating for riders.',
    address: {
      street: '100 Feet Road',
      area: 'Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      landmark: 'Near 12th Main Junction',
    },
    location: { type: 'Point', coordinates: [77.6408, 12.9719] },
    facilities: [Facility.DRINKING_WATER, Facility.CHARGING, Facility.SEATING],
    images: [],
    capacity: { maxRiders: 15, currentOccupancy: 4, status: CapacityStatus.AVAILABLE },
    operatingHours: [{ day: 'mon', openTime: '07:00', closeTime: '23:00', isOpen: true }],
    rating: { average: 4.8, count: 124 },
    status: RestStopStatus.ACTIVE,
    dealBadge: 'Chai + Samosa ₹30',
    dealDescription: 'Hot tea and fresh snack for active delivery partners.',
    createdAt: new Date('2026-01-01T10:00:00Z'),
    updatedAt: new Date('2026-01-01T10:00:00Z'),
  },
  {
    _id: 'rs-koramangala-02',
    id: 'rs-koramangala-02',
    merchantId: 'merchant-user-secret-456',
    name: 'Koramangala Refresh Hub',
    slug: 'koramangala-refresh-hub',
    description: 'Restroom, RO water, and high-speed device charging.',
    address: {
      street: '80 Feet Road, 4th Block',
      area: 'Koramangala',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560034',
    },
    location: { type: 'Point', coordinates: [77.6245, 12.9352] },
    facilities: [Facility.RESTROOM, Facility.DRINKING_WATER, Facility.CHARGING],
    images: [],
    capacity: { maxRiders: 10, currentOccupancy: 8, status: CapacityStatus.BUSY },
    operatingHours: [{ day: 'mon', openTime: '08:00', closeTime: '22:00', isOpen: true }],
    rating: { average: 4.5, count: 88 },
    status: RestStopStatus.ACTIVE,
    createdAt: new Date('2026-01-02T10:00:00Z'),
    updatedAt: new Date('2026-01-02T10:00:00Z'),
  },
  {
    _id: 'rs-delhi-03',
    id: 'rs-delhi-03',
    merchantId: 'merchant-user-secret-789',
    name: 'Connaught Place PitStop',
    slug: 'connaught-place-pitstop',
    description: 'Central Delhi rest stop with parking and washrooms.',
    address: {
      street: 'Inner Circle',
      area: 'Connaught Place',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
    },
    location: { type: 'Point', coordinates: [77.2197, 28.6328] },
    facilities: [Facility.RESTROOM, Facility.PARKING, Facility.DRINKING_WATER],
    images: [],
    capacity: { maxRiders: 20, currentOccupancy: 2, status: CapacityStatus.AVAILABLE },
    operatingHours: [{ day: 'mon', openTime: '06:00', closeTime: '23:30', isOpen: true }],
    rating: { average: 4.2, count: 45 },
    status: RestStopStatus.ACTIVE,
    createdAt: new Date('2026-01-03T10:00:00Z'),
    updatedAt: new Date('2026-01-03T10:00:00Z'),
  },
  {
    _id: 'rs-pending-04',
    id: 'rs-pending-04',
    merchantId: 'merchant-user-secret-999',
    name: 'Unverified Venue Under Review',
    slug: 'unverified-venue-under-review',
    description: 'This venue should never be returned by public discovery.',
    address: {
      street: 'Outer Ring Road',
      area: 'Bellandur',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560103',
    },
    location: { type: 'Point', coordinates: [77.6743, 12.926] },
    facilities: [Facility.DRINKING_WATER],
    images: [],
    capacity: { maxRiders: 5, currentOccupancy: 0, status: CapacityStatus.AVAILABLE },
    operatingHours: [],
    rating: { average: 0, count: 0 },
    status: RestStopStatus.PENDING_APPROVAL, // MUST NOT BE RETURNED
    createdAt: new Date('2026-01-04T10:00:00Z'),
    updatedAt: new Date('2026-01-04T10:00:00Z'),
  },
];

test('Live Express API Public Discovery Integration Suite (Phase 4B)', async (t) => {
  const { server, baseUrl } = await startTestExpressApp();

  t.beforeEach(() => {
    clearMockRestStopStore();
    for (const stop of SEED_ACTIVE_STOPS) {
      mockRestStopStore.set(stop.id, { ...stop });
    }
  });

  t.after(() => {
    server.close();
    clearMockRestStopStore();
  });

  // ==========================================
  // 1. Server Health Endpoints
  // ==========================================
  await t.test('Top-level /health responds with 200 and expected service info', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'PitStop REST API');
    assert.ok(typeof body.uptimeSeconds === 'number');
  });

  await t.test('Versioned /api/v1/health responds with 200 and database status envelope', async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.status, 'ok');
    assert.ok('database' in body.data);
  });

  // ==========================================
  // 2. Public List Endpoint & Query Filters
  // ==========================================
  await t.test('GET /api/v1/rest-stops returns only ACTIVE stops with pagination metadata', async () => {
    const res = await fetch(`${baseUrl}/api/v1/rest-stops`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data.items));
    assert.equal(body.data.items.length, 3); // 3 active, 1 pending excluded!
    assert.equal(body.data.pagination.total, 3);
    assert.equal(body.data.pagination.page, 1);
    assert.equal(body.data.pagination.limit, 10);
  });

  await t.test('GET /api/v1/rest-stops filters accurately by city', async () => {
    const res = await fetch(`${baseUrl}/api/v1/rest-stops?city=Bengaluru`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.items.length, 2);
    for (const item of body.data.items) {
      assert.equal(item.address.city, 'Bengaluru');
    }
  });

  await t.test('GET /api/v1/rest-stops filters accurately by facilities (all required)', async () => {
    const res = await fetch(
      `${baseUrl}/api/v1/rest-stops?facilities=${Facility.RESTROOM},${Facility.PARKING}`
    );
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.items.length, 1);
    assert.equal(body.data.items[0].slug, 'connaught-place-pitstop');
  });

  await t.test('GET /api/v1/rest-stops filters accurately by search keyword', async () => {
    const res = await fetch(`${baseUrl}/api/v1/rest-stops?search=Indiranagar`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.items.length, 1);
    assert.equal(body.data.items[0].slug, 'chai-point-indiranagar');
  });

  await t.test('GET /api/v1/rest-stops respects pagination limits and page boundaries', async () => {
    const res = await fetch(`${baseUrl}/api/v1/rest-stops?page=1&limit=2`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.items.length, 2);
    assert.equal(body.data.pagination.total, 3);
    assert.equal(body.data.pagination.totalPages, 2);
    assert.equal(body.data.pagination.hasNextPage, true);
    assert.equal(body.data.pagination.hasPrevPage, false);

    // Page 2
    const res2 = await fetch(`${baseUrl}/api/v1/rest-stops?page=2&limit=2`);
    assert.equal(res2.status, 200);
    const body2 = await res2.json();
    assert.equal(body2.data.items.length, 1);
    assert.equal(body2.data.pagination.hasNextPage, false);
    assert.equal(body2.data.pagination.hasPrevPage, true);
  });

  // ==========================================
  // 3. Public Data Privacy & Zero Leaks
  // ==========================================
  await t.test('Public response never leaks merchantId, internal notes, or private credentials', async () => {
    const res = await fetch(`${baseUrl}/api/v1/rest-stops`);
    const body = await res.json();
    for (const item of body.data.items) {
      assert.equal((item as any).merchantId, undefined);
      assert.equal((item as any).internalNotes, undefined);
      assert.equal((item as any).rejectionReason, undefined);
      assert.equal((item as any).password, undefined);
    }
  });

  // ==========================================
  // 4. Detail Endpoint & Slug Resolution
  // ==========================================
  await t.test('GET /api/v1/rest-stops/:slug returns active venue detail without leaks', async () => {
    const res = await fetch(`${baseUrl}/api/v1/rest-stops/chai-point-indiranagar`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.name, 'Chai Point Indiranagar');
    assert.equal(body.data.dealBadge, 'Chai + Samosa ₹30');
    assert.equal((body.data as any).merchantId, undefined);
  });

  await t.test('GET /api/v1/rest-stops/:slug returns 404 for unknown slug', async () => {
    const res = await fetch(`${baseUrl}/api/v1/rest-stops/non-existent-venue-slug`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /not found/i);
  });

  await t.test('GET /api/v1/rest-stops/:slug returns 404 for non-active venue', async () => {
    const res = await fetch(`${baseUrl}/api/v1/rest-stops/unverified-venue-under-review`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /not found or is not active/i);
  });

  // ==========================================
  // 5. Query Parameter Validation & Error Handling
  // ==========================================
  await t.test('GET /api/v1/rest-stops rejects malformed limit parameter with 400', async () => {
    const res = await fetch(`${baseUrl}/api/v1/rest-stops?limit=100`);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error, 'Validation Error');
  });

  await t.test('GET /api/v1/rest-stops rejects invalid sort option with 400', async () => {
    const res = await fetch(`${baseUrl}/api/v1/rest-stops?sort=unsupported_sort`);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error, 'Validation Error');
  });
});
