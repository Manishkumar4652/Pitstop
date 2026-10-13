import test from 'node:test';
import assert from 'node:assert/strict';
import { Server } from 'http';
import mongoose from 'mongoose';
import {
  UserRole,
  RestStopStatus,
  CapacityStatus,
  Facility,
  JobCategory,
  JobStatus,
  JobApplicationStatus,
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
  mockJobStore,
  clearMockJobStore,
  MockJobItem,
} from '../controllers/jobMockStore';
import {
  mockJobApplicationStore,
  clearMockJobApplicationStore,
  MockJobApplicationItem,
} from '../controllers/jobApplicationMockStore';
import { Job } from '../models/Job';
import { JobApplication } from '../models/JobApplication';
import { RestStop } from '../models/RestStop';
import { User } from '../models/User';

const TEST_JWT_SECRET = 'a_very_secure_test_jwt_secret_that_has_at_least_32_characters_for_testing';

function setupTestServer() {
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

test('Job Application Lifecycle & Atomic Capacity Management Test Suite (Phase 7B)', async (t) => {
  const { server, baseUrl } = await setupTestServer();

  const merchant1Id = 'merchant-owner-101';
  const merchant2Id = 'merchant-owner-102';
  const rider1Id = 'rider-applicant-201';
  const rider2Id = 'rider-applicant-202';
  const adminId = 'admin-user-301';

  const merchant1Token = signAccessToken({ userId: merchant1Id, role: UserRole.MERCHANT });
  const merchant2Token = signAccessToken({ userId: merchant2Id, role: UserRole.MERCHANT });
  const rider1Token = signAccessToken({ userId: rider1Id, role: UserRole.RIDER });
  const rider2Token = signAccessToken({ userId: rider2Id, role: UserRole.RIDER });
  const adminToken = signAccessToken({ userId: adminId, role: UserRole.ADMIN });

  const activeRestStopId = 'stop-active-001';
  const inactiveRestStopId = 'stop-inactive-002';

  const validJobId = 'job-open-101';
  const expiredJobId = 'job-expired-102';
  const fullJobId = 'job-full-103';
  const cancelledJobId = 'job-cancelled-104';
  const inactiveVenueJobId = 'job-inactive-venue-105';

  function seedMockData() {
    clearMockRestStopStore();
    clearMockJobStore();
    clearMockJobApplicationStore();

    // 1. Seed Rest Stops
    const activeStop: MockRestStopItem = {
      _id: activeRestStopId,
      id: activeRestStopId,
      merchantId: merchant1Id,
      name: 'Indiranagar Hub',
      slug: 'indiranagar-hub',
      description: 'Active mock rest stop for job testing',
      address: {
        street: '100 Feet Rd',
        area: 'Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
      },
      location: { type: 'Point', coordinates: [77.6408, 12.9784] },
      facilities: [Facility.RESTROOM, Facility.DRINKING_WATER],
      images: ['https://example.com/indiranagar.jpg'],
      capacity: {
        maxRiders: 20,
        currentOccupancy: 0,
        status: CapacityStatus.AVAILABLE,
      },
      operatingHours: [],
      status: RestStopStatus.ACTIVE,
      rating: { average: 4.8, count: 12 },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockRestStopStore.set(activeRestStopId, activeStop);

    const inactiveStop: MockRestStopItem = {
      _id: inactiveRestStopId,
      id: inactiveRestStopId,
      merchantId: merchant1Id,
      name: 'Koramangala Hub',
      slug: 'koramangala-hub',
      description: 'Suspended mock rest stop for job testing',
      address: {
        street: '80 Feet Rd',
        area: 'Koramangala',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560034',
      },
      location: { type: 'Point', coordinates: [77.6208, 12.9352] },
      facilities: [Facility.RESTROOM],
      images: [],
      capacity: {
        maxRiders: 15,
        currentOccupancy: 0,
        status: CapacityStatus.AVAILABLE,
      },
      operatingHours: [],
      status: RestStopStatus.SUSPENDED,
      rating: { average: 4.0, count: 5 },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockRestStopStore.set(inactiveRestStopId, inactiveStop);

    // 2. Seed Jobs
    const futureEnd = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const pastEnd = new Date(Date.now() - 60 * 60 * 1000);

    const openJob: MockJobItem = {
      _id: validJobId,
      id: validJobId,
      merchantId: merchant1Id,
      restStopId: activeRestStopId,
      title: 'Morning Sorting Assistant',
      description: 'Sort delivery packages for quick dispatches',
      category: JobCategory.PARCEL_SORTING,
      payAmount: 350,
      payType: 'fixed',
      durationMinutes: 120,
      startTime: new Date(),
      endTime: futureEnd,
      requiredRiders: 2,
      acceptedRidersCount: 0,
      status: JobStatus.OPEN,
      instructions: 'Report to rear gate and wear safety vest',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockJobStore.set(validJobId, openJob);

    const expiredJob: MockJobItem = {
      ...openJob,
      _id: expiredJobId,
      id: expiredJobId,
      endTime: pastEnd,
    };
    mockJobStore.set(expiredJobId, expiredJob);

    const fullJob: MockJobItem = {
      ...openJob,
      _id: fullJobId,
      id: fullJobId,
      requiredRiders: 1,
      acceptedRidersCount: 1,
    };
    mockJobStore.set(fullJobId, fullJob);

    const cancelledJob: MockJobItem = {
      ...openJob,
      _id: cancelledJobId,
      id: cancelledJobId,
      status: JobStatus.CANCELLED,
    };
    mockJobStore.set(cancelledJobId, cancelledJob);

    const inactiveVenueJob: MockJobItem = {
      ...openJob,
      _id: inactiveVenueJobId,
      id: inactiveVenueJobId,
      restStopId: inactiveRestStopId,
    };
    mockJobStore.set(inactiveVenueJobId, inactiveVenueJob);
  }

  t.beforeEach(() => {
    seedMockData();
  });

  t.after(() => {
    server.close();
  });

  // ==========================================
  // 1. Rider Applies for a Job (POST /api/v1/jobs/:id/apply)
  // ==========================================
  await t.test('1. Rider applies for a micro-job (POST /api/v1/jobs/:id/apply)', async (sub) => {
    await sub.test('1.1 Unauthenticated requests are rejected (HTTP 401)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/jobs/${validJobId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Ready to work' }),
      });
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.success, false);
    });

    await sub.test('1.2 Merchant and Admin roles cannot apply for jobs (HTTP 403 Forbidden)', async () => {
      const resMerchant = await fetch(`${baseUrl}/api/v1/jobs/${validJobId}/apply`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${merchant1Token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: 'I am a merchant' }),
      });
      assert.equal(resMerchant.status, 403);

      const resAdmin = await fetch(`${baseUrl}/api/v1/jobs/${validJobId}/apply`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: 'I am an admin' }),
      });
      assert.equal(resAdmin.status, 403);
    });

    await sub.test('1.3 Rider can apply to an eligible open job (HTTP 201 Created)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/jobs/${validJobId}/apply`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${rider1Token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: 'Have previous sorting experience' }),
      });

      assert.equal(res.status, 201);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.jobId, validJobId);
      assert.equal(json.data.riderId, rider1Id);
      assert.equal(json.data.merchantId, merchant1Id);
      assert.equal(json.data.status, JobApplicationStatus.PENDING);
      assert.equal(json.data.notes, 'Have previous sorting experience');
      assert.ok(json.data.id);
    });

    await sub.test('1.4 Safe DTO excludes password hashes and private tokens', async () => {
      const res = await fetch(`${baseUrl}/api/v1/jobs/${validJobId}/apply`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${rider2Token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: 'Can start right away' }),
      });

      assert.equal(res.status, 201);
      const json = await res.json();
      assert.equal(json.data.password, undefined);
      assert.equal(json.data.passwordHash, undefined);
      assert.equal(json.data.secret, undefined);
    });

    await sub.test('1.5 Rider cannot apply to cancelled or completed job (HTTP 400)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/jobs/${cancelledJobId}/apply`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${rider1Token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: 'Testing cancelled job' }),
      });

      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.match(json.message, /not open/i);
    });

    await sub.test('1.6 Rider cannot apply to expired job (HTTP 400)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/jobs/${expiredJobId}/apply`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${rider1Token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: 'Testing expired job' }),
      });

      assert.equal(res.status, 400);
      const json = await res.json();
      assert.match(json.message, /expired/i);
    });

    await sub.test('1.7 Rider cannot apply to full capacity job (HTTP 400)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/jobs/${fullJobId}/apply`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${rider1Token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: 'Testing full job' }),
      });

      assert.equal(res.status, 400);
      const json = await res.json();
      assert.match(json.message, /capacity/i);
    });

    await sub.test('1.8 Rider cannot apply to job at inactive rest stop (HTTP 400)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/jobs/${inactiveVenueJobId}/apply`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${rider1Token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: 'Testing inactive venue' }),
      });

      assert.equal(res.status, 400);
      const json = await res.json();
      assert.match(json.message, /active rest stops/i);
    });

    await sub.test('1.9 Duplicate application returns HTTP 409 Conflict', async () => {
      // First application succeeds
      const res1 = await fetch(`${baseUrl}/api/v1/jobs/${validJobId}/apply`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${rider1Token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: 'Initial application' }),
      });
      assert.equal(res1.status, 201);

      // Duplicate application by same rider to same job
      const res2 = await fetch(`${baseUrl}/api/v1/jobs/${validJobId}/apply`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${rider1Token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: 'Duplicate application' }),
      });

      assert.equal(res2.status, 409);
      const json = await res2.json();
      assert.equal(json.success, false);
      assert.match(json.message, /already applied/i);
    });

    await sub.test('1.10 Invalid request body (e.g. notes > 200 chars) returns HTTP 400', async () => {
      const res = await fetch(`${baseUrl}/api/v1/jobs/${validJobId}/apply`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${rider1Token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: 'A'.repeat(250) }),
      });

      assert.equal(res.status, 400);
    });
  });

  // ==========================================
  // 2. Rider Views Their Applications (GET /api/v1/rider/applications)
  // ==========================================
  await t.test('2. Rider views their applications (GET /api/v1/rider/applications)', async (sub) => {
    await sub.test('2.1 Unauthenticated requests are rejected (HTTP 401)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/rider/applications`);
      assert.equal(res.status, 401);
    });

    await sub.test('2.2 Merchant and Admin roles cannot access rider applications (HTTP 403)', async () => {
      const resMerchant = await fetch(`${baseUrl}/api/v1/rider/applications`, {
        headers: { Authorization: `Bearer ${merchant1Token}` },
      });
      assert.equal(resMerchant.status, 403);

      const resAdmin = await fetch(`${baseUrl}/api/v1/rider/applications`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(resAdmin.status, 403);
    });

    await sub.test('2.3 Listing is strictly isolated to authenticated rider', async () => {
      // Seed applications for rider 1 and rider 2
      mockJobApplicationStore.set('app-r1-1', {
        _id: 'app-r1-1',
        id: 'app-r1-1',
        jobId: validJobId,
        riderId: rider1Id,
        merchantId: merchant1Id,
        status: JobApplicationStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockJobApplicationStore.set('app-r2-1', {
        _id: 'app-r2-1',
        id: 'app-r2-1',
        jobId: validJobId,
        riderId: rider2Id,
        merchantId: merchant1Id,
        status: JobApplicationStatus.ACCEPTED,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await fetch(`${baseUrl}/api/v1/rider/applications`, {
        headers: { Authorization: `Bearer ${rider1Token}` },
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.items.length, 1);
      assert.equal(json.data.items[0].id, 'app-r1-1');
      assert.equal(json.data.items[0].riderId, rider1Id);
    });

    await sub.test('2.4 Filters by status and returns enriched job summary', async () => {
      mockJobApplicationStore.set('app-r1-pending', {
        _id: 'app-r1-pending',
        id: 'app-r1-pending',
        jobId: validJobId,
        riderId: rider1Id,
        merchantId: merchant1Id,
        status: JobApplicationStatus.PENDING,
        createdAt: new Date(Date.now() - 1000),
        updatedAt: new Date(),
      });

      mockJobApplicationStore.set('app-r1-accepted', {
        _id: 'app-r1-accepted',
        id: 'app-r1-accepted',
        jobId: validJobId,
        riderId: rider1Id,
        merchantId: merchant1Id,
        status: JobApplicationStatus.ACCEPTED,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await fetch(`${baseUrl}/api/v1/rider/applications?status=accepted`, {
        headers: { Authorization: `Bearer ${rider1Token}` },
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.data.items.length, 1);
      assert.equal(json.data.items[0].status, JobApplicationStatus.ACCEPTED);
      assert.equal(json.data.items[0].jobTitle, 'Morning Sorting Assistant');
      assert.equal(json.data.items[0].restStopName, 'Indiranagar Hub');
      assert.equal(json.data.items[0].payAmount, 350);
    });
  });

  // ==========================================
  // 3. Merchant Views Applicants for Owned Job (GET /api/v1/merchant/jobs/:id/applications)
  // ==========================================
  await t.test('3. Merchant views applicants for owned job (GET /api/v1/merchant/jobs/:id/applications)', async (sub) => {
    await sub.test('3.1 Unauthenticated requests are rejected (HTTP 401)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/merchant/jobs/${validJobId}/applications`);
      assert.equal(res.status, 401);
    });

    await sub.test('3.2 Rider and Admin roles cannot view merchant applicants (HTTP 403)', async () => {
      const resRider = await fetch(`${baseUrl}/api/v1/merchant/jobs/${validJobId}/applications`, {
        headers: { Authorization: `Bearer ${rider1Token}` },
      });
      assert.equal(resRider.status, 403);

      const resAdmin = await fetch(`${baseUrl}/api/v1/merchant/jobs/${validJobId}/applications`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(resAdmin.status, 403);
    });

    await sub.test('3.3 Merchant 1 can view applicants for their own job (HTTP 200)', async () => {
      mockJobApplicationStore.set('app-m1-1', {
        _id: 'app-m1-1',
        id: 'app-m1-1',
        jobId: validJobId,
        riderId: rider1Id,
        riderName: 'Sunil Kumar',
        vehicleType: '2-wheeler-ev',
        merchantId: merchant1Id,
        status: JobApplicationStatus.PENDING,
        notes: 'Ready for duty',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await fetch(`${baseUrl}/api/v1/merchant/jobs/${validJobId}/applications`, {
        headers: { Authorization: `Bearer ${merchant1Token}` },
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.items.length, 1);
      assert.equal(json.data.items[0].riderName, 'Sunil Kumar');
      assert.equal(json.data.items[0].vehicleType, '2-wheeler-ev');
    });

    await sub.test('3.4 Merchant 2 is denied access to Merchant 1 job applicants (HTTP 403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/merchant/jobs/${validJobId}/applications`, {
        headers: { Authorization: `Bearer ${merchant2Token}` },
      });

      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.match(json.message, /permission/i);
    });

    await sub.test('3.5 Returns 404 for nonexistent job ID', async () => {
      const res = await fetch(`${baseUrl}/api/v1/merchant/jobs/nonexistent-id/applications`, {
        headers: { Authorization: `Bearer ${merchant1Token}` },
      });

      assert.equal(res.status, 404);
    });
  });

  // ==========================================
  // 4. Merchant Accepts or Rejects an Application (PATCH /api/v1/merchant/applications/:id/status)
  // ==========================================
  await t.test('4. Merchant accepts or rejects an application (PATCH /api/v1/merchant/applications/:id/status)', async (sub) => {
    await sub.test('4.1 Unauthenticated requests are rejected (HTTP 401)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/merchant/applications/any-id/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'accepted' }),
      });
      assert.equal(res.status, 401);
    });

    await sub.test('4.2 Rider role cannot update application status (HTTP 403)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/merchant/applications/any-id/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${rider1Token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'accepted' }),
      });
      assert.equal(res.status, 403);
    });

    await sub.test('4.3 Rejects unsupported statuses (e.g. pending, withdrawn) (HTTP 400)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/merchant/applications/any-id/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${merchant1Token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'pending' }),
      });
      assert.equal(res.status, 400);
    });

    await sub.test('4.4 Cross-merchant update is denied (HTTP 403 Forbidden)', async () => {
      mockJobApplicationStore.set('app-target-1', {
        _id: 'app-target-1',
        id: 'app-target-1',
        jobId: validJobId,
        riderId: rider1Id,
        merchantId: merchant1Id,
        status: JobApplicationStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await fetch(`${baseUrl}/api/v1/merchant/applications/app-target-1/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${merchant2Token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'accepted' }),
      });

      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.match(json.message, /permission/i);
    });

    await sub.test('4.5 Merchant can reject a pending application without altering capacity counter', async () => {
      mockJobApplicationStore.set('app-to-reject', {
        _id: 'app-to-reject',
        id: 'app-to-reject',
        jobId: validJobId,
        riderId: rider1Id,
        merchantId: merchant1Id,
        status: JobApplicationStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const beforeJob = mockJobStore.get(validJobId)!;
      const initialAccepted = beforeJob.acceptedRidersCount;

      const res = await fetch(`${baseUrl}/api/v1/merchant/applications/app-to-reject/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${merchant1Token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'rejected' }),
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.data.status, JobApplicationStatus.REJECTED);

      const afterJob = mockJobStore.get(validJobId)!;
      assert.equal(afterJob.acceptedRidersCount, initialAccepted);
    });

    await sub.test('4.6 Merchant can accept a pending application and increment capacity', async () => {
      mockJobApplicationStore.set('app-to-accept', {
        _id: 'app-to-accept',
        id: 'app-to-accept',
        jobId: validJobId,
        riderId: rider1Id,
        merchantId: merchant1Id,
        status: JobApplicationStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await fetch(`${baseUrl}/api/v1/merchant/applications/app-to-accept/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${merchant1Token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'accepted' }),
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.data.status, JobApplicationStatus.ACCEPTED);

      const job = mockJobStore.get(validJobId)!;
      assert.equal(job.acceptedRidersCount, 1);
    });

    await sub.test('4.7 Repeated acceptance of already accepted application is rejected without mutating counter', async () => {
      mockJobApplicationStore.set('app-already-accepted', {
        _id: 'app-already-accepted',
        id: 'app-already-accepted',
        jobId: validJobId,
        riderId: rider1Id,
        merchantId: merchant1Id,
        status: JobApplicationStatus.ACCEPTED,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const jobBefore = mockJobStore.get(validJobId)!;
      const countBefore = jobBefore.acceptedRidersCount;

      const res = await fetch(`${baseUrl}/api/v1/merchant/applications/app-already-accepted/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${merchant1Token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'accepted' }),
      });

      assert.equal(res.status, 400);
      const json = await res.json();
      assert.match(json.message, /already 'accepted'/i);

      const jobAfter = mockJobStore.get(validJobId)!;
      assert.equal(jobAfter.acceptedRidersCount, countBefore);
    });

    await sub.test('4.8 Acceptance of rejected or withdrawn application is rejected (HTTP 400)', async () => {
      mockJobApplicationStore.set('app-rejected', {
        _id: 'app-rejected',
        id: 'app-rejected',
        jobId: validJobId,
        riderId: rider1Id,
        merchantId: merchant1Id,
        status: JobApplicationStatus.REJECTED,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await fetch(`${baseUrl}/api/v1/merchant/applications/app-rejected/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${merchant1Token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'accepted' }),
      });

      assert.equal(res.status, 400);
      const json = await res.json();
      assert.match(json.message, /already 'rejected'/i);
    });

    await sub.test('4.9 Capacity Invariant: Cannot accept beyond requiredRiders (HTTP 409 Conflict)', async () => {
      // Set validJob to capacity
      const job = mockJobStore.get(validJobId)!;
      job.requiredRiders = 1;
      job.acceptedRidersCount = 1;

      mockJobApplicationStore.set('app-excess', {
        _id: 'app-excess',
        id: 'app-excess',
        jobId: validJobId,
        riderId: rider2Id,
        merchantId: merchant1Id,
        status: JobApplicationStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await fetch(`${baseUrl}/api/v1/merchant/applications/app-excess/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${merchant1Token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'accepted' }),
      });

      assert.equal(res.status, 409);
      const json = await res.json();
      assert.match(json.message, /full capacity/i);

      // Verify counter never exceeded requiredRiders
      assert.equal(job.acceptedRidersCount, 1);
      assert.ok(job.acceptedRidersCount <= job.requiredRiders);
    });
  });

  // ==========================================
  // 5. Rider Withdraws Application (POST /api/v1/rider/applications/:id/withdraw)
  // ==========================================
  await t.test('5. Rider withdraws application (POST /api/v1/rider/applications/:id/withdraw)', async (sub) => {
    await sub.test('5.1 Unauthenticated requests are rejected (HTTP 401)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/rider/applications/any-id/withdraw`, {
        method: 'POST',
      });
      assert.equal(res.status, 401);
    });

    await sub.test('5.2 Merchant cannot call rider withdraw endpoint (HTTP 403)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/rider/applications/any-id/withdraw`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${merchant1Token}` },
      });
      assert.equal(res.status, 403);
    });

    await sub.test('5.3 Rider can withdraw their own pending application', async () => {
      mockJobApplicationStore.set('app-to-withdraw', {
        _id: 'app-to-withdraw',
        id: 'app-to-withdraw',
        jobId: validJobId,
        riderId: rider1Id,
        merchantId: merchant1Id,
        status: JobApplicationStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const jobBefore = mockJobStore.get(validJobId)!;
      const countBefore = jobBefore.acceptedRidersCount;

      const res = await fetch(`${baseUrl}/api/v1/rider/applications/app-to-withdraw/withdraw`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${rider1Token}` },
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.data.status, JobApplicationStatus.WITHDRAWN);

      // Withdrawal must not decrement capacity
      const jobAfter = mockJobStore.get(validJobId)!;
      assert.equal(jobAfter.acceptedRidersCount, countBefore);
    });

    await sub.test('5.4 Rider cannot withdraw another rider application (HTTP 403 Forbidden)', async () => {
      mockJobApplicationStore.set('app-rider2', {
        _id: 'app-rider2',
        id: 'app-rider2',
        jobId: validJobId,
        riderId: rider2Id,
        merchantId: merchant1Id,
        status: JobApplicationStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await fetch(`${baseUrl}/api/v1/rider/applications/app-rider2/withdraw`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${rider1Token}` },
      });

      assert.equal(res.status, 403);
      const json = await res.json();
      assert.match(json.message, /permission/i);
    });

    await sub.test('5.5 Cannot withdraw an accepted, rejected, or already withdrawn application (HTTP 400)', async () => {
      mockJobApplicationStore.set('app-accepted-rider1', {
        _id: 'app-accepted-rider1',
        id: 'app-accepted-rider1',
        jobId: validJobId,
        riderId: rider1Id,
        merchantId: merchant1Id,
        status: JobApplicationStatus.ACCEPTED,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await fetch(`${baseUrl}/api/v1/rider/applications/app-accepted-rider1/withdraw`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${rider1Token}` },
      });

      assert.equal(res.status, 400);
      const json = await res.json();
      assert.match(json.message, /already 'accepted'/i);
    });
  });

  // ==========================================
  // 6. Production Database-Unavailable Behavior (HTTP 503 / 401)
  // ==========================================
  await t.test('6. Production database-unavailable safety check', async (sub) => {
    await sub.test('Fails safely when NODE_ENV=production and DB disconnected', async () => {
      const origEnv = config.NODE_ENV;
      (config as any).NODE_ENV = 'production';

      try {
        const res = await fetch(`${baseUrl}/api/v1/jobs/${validJobId}/apply`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${rider1Token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ notes: 'Testing 503' }),
        });

        assert.ok([401, 503].includes(res.status));
        const json = await res.json();
        assert.equal(json.success, false);
        assert.match(json.message, /database service unavailable/i);
      } finally {
        (config as any).NODE_ENV = origEnv;
      }
    });
  });

  // ==========================================
  // 7. Local MongoDB Real Database Concurrency & Invariants
  // ==========================================
  await t.test('7. Real MongoDB Integration & Concurrency Tests', async (sub) => {
    let mongoConnected = false;
    const testDbUri = 'mongodb://127.0.0.1:27017/pitstop_phase7b_test';

    try {
      await mongoose.connect(testDbUri, { serverSelectionTimeoutMS: 2000 });
      mongoConnected = mongoose.connection.readyState === 1;
    } catch {
      mongoConnected = false;
    }

    if (!mongoConnected) {
      console.log('Skipping Section 7: Local MongoDB is not reachable.');
      return;
    }

    // Clean test collections before running
    await JobApplication.deleteMany({});
    await Job.deleteMany({});
    await RestStop.deleteMany({});
    await User.deleteMany({});

    // Seed real MongoDB documents
    const realMerchantId = new mongoose.Types.ObjectId();
    const realRider1Id = new mongoose.Types.ObjectId();
    const realRider2Id = new mongoose.Types.ObjectId();
    const realRider3Id = new mongoose.Types.ObjectId();

    await User.create([
      {
        _id: realMerchantId,
        name: 'Real Merchant',
        phone: '9876543211',
        role: UserRole.MERCHANT,
        isVerified: true,
        merchantProfile: {
          businessName: 'Chai Point Indiranagar',
          businessType: 'restaurant',
        },
      },
      {
        _id: realRider1Id,
        name: 'Real Rider 1',
        phone: '9876543212',
        role: UserRole.RIDER,
        isVerified: true,
        riderProfile: {
          platform: 'zomato',
          vehicleType: '2-wheeler-ev',
        },
      },
      {
        _id: realRider2Id,
        name: 'Real Rider 2',
        phone: '9876543213',
        role: UserRole.RIDER,
        isVerified: true,
        riderProfile: {
          platform: 'swiggy',
          vehicleType: '2-wheeler-petrol',
        },
      },
      {
        _id: realRider3Id,
        name: 'Real Rider 3',
        phone: '9876543214',
        role: UserRole.RIDER,
        isVerified: true,
        riderProfile: {
          platform: 'zepto',
          vehicleType: 'bicycle',
        },
      },
    ]);

    const realRestStop = await RestStop.create({
      merchantId: realMerchantId,
      name: 'Real Indiranagar Rest Stop',
      slug: `real-indiranagar-stop-${Date.now()}`,
      description: 'A dedicated test venue for micro-job application verification and capacity testing.',
      address: {
        street: '100 Feet Road',
        area: 'Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
      },
      location: { type: 'Point', coordinates: [77.6408, 12.9784] },
      facilities: [Facility.RESTROOM, Facility.DRINKING_WATER],
      images: ['https://example.com/indiranagar.jpg'],
      capacity: {
        maxRiders: 20,
        currentOccupancy: 0,
        status: CapacityStatus.AVAILABLE,
      },
      operatingHours: [
        { day: 'mon', openTime: '06:00', closeTime: '23:00', isOpen: true },
        { day: 'tue', openTime: '06:00', closeTime: '23:00', isOpen: true },
        { day: 'wed', openTime: '06:00', closeTime: '23:00', isOpen: true },
        { day: 'thu', openTime: '06:00', closeTime: '23:00', isOpen: true },
        { day: 'fri', openTime: '06:00', closeTime: '23:00', isOpen: true },
        { day: 'sat', openTime: '06:00', closeTime: '23:00', isOpen: true },
        { day: 'sun', openTime: '06:00', closeTime: '23:00', isOpen: true },
      ],
      status: RestStopStatus.ACTIVE,
    });

    const real1SlotJob = await Job.create({
      merchantId: realMerchantId,
      restStopId: realRestStop._id,
      title: 'Real 1-Slot Loading Assistant',
      description: 'Assist with high-priority parcel dispatch',
      category: JobCategory.LOADING_UNLOADING,
      payAmount: 400,
      payType: 'fixed',
      durationMinutes: 90,
      startTime: new Date(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      requiredRiders: 1,
      acceptedRidersCount: 0,
      status: JobStatus.OPEN,
      instructions: 'Wear safety helmet and gloves',
    });

    const realMerchantToken = signAccessToken({
      userId: realMerchantId.toString(),
      role: UserRole.MERCHANT,
    });
    const realRider1Token = signAccessToken({
      userId: realRider1Id.toString(),
      role: UserRole.RIDER,
    });
    const realRider2Token = signAccessToken({
      userId: realRider2Id.toString(),
      role: UserRole.RIDER,
    });
    const realRider3Token = signAccessToken({
      userId: realRider3Id.toString(),
      role: UserRole.RIDER,
    });

    await sub.test('7.1 Real MongoDB enforces unique compound index and maps duplicate key to HTTP 409', async () => {
      // First application creates document
      const res1 = await fetch(`${baseUrl}/api/v1/jobs/${real1SlotJob._id}/apply`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${realRider1Token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: 'Application 1' }),
      });
      assert.equal(res1.status, 201);

      // Concurrent duplicate submission
      const res2 = await fetch(`${baseUrl}/api/v1/jobs/${real1SlotJob._id}/apply`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${realRider1Token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: 'Duplicate application' }),
      });
      assert.equal(res2.status, 409);
      const json = await res2.json();
      assert.match(json.message, /already applied/i);
    });

    await sub.test('7.2 Concurrent acceptance attempts never make acceptedRidersCount exceed requiredRiders', async () => {
      // Create second application from rider 2
      const resApply2 = await fetch(`${baseUrl}/api/v1/jobs/${real1SlotJob._id}/apply`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${realRider2Token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: 'Application 2' }),
      });
      assert.equal(resApply2.status, 201);
      const app2Json = await resApply2.json();
      const app2Id = app2Json.data.id;

      // Fetch app1 ID
      const app1 = await JobApplication.findOne({
        jobId: real1SlotJob._id,
        riderId: realRider1Id,
      });
      assert.ok(app1);
      const app1Id = app1._id.toString();

      // Launch concurrent acceptance for app1 and app2 against the 1-slot job
      const [resAccept1, resAccept2] = await Promise.all([
        fetch(`${baseUrl}/api/v1/merchant/applications/${app1Id}/status`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${realMerchantToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'accepted' }),
        }),
        fetch(`${baseUrl}/api/v1/merchant/applications/${app2Id}/status`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${realMerchantToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'accepted' }),
        }),
      ]);

      const statuses = [resAccept1.status, resAccept2.status].sort();
      // Exactly one must succeed (200) and one must be rejected (409)
      assert.deepEqual(statuses, [200, 409]);

      // Verify database invariant: acceptedRidersCount === 1, never 2
      const jobInDb = await Job.findById(real1SlotJob._id);
      assert.ok(jobInDb);
      assert.equal(jobInDb.acceptedRidersCount, 1);
      assert.ok(jobInDb.acceptedRidersCount <= jobInDb.requiredRiders);

      // Verify that the failed application rolled back to PENDING
      const failedAppId = resAccept1.status === 409 ? app1Id : app2Id;
      const rolledBackApp = await JobApplication.findById(failedAppId);
      assert.ok(rolledBackApp);
      assert.equal(rolledBackApp.status, JobApplicationStatus.PENDING);
    });

    await sub.test('7.3 Rider withdrawal on real MongoDB updates status to WITHDRAWN without mutating counter', async () => {
      // Rider 3 applies to job
      // First let's create a 2-slot job
      const real2SlotJob = await Job.create({
        merchantId: realMerchantId,
        restStopId: realRestStop._id,
        title: 'Real 2-Slot Loading Assistant',
        description: 'Assist with sorting',
        category: JobCategory.LOADING_UNLOADING,
        payAmount: 300,
        payType: 'fixed',
        durationMinutes: 60,
        startTime: new Date(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        requiredRiders: 2,
        acceptedRidersCount: 0,
        status: JobStatus.OPEN,
        instructions: 'Report on time',
      });

      const applyRes = await fetch(`${baseUrl}/api/v1/jobs/${real2SlotJob._id}/apply`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${realRider3Token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: 'Will withdraw soon' }),
      });
      assert.equal(applyRes.status, 201);
      const app3 = await applyRes.json();

      const withdrawRes = await fetch(`${baseUrl}/api/v1/rider/applications/${app3.data.id}/withdraw`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${realRider3Token}` },
      });
      assert.equal(withdrawRes.status, 200);
      const withdrawJson = await withdrawRes.json();
      assert.equal(withdrawJson.data.status, JobApplicationStatus.WITHDRAWN);

      // Verify job counter remained 0
      const refreshedJob = await Job.findById(real2SlotJob._id);
      assert.ok(refreshedJob);
      assert.equal(refreshedJob.acceptedRidersCount, 0);
    });

    await sub.test('7.4 End-to-End Business Flow on Real MongoDB: Create -> Apply -> Review -> Accept -> Verify Persisted State', async () => {
      // 1. Merchant creates a 1-slot job at the active rest stop
      const createRes = await fetch(`${baseUrl}/api/v1/jobs`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${realMerchantToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restStopId: realRestStop._id.toString(),
          title: 'E2E Verified Parcel Organizer',
          description: 'Assist with evening delivery sorting and dispatch at counter.',
          category: JobCategory.PARCEL_SORTING,
          payAmount: 350,
          payType: 'fixed',
          durationMinutes: 60,
          startTime: new Date(),
          endTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
          requiredRiders: 2,
          instructions: 'Check in with manager at reception.',
        }),
      });
      assert.equal(createRes.status, 201);
      const createdJobJson = await createRes.json();
      const createdJobId = createdJobJson.data.id;
      assert.ok(createdJobId);

      // 2. Public marketplace returns the newly created job
      const publicRes = await fetch(`${baseUrl}/api/v1/jobs?restStopId=${realRestStop._id}`);
      assert.equal(publicRes.status, 200);
      const publicJson = await publicRes.json();
      const foundPublicJob = publicJson.data.items.find((j: any) => j.id === createdJobId);
      assert.ok(foundPublicJob);
      assert.equal(foundPublicJob.title, 'E2E Verified Parcel Organizer');
      assert.equal(foundPublicJob.acceptedRidersCount, 0);
      assert.equal(foundPublicJob.requiredRiders, 2);

      // 3. Rider 1 applies for the job
      const applyRes = await fetch(`${baseUrl}/api/v1/jobs/${createdJobId}/apply`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${realRider1Token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: 'Available immediately for evening shift.' }),
      });
      assert.equal(applyRes.status, 201);
      const applyJson = await applyRes.json();
      const e2eAppId = applyJson.data.id;
      assert.ok(e2eAppId);
      assert.equal(applyJson.data.status, JobApplicationStatus.PENDING);

      // 4. Merchant reviews applicants and sees Rider 1's pending application
      const merchantReviewRes = await fetch(`${baseUrl}/api/v1/merchant/jobs/${createdJobId}/applications`, {
        headers: { Authorization: `Bearer ${realMerchantToken}` },
      });
      assert.equal(merchantReviewRes.status, 200);
      const merchantReviewJson = await merchantReviewRes.json();
      assert.equal(merchantReviewJson.data.items.length, 1);
      assert.equal(merchantReviewJson.data.items[0].id, e2eAppId);
      assert.equal(merchantReviewJson.data.items[0].riderName, 'Real Rider 1');
      assert.equal(merchantReviewJson.data.items[0].status, JobApplicationStatus.PENDING);

      // 5. Merchant accepts Rider 1's application
      const acceptRes = await fetch(`${baseUrl}/api/v1/merchant/applications/${e2eAppId}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${realMerchantToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'accepted' }),
      });
      assert.equal(acceptRes.status, 200);
      const acceptJson = await acceptRes.json();
      assert.equal(acceptJson.data.status, JobApplicationStatus.ACCEPTED);

      // 6. Rider 1 checks application status and sees it is ACCEPTED
      const riderAppsRes = await fetch(`${baseUrl}/api/v1/rider/applications`, {
        headers: { Authorization: `Bearer ${realRider1Token}` },
      });
      assert.equal(riderAppsRes.status, 200);
      const riderAppsJson = await riderAppsRes.json();
      const foundRiderApp = riderAppsJson.data.items.find((a: any) => a.id === e2eAppId);
      assert.ok(foundRiderApp);
      assert.equal(foundRiderApp.status, JobApplicationStatus.ACCEPTED);

      // 7. Directly verify real MongoDB persisted state
      const persistedJob = await Job.findById(createdJobId);
      assert.ok(persistedJob);
      assert.equal(persistedJob.acceptedRidersCount, 1);
      assert.equal(persistedJob.requiredRiders, 2);

      const persistedApp = await JobApplication.findById(e2eAppId);
      assert.ok(persistedApp);
      assert.equal(persistedApp.status, JobApplicationStatus.ACCEPTED);

      // 8. Re-apply by Rider 1 on job with 1 remaining slot is rejected with 409 Conflict
      const duplicateRes = await fetch(`${baseUrl}/api/v1/jobs/${createdJobId}/apply`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${realRider1Token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: 'Applying again' }),
      });
      assert.equal(duplicateRes.status, 409);

      // 9. Rider 2 applies and fills the second slot
      const apply2Res = await fetch(`${baseUrl}/api/v1/jobs/${createdJobId}/apply`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${realRider2Token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: 'Rider 2 applying' }),
      });
      assert.equal(apply2Res.status, 201);
      const apply2Json = await apply2Res.json();

      const accept2Res = await fetch(`${baseUrl}/api/v1/merchant/applications/${apply2Json.data.id}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${realMerchantToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'accepted' }),
      });
      assert.equal(accept2Res.status, 200);

      // Verify job in DB is now fully occupied (2/2)
      const fullJobInDb = await Job.findById(createdJobId);
      assert.ok(fullJobInDb);
      assert.equal(fullJobInDb.acceptedRidersCount, 2);

      // 10. Rider 3 application rejected because capacity is now full (400 Bad Request)
      const fullRes = await fetch(`${baseUrl}/api/v1/jobs/${createdJobId}/apply`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${realRider3Token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: 'Trying full job' }),
      });
      assert.equal(fullRes.status, 400);
      const fullJson = await fullRes.json();
      assert.match(fullJson.message, /full capacity/i);
    });

    // Clean up MongoDB connection after tests
    await JobApplication.deleteMany({});
    await Job.deleteMany({});
    await RestStop.deleteMany({});
    await User.deleteMany({});
    await mongoose.disconnect();
  });
});
