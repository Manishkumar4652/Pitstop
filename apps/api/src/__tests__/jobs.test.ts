import test from 'node:test';
import assert from 'node:assert/strict';
import { Server } from 'http';
import { UserRole, RestStopStatus, CapacityStatus, Facility, JobCategory, JobStatus, JobApplicationStatus } from 'shared-types';
import { createApp } from '../app';
import { config } from '../config/env';
import { signAccessToken } from '../utils/jwt';
import {
  mockRestStopStore,
  clearMockRestStopStore,
  MockRestStopItem,
} from '../controllers/restStopMockStore';
import {
  mockJobStore,
  clearMockJobStore,
  MockJobItem,
} from '../controllers/jobMockStore';
import {
  mockJobApplicationStore,
  clearMockJobApplicationStore,
} from '../controllers/jobApplicationMockStore';

const TEST_JWT_SECRET = 'a_very_secure_test_jwt_secret_that_has_at_least_32_characters_for_testing';

function setupJobTestServer() {
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

test('Micro-Jobs APIs & Merchant Access Control Test Suite (Phase 3D2B1)', async (t) => {
  const { server, baseUrl } = await setupJobTestServer();

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
    clearMockJobStore();
    clearMockJobApplicationStore();
  });

  t.after(() => {
    server.close();
    clearMockRestStopStore();
    clearMockJobStore();
    clearMockJobApplicationStore();
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
      description: 'Pending verification and store audit.',
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
      description: 'Suspended venue due to reported outages.',
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

    const now = new Date();
    const future1h = new Date(now.getTime() + 1 * 3600 * 1000);
    const future3h = new Date(now.getTime() + 3 * 3600 * 1000);
    const future4h = new Date(now.getTime() + 4 * 3600 * 1000);
    const past2h = new Date(now.getTime() - 2 * 3600 * 1000);
    const past1h = new Date(now.getTime() - 1 * 3600 * 1000);

    // Jobs
    const jobOpen1: MockJobItem = {
      _id: 'job-open-1',
      id: 'job-open-1',
      merchantId: merchant1Id,
      restStopId: 'rs-active-1',
      title: 'Afternoon Parcel Sorting Assistant',
      description: 'Help kitchen desk arrange dispatch bags by delivery zone cluster.',
      category: JobCategory.PARCEL_SORTING,
      payAmount: 250,
      payType: 'fixed',
      durationMinutes: 90,
      startTime: future1h,
      endTime: future3h,
      requiredRiders: 2,
      acceptedRidersCount: 0,
      status: JobStatus.OPEN,
      instructions: 'Report to store counter with delivery partner ID badge.',
      createdAt: new Date('2026-01-05T10:00:00Z'),
      updatedAt: new Date('2026-01-05T10:00:00Z'),
    };

    const jobOpen2: MockJobItem = {
      _id: 'job-open-2',
      id: 'job-open-2',
      merchantId: merchant1Id,
      restStopId: 'rs-active-1',
      title: 'Evening Prep Station Clean & Assist',
      description: 'Sanitize tea brewing stations and arrange paper cup stacks.',
      category: JobCategory.CLEANING_PREP,
      payAmount: 180,
      payType: 'fixed',
      durationMinutes: 60,
      startTime: future1h,
      endTime: future4h,
      requiredRiders: 1,
      acceptedRidersCount: 0,
      status: JobStatus.OPEN,
      instructions: 'Wear clean gloves provided at the entrance desk.',
      createdAt: new Date('2026-01-06T10:00:00Z'),
      updatedAt: new Date('2026-01-06T10:00:00Z'),
    };

    const jobOpen3: MockJobItem = {
      _id: 'job-open-3',
      id: 'job-open-3',
      merchantId: merchant2Id,
      restStopId: 'rs-active-2',
      title: 'Store Assistant Peak Hour Support',
      description: 'Help hand over prepared takeaway packages to waiting delivery partners.',
      category: JobCategory.STORE_ASSISTANT,
      payAmount: 320,
      payType: 'hourly',
      durationMinutes: 120,
      startTime: future1h,
      endTime: future4h,
      requiredRiders: 3,
      acceptedRidersCount: 1, // 1 accepted, 2 spots remaining
      status: JobStatus.OPEN,
      instructions: 'Report to dispatch counter.',
      createdAt: new Date('2026-01-07T10:00:00Z'),
      updatedAt: new Date('2026-01-07T10:00:00Z'),
    };

    const jobFilled: MockJobItem = {
      _id: 'job-filled-1',
      id: 'job-filled-1',
      merchantId: merchant1Id,
      restStopId: 'rs-active-1',
      title: 'Fully Booked Delivery Sorting',
      description: 'All rider slots already filled.',
      category: JobCategory.PARCEL_SORTING,
      payAmount: 200,
      payType: 'fixed',
      durationMinutes: 60,
      startTime: future1h,
      endTime: future3h,
      requiredRiders: 1,
      acceptedRidersCount: 1, // Full!
      status: JobStatus.OPEN,
      instructions: 'Report to store counter.',
      createdAt: new Date('2026-01-08T10:00:00Z'),
      updatedAt: new Date('2026-01-08T10:00:00Z'),
    };

    const jobExpired: MockJobItem = {
      _id: 'job-expired-1',
      id: 'job-expired-1',
      merchantId: merchant1Id,
      restStopId: 'rs-active-1',
      title: 'Morning Breakfast Flyer Handout',
      description: 'Schedule has already passed.',
      category: JobCategory.FLYER_DISTRIBUTION,
      payAmount: 150,
      payType: 'fixed',
      durationMinutes: 45,
      startTime: past2h,
      endTime: past1h, // Past!
      requiredRiders: 1,
      acceptedRidersCount: 0,
      status: JobStatus.OPEN,
      instructions: 'Report to counter.',
      createdAt: new Date('2026-01-01T10:00:00Z'),
      updatedAt: new Date('2026-01-01T10:00:00Z'),
    };

    const jobCancelled: MockJobItem = {
      _id: 'job-cancelled-1',
      id: 'job-cancelled-1',
      merchantId: merchant1Id,
      restStopId: 'rs-active-1',
      title: 'Cancelled Loading Task',
      description: 'Cancelled by merchant.',
      category: JobCategory.LOADING_UNLOADING,
      payAmount: 300,
      payType: 'fixed',
      durationMinutes: 90,
      startTime: future1h,
      endTime: future3h,
      requiredRiders: 2,
      acceptedRidersCount: 0,
      status: JobStatus.CANCELLED,
      instructions: 'None',
      createdAt: new Date('2026-01-09T10:00:00Z'),
      updatedAt: new Date('2026-01-09T10:00:00Z'),
    };

    const jobCompleted: MockJobItem = {
      _id: 'job-completed-1',
      id: 'job-completed-1',
      merchantId: merchant1Id,
      restStopId: 'rs-active-1',
      title: 'Completed Inventory Audit',
      description: 'Completed yesterday.',
      category: JobCategory.OTHER,
      payAmount: 400,
      payType: 'fixed',
      durationMinutes: 120,
      startTime: past2h,
      endTime: past1h,
      requiredRiders: 1,
      acceptedRidersCount: 1,
      status: JobStatus.COMPLETED,
      instructions: 'Audit finished.',
      createdAt: new Date('2026-01-02T10:00:00Z'),
      updatedAt: new Date('2026-01-02T10:00:00Z'),
    };

    const jobPendingStop: MockJobItem = {
      _id: 'job-pending-stop',
      id: 'job-pending-stop',
      merchantId: merchant1Id,
      restStopId: 'rs-pending-1',
      title: 'Job on Unapproved Rest Stop',
      description: 'Should never be publicly visible.',
      category: JobCategory.STORE_ASSISTANT,
      payAmount: 250,
      payType: 'fixed',
      durationMinutes: 60,
      startTime: future1h,
      endTime: future3h,
      requiredRiders: 2,
      acceptedRidersCount: 0,
      status: JobStatus.OPEN,
      instructions: 'Report to desk.',
      createdAt: new Date('2026-01-10T10:00:00Z'),
      updatedAt: new Date('2026-01-10T10:00:00Z'),
    };

    const jobSuspendedStop: MockJobItem = {
      _id: 'job-suspended-stop',
      id: 'job-suspended-stop',
      merchantId: merchant2Id,
      restStopId: 'rs-suspended-1',
      title: 'Job on Suspended Rest Stop',
      description: 'Should never be publicly visible.',
      category: JobCategory.PARCEL_SORTING,
      payAmount: 220,
      payType: 'fixed',
      durationMinutes: 60,
      startTime: future1h,
      endTime: future3h,
      requiredRiders: 1,
      acceptedRidersCount: 0,
      status: JobStatus.OPEN,
      instructions: 'Report to desk.',
      createdAt: new Date('2026-01-11T10:00:00Z'),
      updatedAt: new Date('2026-01-11T10:00:00Z'),
    };

    mockJobStore.set(jobOpen1._id, jobOpen1);
    mockJobStore.set(jobOpen2._id, jobOpen2);
    mockJobStore.set(jobOpen3._id, jobOpen3);
    mockJobStore.set(jobFilled._id, jobFilled);
    mockJobStore.set(jobExpired._id, jobExpired);
    mockJobStore.set(jobCancelled._id, jobCancelled);
    mockJobStore.set(jobCompleted._id, jobCompleted);
    mockJobStore.set(jobPendingStop._id, jobPendingStop);
    mockJobStore.set(jobSuspendedStop._id, jobSuspendedStop);
  }

  // =========================================================================
  // 1. PUBLIC DISCOVERY (GET /api/v1/jobs and GET /api/v1/jobs/:id)
  // =========================================================================
  await t.test('1. Public Discovery (GET /api/v1/jobs and /:id)', async (sub) => {
    await sub.test('Public listing returns ONLY open, unfilled, future-dated jobs linked to active rest stops', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/jobs`);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(Array.isArray(json.data.items));

      // Out of 9 seeded jobs, only 3 meet all public visibility rules (jobOpen1, jobOpen2, jobOpen3)
      assert.equal(json.data.items.length, 3);
      const ids = json.data.items.map((j: any) => j.id);
      assert.ok(ids.includes('job-open-1'));
      assert.ok(ids.includes('job-open-2'));
      assert.ok(ids.includes('job-open-3'));

      // Ineligible jobs must NEVER appear
      assert.equal(ids.includes('job-filled-1'), false);
      assert.equal(ids.includes('job-expired-1'), false);
      assert.equal(ids.includes('job-cancelled-1'), false);
      assert.equal(ids.includes('job-completed-1'), false);
      assert.equal(ids.includes('job-pending-stop'), false);
      assert.equal(ids.includes('job-suspended-stop'), false);
    });

    await sub.test('Pagination parameters work correctly with metadata', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/jobs?page=1&limit=2`);
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
      const res2 = await fetch(`${baseUrl}/api/v1/jobs?page=2&limit=2`);
      const json2 = await res2.json();
      assert.equal(json2.data.items.length, 1);
      assert.equal(json2.data.pagination.page, 2);
      assert.equal(json2.data.pagination.hasNextPage, false);
      assert.equal(json2.data.pagination.hasPrevPage, true);
    });

    await sub.test('Page size limit is capped at 50 to prevent unbounded queries', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/jobs?limit=999`);
      assert.equal(res.status, 400); // Zod schema max(50) rejects limit over 50
    });

    await sub.test('Filtering by category isolates matching jobs', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/jobs?category=${JobCategory.CLEANING_PREP}`);
      assert.equal(res.status, 200);
      const json = await res.json();

      assert.equal(json.data.items.length, 1);
      assert.equal(json.data.items[0].id, 'job-open-2');
      assert.equal(json.data.items[0].category, JobCategory.CLEANING_PREP);
    });

    await sub.test('Filtering by restStopId isolates jobs for a specific venue', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/jobs?restStopId=rs-active-2`);
      assert.equal(res.status, 200);
      const json = await res.json();

      assert.equal(json.data.items.length, 1);
      assert.equal(json.data.items[0].id, 'job-open-3');
      assert.equal(json.data.items[0].restStopId, 'rs-active-2');
    });

    await sub.test('Search filter performs case-insensitive match on title or description', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/jobs?search=parcel`);
      assert.equal(res.status, 200);
      const json = await res.json();

      assert.equal(json.data.items.length, 1);
      assert.equal(json.data.items[0].id, 'job-open-1');
    });

    await sub.test('Sorting by pay_desc orders highest paying jobs first', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/jobs?sort=pay_desc`);
      assert.equal(res.status, 200);
      const json = await res.json();

      assert.equal(json.data.items.length, 3);
      assert.ok(json.data.items[0].payAmount >= json.data.items[1].payAmount);
      assert.ok(json.data.items[1].payAmount >= json.data.items[2].payAmount);

      // Invalid sort value rejected
      const resBad = await fetch(`${baseUrl}/api/v1/jobs?sort=injected_column`);
      assert.equal(resBad.status, 400);
    });

    await sub.test('GET /:id returns active job with safe DTO and venue name', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/jobs/job-open-1`);
      assert.equal(res.status, 200);
      const json = await res.json();

      assert.equal(json.success, true);
      assert.equal(json.data.id, 'job-open-1');
      assert.equal(json.data.title, 'Afternoon Parcel Sorting Assistant');
      assert.equal(json.data.restStopName, 'Chai Point Indiranagar');
      assert.equal(json.data.category, JobCategory.PARCEL_SORTING);
      assert.equal(json.data.payAmount, 250);
      assert.equal(json.data.status, JobStatus.OPEN);
      // Private merchant credentials must not appear in public DTO
      assert.equal(json.data.merchantId, undefined);
    });

    await sub.test('GET /:id returns 404 for unknown job ID', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/jobs/nonexistent-job-999`);
      assert.equal(res.status, 404);
    });

    await sub.test('GET /:id returns 404 for cancelled, completed, filled, expired, or pending stop jobs', async () => {
      seedSampleData();

      const resCancelled = await fetch(`${baseUrl}/api/v1/jobs/job-cancelled-1`);
      assert.equal(resCancelled.status, 404);

      const resCompleted = await fetch(`${baseUrl}/api/v1/jobs/job-completed-1`);
      assert.equal(resCompleted.status, 404);

      const resFilled = await fetch(`${baseUrl}/api/v1/jobs/job-filled-1`);
      assert.equal(resFilled.status, 404);

      const resExpired = await fetch(`${baseUrl}/api/v1/jobs/job-expired-1`);
      assert.equal(resExpired.status, 404);

      const resPendingStop = await fetch(`${baseUrl}/api/v1/jobs/job-pending-stop`);
      assert.equal(resPendingStop.status, 404);
    });
  });

  // =========================================================================
  // 2. MERCHANT OPERATIONS (POST /api/v1/jobs and PATCH /api/v1/jobs/:id)
  // =========================================================================
  await t.test('2. Merchant Create & Update (POST and PATCH /api/v1/jobs)', async (sub) => {
    const validStartTime = new Date(Date.now() + 2 * 3600 * 1000).toISOString();
    const validEndTime = new Date(Date.now() + 5 * 3600 * 1000).toISOString();

    await sub.test('Unauthenticated user cannot create a job (HTTP 401)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restStopId: 'rs-active-1',
          title: 'Unauthenticated Task Title',
          description: 'Valid length description for testing unauth access.',
          category: JobCategory.PARCEL_SORTING,
          payAmount: 200,
          payType: 'fixed',
          durationMinutes: 60,
          startTime: validStartTime,
          endTime: validEndTime,
          instructions: 'Report to desk.',
        }),
      });

      assert.equal(res.status, 401);
    });

    await sub.test('Rider role cannot create a job (HTTP 403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${riderToken}`,
        },
        body: JSON.stringify({
          restStopId: 'rs-active-1',
          title: 'Rider Task Title Here',
          description: 'Valid length description for testing rider access rejection.',
          category: JobCategory.PARCEL_SORTING,
          payAmount: 200,
          payType: 'fixed',
          durationMinutes: 60,
          startTime: validStartTime,
          endTime: validEndTime,
          instructions: 'Report to desk.',
        }),
      });

      assert.equal(res.status, 403);
    });

    await sub.test('Merchant successfully creates a micro-job for their own active rest stop', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchant1Token}`,
        },
        body: JSON.stringify({
          restStopId: 'rs-active-1',
          title: 'Counter Package Organizer Afternoon',
          description: 'Organize incoming order bags onto designated delivery racks.',
          category: JobCategory.PARCEL_SORTING,
          payAmount: 240,
          payType: 'fixed',
          durationMinutes: 60,
          startTime: validStartTime,
          endTime: validEndTime,
          requiredRiders: 2,
          instructions: 'Wear clean partner jacket and present ID at counter.',
        }),
      });

      assert.equal(res.status, 201);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.title, 'Counter Package Organizer Afternoon');
      assert.equal(json.data.merchantId, merchant1Id);
      assert.equal(json.data.restStopId, 'rs-active-1');
      assert.equal(json.data.status, JobStatus.OPEN);
      assert.equal(json.data.acceptedRidersCount, 0);
    });

    await sub.test('Merchant cannot create a job for another merchant rest stop (HTTP 403 Forbidden)', async () => {
      seedSampleData();

      // merchant1 tries to post a job on rs-active-2 (owned by merchant2)
      const res = await fetch(`${baseUrl}/api/v1/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchant1Token}`,
        },
        body: JSON.stringify({
          restStopId: 'rs-active-2',
          title: 'Unauthorized Cross-Merchant Task',
          description: 'Testing cross-merchant venue post prevention.',
          category: JobCategory.PARCEL_SORTING,
          payAmount: 200,
          payType: 'fixed',
          durationMinutes: 60,
          startTime: validStartTime,
          endTime: validEndTime,
          instructions: 'Report to desk.',
        }),
      });

      assert.equal(res.status, 403);
      const json = await res.json();
      assert.ok(json.message.includes('do not own this rest stop'));
    });

    await sub.test('Merchant cannot create a job on a pending or suspended rest stop (HTTP 400)', async () => {
      seedSampleData();

      // merchant1 owns rs-pending-1, but rest stop is pending approval
      const res = await fetch(`${baseUrl}/api/v1/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchant1Token}`,
        },
        body: JSON.stringify({
          restStopId: 'rs-pending-1',
          title: 'Premature Job on Pending Venue',
          description: 'Testing unapproved venue job posting prevention.',
          category: JobCategory.STORE_ASSISTANT,
          payAmount: 250,
          payType: 'fixed',
          durationMinutes: 60,
          startTime: validStartTime,
          endTime: validEndTime,
          instructions: 'Report to desk.',
        }),
      });

      assert.equal(res.status, 400);
      const json = await res.json();
      assert.ok(json.message.includes('not approved and active'));
    });

    await sub.test('Rejects job creation with endTime before startTime (HTTP 400)', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchant1Token}`,
        },
        body: JSON.stringify({
          restStopId: 'rs-active-1',
          title: 'Invalid Inverted Timing Job',
          description: 'Testing inverted start and end time rejection.',
          category: JobCategory.PARCEL_SORTING,
          payAmount: 200,
          payType: 'fixed',
          durationMinutes: 60,
          startTime: validEndTime,
          endTime: validStartTime, // End before start
          instructions: 'Report to desk.',
        }),
      });

      assert.equal(res.status, 400);
    });

    await sub.test('Rejects job creation with duration under 15 minutes (HTTP 400)', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchant1Token}`,
        },
        body: JSON.stringify({
          restStopId: 'rs-active-1',
          title: 'Short Duration Sub-15 Job',
          description: 'Testing duration under fifteen minutes rejection.',
          category: JobCategory.PARCEL_SORTING,
          payAmount: 200,
          payType: 'fixed',
          durationMinutes: 10, // Under 15
          startTime: validStartTime,
          endTime: validEndTime,
          instructions: 'Report to desk.',
        }),
      });

      assert.equal(res.status, 400);
    });

    await sub.test('Client cannot inject merchantId or status in POST request (HTTP 400 due to .strict())', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchant1Token}`,
        },
        body: JSON.stringify({
          restStopId: 'rs-active-1',
          title: 'Attempt Injected Merchant ID',
          description: 'Testing rejection of client-supplied merchantId.',
          category: JobCategory.PARCEL_SORTING,
          payAmount: 200,
          payType: 'fixed',
          durationMinutes: 60,
          startTime: validStartTime,
          endTime: validEndTime,
          instructions: 'Report to desk.',
          merchantId: 'injected-attacker-id',
        }),
      });

      assert.equal(res.status, 400);
    });

    await sub.test('Merchant successfully updates their own job', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/jobs/job-open-1`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchant1Token}`,
        },
        body: JSON.stringify({
          title: 'Updated Afternoon Parcel Sorting Assistant',
          payAmount: 280,
          durationMinutes: 100,
        }),
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.data.title, 'Updated Afternoon Parcel Sorting Assistant');
      assert.equal(json.data.payAmount, 280);
      assert.equal(json.data.durationMinutes, 100);
    });

    await sub.test('Merchant cannot update another merchant job (HTTP 403 Forbidden)', async () => {
      seedSampleData();

      // merchant2 attempts to edit merchant1's job
      const res = await fetch(`${baseUrl}/api/v1/jobs/job-open-1`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchant2Token}`,
        },
        body: JSON.stringify({
          title: 'Hijacked Job Title Update',
        }),
      });

      assert.equal(res.status, 403);
    });

    await sub.test('Merchant can cancel an open job, but cannot mark it COMPLETED directly', async () => {
      seedSampleData();

      // Allowed: CANCELLED
      const resCancel = await fetch(`${baseUrl}/api/v1/jobs/job-open-1`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchant1Token}`,
        },
        body: JSON.stringify({
          status: JobStatus.CANCELLED,
        }),
      });
      assert.equal(resCancel.status, 200);
      const jsonCancel = await resCancel.json();
      assert.equal(jsonCancel.data.status, JobStatus.CANCELLED);

      // Disallowed for merchant PATCH: COMPLETED (only open/cancelled allowed)
      const resComplete = await fetch(`${baseUrl}/api/v1/jobs/job-open-1`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchant1Token}`,
        },
        body: JSON.stringify({
          status: JobStatus.COMPLETED,
        }),
      });
      assert.equal(resComplete.status, 400);
    });

    await sub.test('Merchant PATCH cannot modify completed job (HTTP 400)', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/jobs/job-completed-1`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchant1Token}`,
        },
        body: JSON.stringify({
          title: 'Attempting to Edit Completed Job',
        }),
      });

      assert.equal(res.status, 400);
      const json = await res.json();
      assert.ok(json.message.includes('completed'));
    });

    await sub.test('Merchant PATCH rejects unknown fields (HTTP 400)', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/jobs/job-open-1`, {
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

    await sub.test('Merchant PATCH rejects updating requiredRiders below acceptedRidersCount (HTTP 400)', async () => {
      seedSampleData();

      // job-filled-1 has requiredRiders: 1, acceptedRidersCount: 1
      const job = mockJobStore.get('job-filled-1')!;
      assert.equal(job.acceptedRidersCount, 1);

      // Attempt to reduce required riders to 0 or below accepted count (e.g. accepted=1, required=0 is invalid by schema min(1), but what if accepted=2 and required=1)
      job.acceptedRidersCount = 2;
      job.requiredRiders = 3;

      const res = await fetch(`${baseUrl}/api/v1/jobs/job-filled-1`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchant1Token}`,
        },
        body: JSON.stringify({
          requiredRiders: 1, // less than acceptedRidersCount (2)
        }),
      });

      assert.equal(res.status, 400);
      const json = await res.json();
      assert.match(json.message, /accepted riders/i);
    });

    await sub.test('Merchant PATCH rejects setting status to open when end time is in the past (HTTP 400)', async () => {
      seedSampleData();

      // job-expired-1 has endTime in the past
      const res = await fetch(`${baseUrl}/api/v1/jobs/job-expired-1`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${merchant1Token}`,
        },
        body: JSON.stringify({
          status: JobStatus.OPEN,
        }),
      });

      assert.equal(res.status, 400);
      const json = await res.json();
      assert.match(json.message, /end time is in the past/i);
    });

    await sub.test('Merchant PATCH returns 404 for nonexistent job ID', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/jobs/nonexistent-job-999`, {
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
  // 3. ADMIN JOB MODERATION (GET and PATCH /api/v1/admin/jobs)
  // =========================================================================
  await t.test('3. Admin Moderation (GET and PATCH /api/v1/admin/jobs)', async (sub) => {
    await sub.test('Unauthenticated caller cannot access admin routes (HTTP 401)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/jobs`);
      assert.equal(res.status, 401);
    });

    await sub.test('Riders and merchants cannot access admin routes (HTTP 403)', async () => {
      const resRider = await fetch(`${baseUrl}/api/v1/admin/jobs`, {
        headers: { Authorization: `Bearer ${riderToken}` },
      });
      assert.equal(resRider.status, 403);

      const resMerchant = await fetch(`${baseUrl}/api/v1/admin/jobs`, {
        headers: { Authorization: `Bearer ${merchant1Token}` },
      });
      assert.equal(resMerchant.status, 403);
    });

    await sub.test('Admin can list all jobs across merchants with administrative metadata', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/admin/jobs`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      // Admin sees all 9 jobs including cancelled, completed, expired, and unapproved stop jobs
      assert.equal(json.data.items.length, 9);
      assert.ok(json.data.items[0].merchantId);
      assert.ok(json.data.items[0].status);
    });

    await sub.test('Admin can filter jobs by status or category', async () => {
      seedSampleData();

      const resCancelled = await fetch(
        `${baseUrl}/api/v1/admin/jobs?status=${JobStatus.CANCELLED}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      assert.equal(resCancelled.status, 200);
      const jsonCancelled = await resCancelled.json();
      assert.equal(jsonCancelled.data.items.length, 1);
      assert.equal(jsonCancelled.data.items[0].id, 'job-cancelled-1');

      const resCleaning = await fetch(
        `${baseUrl}/api/v1/admin/jobs?category=${JobCategory.CLEANING_PREP}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      assert.equal(resCleaning.status, 200);
      const jsonCleaning = await resCleaning.json();
      assert.equal(jsonCleaning.data.items.length, 1);
      assert.equal(jsonCleaning.data.items[0].id, 'job-open-2');
    });

    await sub.test('Admin successfully moderates job status', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/admin/jobs/job-open-1/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: JobStatus.CANCELLED,
          reason: 'Violates platform wage guidelines.',
        }),
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.data.status, JobStatus.CANCELLED);
    });

    await sub.test('Admin status update rejects invalid status values (HTTP 400)', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/admin/jobs/job-open-1/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: 'invalid_status_value',
        }),
      });

      assert.equal(res.status, 400);
    });

    await sub.test('Admin status update rejects extraneous protected fields (HTTP 400)', async () => {
      seedSampleData();

      const res = await fetch(`${baseUrl}/api/v1/admin/jobs/job-open-1/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: JobStatus.CANCELLED,
          payAmount: 9999, // Extraneous field
        }),
      });

      assert.equal(res.status, 400);
    });
  });

  // ==============================================================
  // 4. Merchant Isolated Micro-Job Management (Phase 7A)
  // ==============================================================
  await t.test('4. Merchant Isolated Listing & Ownership (GET /api/v1/merchant/jobs and /:id)', async (sub) => {
    sub.beforeEach(() => {
      clearMockRestStopStore();
      clearMockJobStore();
      clearMockJobApplicationStore();
      seedSampleData();
    });

    await sub.test('Unauthenticated user cannot list merchant jobs (HTTP 401)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/merchant/jobs`);
      assert.equal(res.status, 401);
    });

    await sub.test('Rider role cannot access merchant jobs (HTTP 403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/merchant/jobs`, {
        headers: { Authorization: `Bearer ${riderToken}` },
      });
      assert.equal(res.status, 403);
    });

    await sub.test('Merchant 1 only sees their own jobs across all statuses', async () => {
      const res = await fetch(`${baseUrl}/api/v1/merchant/jobs`, {
        headers: { Authorization: `Bearer ${merchant1Token}` },
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(Array.isArray(json.data.items));

      // Merchant 1 owns 7 jobs; Merchant 2 owns 2 jobs (job-open-3, job-suspended-stop)
      assert.equal(json.data.items.length, 7);
      const ids = json.data.items.map((item: any) => item.id);
      assert.ok(ids.includes('job-open-1'));
      assert.ok(ids.includes('job-open-2'));
      assert.ok(ids.includes('job-filled-1'));
      assert.ok(ids.includes('job-expired-1'));
      assert.ok(ids.includes('job-cancelled-1'));
      assert.ok(ids.includes('job-completed-1'));
      assert.ok(ids.includes('job-pending-stop'));
      assert.ok(!ids.includes('job-open-3')); // Isolated from Merchant 2!
      assert.ok(!ids.includes('job-suspended-stop')); // Isolated from Merchant 2!
      assert.equal(json.data.pagination.total, 7);
    });

    await sub.test('Merchant 1 can filter owned jobs by operational status (completed)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/merchant/jobs?status=completed`, {
        headers: { Authorization: `Bearer ${merchant1Token}` },
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.data.items.length, 1);
      assert.equal(json.data.items[0].id, 'job-completed-1');
      assert.equal(json.data.items[0].status, 'completed');
    });

    await sub.test('Merchant 1 can filter owned jobs by operational status (cancelled)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/merchant/jobs?status=cancelled`, {
        headers: { Authorization: `Bearer ${merchant1Token}` },
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.data.items.length, 1);
      assert.equal(json.data.items[0].id, 'job-cancelled-1');
      assert.equal(json.data.items[0].status, 'cancelled');
    });

    await sub.test('Merchant 1 can filter owned jobs by category', async () => {
      const res = await fetch(
        `${baseUrl}/api/v1/merchant/jobs?category=${JobCategory.CLEANING_PREP}`,
        {
          headers: { Authorization: `Bearer ${merchant1Token}` },
        }
      );

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.data.items.length, 1);
      assert.equal(json.data.items[0].id, 'job-open-2');
      assert.equal(json.data.items[0].category, JobCategory.CLEANING_PREP);
    });

    await sub.test('Merchant 1 can filter owned jobs by associated rest stop', async () => {
      const res = await fetch(`${baseUrl}/api/v1/merchant/jobs?restStopId=rs-active-1`, {
        headers: { Authorization: `Bearer ${merchant1Token}` },
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      for (const item of json.data.items) {
        assert.equal(item.restStopId, 'rs-active-1');
      }
    });

    await sub.test('Merchant 1 can search owned jobs by keyword', async () => {
      const res = await fetch(`${baseUrl}/api/v1/merchant/jobs?search=Prep`, {
        headers: { Authorization: `Bearer ${merchant1Token}` },
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.data.items.length, 1);
      assert.equal(json.data.items[0].id, 'job-open-2');
    });

    await sub.test('Merchant 1 can fetch their own job by ID with populated rest stop name (HTTP 200)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/merchant/jobs/job-open-1`, {
        headers: { Authorization: `Bearer ${merchant1Token}` },
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.id, 'job-open-1');
      assert.equal(json.data.merchantId, merchant1Id);
      assert.equal(json.data.restStopName, 'Chai Point Indiranagar');
      assert.equal(json.data.title, 'Afternoon Parcel Sorting Assistant');
    });

    await sub.test('Merchant 2 is denied access to Merchant 1 job by ID (HTTP 403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/merchant/jobs/job-open-1`, {
        headers: { Authorization: `Bearer ${merchant2Token}` },
      });

      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.match(json.message, /permission/i);
    });

    await sub.test('Returns 404 for nonexistent job ID for merchant', async () => {
      const res = await fetch(`${baseUrl}/api/v1/merchant/jobs/nonexistent-job-id`, {
        headers: { Authorization: `Bearer ${merchant1Token}` },
      });

      assert.equal(res.status, 404);
      const json = await res.json();
      assert.equal(json.success, false);
    });

    await sub.test('Rejects invalid query parameters (e.g. limit > 50) (HTTP 400)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/merchant/jobs?limit=100`, {
        headers: { Authorization: `Bearer ${merchant1Token}` },
      });

      assert.equal(res.status, 400);
    });

    await sub.test('Includes accurate application counts in merchant job detail DTO', async () => {
      // Seed an application in the mock store
      mockJobApplicationStore.set('mock-app-1', {
        _id: 'mock-app-1',
        id: 'mock-app-1',
        jobId: 'job-open-1',
        riderId: riderId,
        merchantId: merchant1Id,
        status: JobApplicationStatus.PENDING,
        notes: 'Available for immediate afternoon shift',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await fetch(`${baseUrl}/api/v1/merchant/jobs/job-open-1`, {
        headers: { Authorization: `Bearer ${merchant1Token}` },
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.data.applicationsCount, 1);
      assert.equal(json.data.pendingApplicationsCount, 1);
    });
  });
});
