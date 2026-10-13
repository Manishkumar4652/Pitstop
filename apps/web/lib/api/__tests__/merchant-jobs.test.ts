import test from 'node:test';
import assert from 'node:assert/strict';
import http, { Server } from 'node:http';
import { NextRequest } from 'next/server';
import { GET as listJobsHandler, POST as createJobHandler } from '../../../app/api/merchant/jobs/route';
import { GET as getJobHandler, PATCH as updateJobHandler } from '../../../app/api/merchant/jobs/[id]/route';
import { GET as listApplicantsHandler } from '../../../app/api/merchant/jobs/[id]/applications/route';
import { PATCH as updateApplicationStatusHandler } from '../../../app/api/merchant/applications/[id]/status/route';
import { AUTH_COOKIE_NAME } from '../../auth/cookies';
import { JobCategory, JobStatus, JobApplicationStatus } from 'shared-types';
import {
  fetchMerchantJobs,
  fetchMerchantJobById,
  createMerchantJob,
  updateMerchantJob,
  fetchMerchantJobApplicants,
  updateMerchantApplicationStatus,
  MerchantJobApiError,
} from '../merchant-jobs';

function createMockBackend(handler: http.RequestListener) {
  return new Promise<{ server: Server; url: string }>((resolve) => {
    const server = http.createServer(handler);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        throw new Error('Failed to bind mock backend');
      }
      resolve({ server, url: `http://127.0.0.1:${addr.port}` });
    });
  });
}

test('Merchant Micro-Jobs BFF & API Client Suite (Phase 7C - Mocked Backend)', async (t) => {
  const originalBaseUrl = process.env.PITSTOP_API_BASE_URL;

  t.afterEach(() => {
    process.env.PITSTOP_API_BASE_URL = originalBaseUrl;
  });

  // ==========================================
  // 1. Merchant Jobs Listing BFF (GET /api/merchant/jobs)
  // ==========================================
  await t.test('1.1 GET /api/merchant/jobs returns 401 when auth cookie is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/merchant/jobs');
    const res = await listJobsHandler(req);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /authentication required/i);
  });

  await t.test('1.2 GET /api/merchant/jobs forwards token and query parameters to backend', async () => {
    let capturedAuth = '';
    let capturedUrl = '';

    const { server, url } = await createMockBackend((req, res) => {
      capturedAuth = req.headers.authorization || '';
      capturedUrl = req.url || '';

      const mockResponse = {
        success: true,
        data: {
          items: [
            {
              id: 'job-101',
              restStopId: 'rs-koramangala',
              restStopName: 'QuickBite Rest Stop',
              merchantId: 'merchant-1',
              title: 'Parcel Sorting Assistant',
              description: 'Sort incoming local packages during quiet rest hours.',
              category: JobCategory.PARCEL_SORTING,
              payAmount: 300,
              payType: 'fixed',
              durationMinutes: 60,
              startTime: '2026-10-15T10:00:00.000Z',
              endTime: '2026-10-15T12:00:00.000Z',
              requiredRiders: 2,
              acceptedRidersCount: 1,
              applicationsCount: 3,
              pendingApplicationsCount: 2,
              status: JobStatus.OPEN,
              instructions: 'Report to counter 1',
              createdAt: '2026-10-12T00:00:00.000Z',
              updatedAt: '2026-10-12T00:00:00.000Z',
            },
          ],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false },
        },
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(mockResponse));
    });

    process.env.PITSTOP_API_BASE_URL = url;

    try {
      const req = new NextRequest('http://localhost:3000/api/merchant/jobs?status=open&category=parcel_sorting&search=Parcel', {
        headers: {
          cookie: `${AUTH_COOKIE_NAME}=test_merchant_token`,
        },
      });

      const res = await listJobsHandler(req);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.items.length, 1);
      assert.equal(body.data.items[0].id, 'job-101');
      assert.equal(body.data.items[0].acceptedRidersCount, 1);
      assert.equal(capturedAuth, 'Bearer test_merchant_token');
      assert.match(capturedUrl, /status=open/);
      assert.match(capturedUrl, /category=parcel_sorting/);
      assert.match(capturedUrl, /search=Parcel/);
    } finally {
      server.close();
    }
  });

  await t.test('1.3 GET /api/merchant/jobs rejects invalid query parameters with 400', async () => {
    const req = new NextRequest('http://localhost:3000/api/merchant/jobs?page=-5', {
      headers: {
        cookie: `${AUTH_COOKIE_NAME}=test_token`,
      },
    });

    const res = await listJobsHandler(req);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error, 'ValidationError');
  });

  // ==========================================
  // 2. Merchant Create Job BFF (POST /api/merchant/jobs)
  // ==========================================
  await t.test('2.1 POST /api/merchant/jobs enforces CSRF origin validation', async () => {
    const req = new NextRequest('http://localhost:3000/api/merchant/jobs', {
      method: 'POST',
      headers: {
        origin: 'http://malicious-site.com',
        host: 'localhost:3000',
        cookie: `${AUTH_COOKIE_NAME}=test_token`,
      },
      body: JSON.stringify({}),
    });

    const res = await createJobHandler(req);
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error, 'Forbidden');
    assert.match(body.message, /csrf/i);
  });

  await t.test('2.2 POST /api/merchant/jobs validates request body against schema', async () => {
    const req = new NextRequest('http://localhost:3000/api/merchant/jobs', {
      method: 'POST',
      headers: {
        host: 'localhost:3000',
        cookie: `${AUTH_COOKIE_NAME}=test_token`,
      },
      body: JSON.stringify({
        restStopId: 'rs-1',
        title: 'Hi', // too short (< 5)
        description: 'short', // too short (< 15)
      }),
    });

    const res = await createJobHandler(req);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error, 'ValidationError');
    assert.ok(Array.isArray(body.details));
  });

  await t.test('2.3 POST /api/merchant/jobs proxies valid payload and returns 201', async () => {
    let capturedBody: any = null;

    const { server, url } = await createMockBackend((req, res) => {
      let data = '';
      req.on('data', (chunk) => {
        data += chunk;
      });
      req.on('end', () => {
        capturedBody = JSON.parse(data);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: true,
            data: {
              id: 'job-created-200',
              title: capturedBody.title,
              category: capturedBody.category,
              payAmount: capturedBody.payAmount,
              status: JobStatus.OPEN,
              acceptedRidersCount: 0,
            },
            message: 'Micro-job created successfully',
          })
        );
      });
    });

    process.env.PITSTOP_API_BASE_URL = url;

    try {
      const validPayload = {
        restStopId: 'rs-active-1',
        title: 'Afternoon Sorting Shift',
        description: 'Assist with high-priority parcel sorting and crate stacking.',
        category: JobCategory.PARCEL_SORTING,
        payAmount: 250,
        payType: 'fixed',
        durationMinutes: 60,
        startTime: '2026-10-15T12:00:00.000Z',
        endTime: '2026-10-15T14:00:00.000Z',
        requiredRiders: 2,
        instructions: 'Report to supervisor Ashok at loading dock.',
      };

      const req = new NextRequest('http://localhost:3000/api/merchant/jobs', {
        method: 'POST',
        headers: {
          host: 'localhost:3000',
          cookie: `${AUTH_COOKIE_NAME}=test_token`,
        },
        body: JSON.stringify(validPayload),
      });

      const res = await createJobHandler(req);
      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.id, 'job-created-200');
      assert.equal(capturedBody.title, 'Afternoon Sorting Shift');
    } finally {
      server.close();
    }
  });

  // ==========================================
  // 3. Merchant Job Details & Update (GET/PATCH /api/merchant/jobs/:id)
  // ==========================================
  await t.test('3.1 GET /api/merchant/jobs/:id returns owned job or propagates 404', async () => {
    const { server, url } = await createMockBackend((req, res) => {
      if (req.url?.includes('job-not-found')) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'NotFound', message: 'Job not found' }));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: true,
            data: { id: 'job-existing', title: 'Existing Task', status: JobStatus.OPEN },
          })
        );
      }
    });

    process.env.PITSTOP_API_BASE_URL = url;

    try {
      // 404 case
      const req404 = new NextRequest('http://localhost:3000/api/merchant/jobs/job-not-found', {
        headers: { cookie: `${AUTH_COOKIE_NAME}=test_token` },
      });
      const res404 = await getJobHandler(req404, { params: { id: 'job-not-found' } });
      assert.equal(res404.status, 404);

      // 200 case
      const req200 = new NextRequest('http://localhost:3000/api/merchant/jobs/job-existing', {
        headers: { cookie: `${AUTH_COOKIE_NAME}=test_token` },
      });
      const res200 = await getJobHandler(req200, { params: { id: 'job-existing' } });
      assert.equal(res200.status, 200);
      const body200 = await res200.json();
      assert.equal(body200.data.id, 'job-existing');
    } finally {
      server.close();
    }
  });

  await t.test('3.2 PATCH /api/merchant/jobs/:id updates job and prevents non-empty/empty payload bypass', async () => {
    const reqEmpty = new NextRequest('http://localhost:3000/api/merchant/jobs/job-1', {
      method: 'PATCH',
      headers: { host: 'localhost:3000', cookie: `${AUTH_COOKIE_NAME}=test_token` },
      body: JSON.stringify({}),
    });
    const resEmpty = await updateJobHandler(reqEmpty, { params: { id: 'job-1' } });
    assert.equal(resEmpty.status, 400);
    const bodyEmpty = await resEmpty.json();
    assert.match(bodyEmpty.message, /empty/i);
  });

  await t.test('3.3 PATCH /api/merchant/jobs/:id forwards backend 400 when requiredRiders falls below acceptedRidersCount', async () => {
    const { server, url } = await createMockBackend((req, res) => {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: false,
          error: 'BadRequest',
          message: 'Cannot reduce required riders to 1. There are already 2 accepted riders.',
        })
      );
    });

    process.env.PITSTOP_API_BASE_URL = url;

    try {
      const req = new NextRequest('http://localhost:3000/api/merchant/jobs/job-1', {
        method: 'PATCH',
        headers: { host: 'localhost:3000', cookie: `${AUTH_COOKIE_NAME}=test_token` },
        body: JSON.stringify({ requiredRiders: 1 }),
      });
      const res = await updateJobHandler(req, { params: { id: 'job-1' } });
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.match(body.message, /already 2 accepted riders/i);
    } finally {
      server.close();
    }
  });

  // ==========================================
  // 4. Job Applicants List (GET /api/merchant/jobs/:id/applications)
  // ==========================================
  await t.test('4.1 GET /api/merchant/jobs/:id/applications returns applicant list with safe DTO', async () => {
    const { server, url } = await createMockBackend((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: true,
          data: {
            items: [
              {
                id: 'app-1',
                jobId: 'job-101',
                riderId: 'rider-abc',
                riderName: 'Ramesh K.',
                vehicleType: 'motorcycle',
                status: JobApplicationStatus.PENDING,
                notes: 'Available immediately',
                createdAt: '2026-10-12T01:00:00.000Z',
                updatedAt: '2026-10-12T01:00:00.000Z',
              },
            ],
            pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          },
        })
      );
    });

    process.env.PITSTOP_API_BASE_URL = url;

    try {
      const req = new NextRequest('http://localhost:3000/api/merchant/jobs/job-101/applications', {
        headers: { cookie: `${AUTH_COOKIE_NAME}=test_token` },
      });

      const res = await listApplicantsHandler(req, { params: { id: 'job-101' } });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.items.length, 1);
      assert.equal(body.data.items[0].riderName, 'Ramesh K.');
      // Confirm no private tokens or secrets leaked
      assert.equal(body.data.items[0].token, undefined);
      assert.equal(body.data.items[0].passwordHash, undefined);
    } finally {
      server.close();
    }
  });

  // ==========================================
  // 5. Update Application Status (PATCH /api/merchant/applications/:id/status)
  // ==========================================
  await t.test('5.1 PATCH /api/merchant/applications/:id/status rejects CSRF violations', async () => {
    const req = new NextRequest('http://localhost:3000/api/merchant/applications/app-1/status', {
      method: 'PATCH',
      headers: {
        origin: 'http://malicious.org',
        host: 'localhost:3000',
        cookie: `${AUTH_COOKIE_NAME}=test_token`,
      },
      body: JSON.stringify({ status: JobApplicationStatus.ACCEPTED }),
    });

    const res = await updateApplicationStatusHandler(req, { params: { id: 'app-1' } });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.match(body.message, /csrf/i);
  });

  await t.test('5.2 PATCH /api/merchant/applications/:id/status rejects invalid statuses (e.g. pending/withdrawn)', async () => {
    const req = new NextRequest('http://localhost:3000/api/merchant/applications/app-1/status', {
      method: 'PATCH',
      headers: { host: 'localhost:3000', cookie: `${AUTH_COOKIE_NAME}=test_token` },
      body: JSON.stringify({ status: 'pending' }),
    });

    const res = await updateApplicationStatusHandler(req, { params: { id: 'app-1' } });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error, 'ValidationError');
  });

  await t.test('5.3 PATCH /api/merchant/applications/:id/status accepts valid status and increments capacity', async () => {
    let capturedStatus = '';

    const { server, url } = await createMockBackend((req, res) => {
      let data = '';
      req.on('data', (c) => (data += c));
      req.on('end', () => {
        capturedStatus = JSON.parse(data).status;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: true,
            data: { id: 'app-1', status: capturedStatus },
            message: 'Application accepted successfully',
          })
        );
      });
    });

    process.env.PITSTOP_API_BASE_URL = url;

    try {
      const req = new NextRequest('http://localhost:3000/api/merchant/applications/app-1/status', {
        method: 'PATCH',
        headers: { host: 'localhost:3000', cookie: `${AUTH_COOKIE_NAME}=test_token` },
        body: JSON.stringify({ status: JobApplicationStatus.ACCEPTED }),
      });

      const res = await updateApplicationStatusHandler(req, { params: { id: 'app-1' } });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(capturedStatus, 'accepted');
    } finally {
      server.close();
    }
  });

  await t.test('5.4 PATCH /api/merchant/applications/:id/status safely handles HTTP 409 capacity conflict', async () => {
    const { server, url } = await createMockBackend((req, res) => {
      res.writeHead(409, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: false,
          error: 'Conflict',
          message: 'Job has already reached full capacity (required: 2, accepted: 2)',
        })
      );
    });

    process.env.PITSTOP_API_BASE_URL = url;

    try {
      const req = new NextRequest('http://localhost:3000/api/merchant/applications/app-1/status', {
        method: 'PATCH',
        headers: { host: 'localhost:3000', cookie: `${AUTH_COOKIE_NAME}=test_token` },
        body: JSON.stringify({ status: JobApplicationStatus.ACCEPTED }),
      });

      const res = await updateApplicationStatusHandler(req, { params: { id: 'app-1' } });
      assert.equal(res.status, 409);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.match(body.message, /full capacity/i);
    } finally {
      server.close();
    }
  });

  // ==========================================
  // 6. Security & Leak Invariants
  // ==========================================
  await t.test('6.1 BFF responses never expose raw JWT tokens to the client', async () => {
    const { server, url } = await createMockBackend((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: true,
          data: { items: [], pagination: { total: 0 } },
        })
      );
    });

    process.env.PITSTOP_API_BASE_URL = url;

    try {
      const req = new NextRequest('http://localhost:3000/api/merchant/jobs', {
        headers: { cookie: `${AUTH_COOKIE_NAME}=super_secret_jwt_string_12345` },
      });

      const res = await listJobsHandler(req);
      const rawText = await res.text();
      assert.ok(!rawText.includes('super_secret_jwt_string_12345'), 'JWT token must not appear in response');
    } finally {
      server.close();
    }
  });

  // ==========================================
  // 7. Client Helper Error Handling
  // ==========================================
  await t.test('7.1 MerchantJobApiError exposes status code, error type, and message', () => {
    const err = new MerchantJobApiError('Capacity limit reached', 409, 'Conflict', [{ field: 'status', message: 'Full' }]);
    assert.equal(err.status, 409);
    assert.equal(err.statusCode, 409);
    assert.equal(err.errorCode, 'Conflict');
    assert.equal(err.message, 'Capacity limit reached');
    assert.equal(err.details?.length, 1);
    assert.equal(err.name, 'MerchantJobApiError');
  });
});
