import test from 'node:test';
import assert from 'node:assert/strict';
import http, { Server } from 'node:http';
import { NextRequest } from 'next/server';
import { GET as listJobsHandler } from '../../../app/api/jobs/route';
import { GET as getJobHandler } from '../../../app/api/jobs/[id]/route';
import { POST as applyJobHandler } from '../../../app/api/jobs/[id]/apply/route';
import { GET as listRiderApplicationsHandler } from '../../../app/api/rider/applications/route';
import { POST as withdrawApplicationHandler } from '../../../app/api/rider/applications/[id]/withdraw/route';
import { AUTH_COOKIE_NAME } from '../../auth/cookies';
import { sanitizeReturnUrl } from '../../auth/return-url';
import { JobCategory, JobStatus, JobApplicationStatus } from 'shared-types';
import { JobApiError } from '../jobs';
import { RiderApplicationApiError } from '../rider-applications';

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

test('Rider Micro-Jobs Discovery, Applications & BFF Suite (Phase 7D - Mocked Backend)', async (t) => {
  const originalBaseUrl = process.env.PITSTOP_API_BASE_URL;

  t.afterEach(() => {
    process.env.PITSTOP_API_BASE_URL = originalBaseUrl;
  });

  // ==========================================
  // 1. Public Job Discovery (GET /api/jobs & /api/jobs/:id)
  // ==========================================
  await t.test('1.1 GET /api/jobs allows unauthenticated guest access and forwards query params', async () => {
    let capturedUrl = '';

    const { server, url } = await createMockBackend((req, res) => {
      capturedUrl = req.url || '';
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: true,
          data: {
            items: [
              {
                id: 'job-pub-1',
                restStopId: 'rs-1',
                restStopName: 'Indiranagar Rest Stop',
                title: 'Parcel Sorting Assistant',
                description: 'Afternoon package sorting task',
                category: JobCategory.PARCEL_SORTING,
                payAmount: 300,
                payType: 'fixed',
                durationMinutes: 60,
                startTime: '2026-10-15T14:00:00.000Z',
                endTime: '2026-10-15T16:00:00.000Z',
                requiredRiders: 2,
                acceptedRidersCount: 0,
                status: JobStatus.OPEN,
                instructions: 'Report to Ashok',
                createdAt: '2026-10-12T00:00:00.000Z',
                updatedAt: '2026-10-12T00:00:00.000Z',
              },
            ],
            pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          },
        })
      );
    });

    process.env.PITSTOP_API_BASE_URL = url;

    try {
      const req = new NextRequest('http://localhost:3000/api/jobs?category=parcel_sorting&sort=pay_desc');
      const res = await listJobsHandler(req);

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.items.length, 1);
      assert.equal(body.data.items[0].id, 'job-pub-1');
      assert.match(capturedUrl, /category=parcel_sorting/);
      assert.match(capturedUrl, /sort=pay_desc/);
    } finally {
      server.close();
    }
  });

  await t.test('1.2 GET /api/jobs rejects invalid query parameters with 400', async () => {
    const req = new NextRequest('http://localhost:3000/api/jobs?page=-1');
    const res = await listJobsHandler(req);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error, 'ValidationError');
  });

  await t.test('1.3 GET /api/jobs/[id] retrieves public job detail or returns 404', async () => {
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
      const req404 = new NextRequest('http://localhost:3000/api/jobs/job-not-found');
      const res404 = await getJobHandler(req404, { params: { id: 'job-not-found' } });
      assert.equal(res404.status, 404);

      const req200 = new NextRequest('http://localhost:3000/api/jobs/job-existing');
      const res200 = await getJobHandler(req200, { params: { id: 'job-existing' } });
      assert.equal(res200.status, 200);
      const body200 = await res200.json();
      assert.equal(body200.data.id, 'job-existing');
    } finally {
      server.close();
    }
  });

  // ==========================================
  // 2. Rider Job Application (POST /api/jobs/:id/apply)
  // ==========================================
  await t.test('2.1 POST /api/jobs/:id/apply rejects unauthenticated callers with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/jobs/job-1/apply', {
      method: 'POST',
      body: JSON.stringify({ notes: 'Ready to work' }),
    });

    const res = await applyJobHandler(req, { params: { id: 'job-1' } });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.match(body.message, /authentication required/i);
  });

  await t.test('2.2 POST /api/jobs/:id/apply rejects CSRF violations with 403', async () => {
    const req = new NextRequest('http://localhost:3000/api/jobs/job-1/apply', {
      method: 'POST',
      headers: {
        origin: 'http://malicious-website.com',
        host: 'localhost:3000',
        cookie: `${AUTH_COOKIE_NAME}=mock_token`,
      },
      body: JSON.stringify({ notes: 'Nearby' }),
    });

    const res = await applyJobHandler(req, { params: { id: 'job-1' } });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.match(body.message, /csrf/i);
  });

  await t.test('2.3 POST /api/jobs/:id/apply rejects notes exceeding 200 characters with 400', async () => {
    const req = new NextRequest('http://localhost:3000/api/jobs/job-1/apply', {
      method: 'POST',
      headers: {
        host: 'localhost:3000',
        cookie: `${AUTH_COOKIE_NAME}=mock_token`,
      },
      body: JSON.stringify({ notes: 'A'.repeat(201) }),
    });

    const res = await applyJobHandler(req, { params: { id: 'job-1' } });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error, 'ValidationError');
  });

  await t.test('2.4 POST /api/jobs/:id/apply submits application successfully (201)', async () => {
    let capturedAuth = '';
    let capturedBody: any = null;

    const { server, url } = await createMockBackend((req, res) => {
      capturedAuth = req.headers.authorization || '';
      let data = '';
      req.on('data', (c) => (data += c));
      req.on('end', () => {
        capturedBody = data ? JSON.parse(data) : {};
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: true,
            data: {
              id: 'app-new-1',
              jobId: 'job-1',
              riderId: 'rider-123',
              status: JobApplicationStatus.PENDING,
              notes: capturedBody.notes,
            },
            message: 'Application submitted successfully',
          })
        );
      });
    });

    process.env.PITSTOP_API_BASE_URL = url;

    try {
      const req = new NextRequest('http://localhost:3000/api/jobs/job-1/apply', {
        method: 'POST',
        headers: {
          host: 'localhost:3000',
          cookie: `${AUTH_COOKIE_NAME}=mock_rider_token`,
        },
        body: JSON.stringify({ notes: 'Available immediately' }),
      });

      const res = await applyJobHandler(req, { params: { id: 'job-1' } });
      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.id, 'app-new-1');
      assert.equal(capturedAuth, 'Bearer mock_rider_token');
      assert.equal(capturedBody.notes, 'Available immediately');
    } finally {
      server.close();
    }
  });

  await t.test('2.5 POST /api/jobs/:id/apply forwards HTTP 409 conflict on duplicate application', async () => {
    const { server, url } = await createMockBackend((req, res) => {
      res.writeHead(409, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: false,
          error: 'Conflict',
          message: 'You have already applied for this micro-job.',
        })
      );
    });

    process.env.PITSTOP_API_BASE_URL = url;

    try {
      const req = new NextRequest('http://localhost:3000/api/jobs/job-1/apply', {
        method: 'POST',
        headers: {
          host: 'localhost:3000',
          cookie: `${AUTH_COOKIE_NAME}=mock_rider_token`,
        },
        body: JSON.stringify({}),
      });

      const res = await applyJobHandler(req, { params: { id: 'job-1' } });
      assert.equal(res.status, 409);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.match(body.message, /already applied/i);
    } finally {
      server.close();
    }
  });

  // ==========================================
  // 3. Rider Application History (GET /api/rider/applications)
  // ==========================================
  await t.test('3.1 GET /api/rider/applications returns 401 when token is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/rider/applications');
    const res = await listRiderApplicationsHandler(req);
    assert.equal(res.status, 401);
  });

  await t.test('3.2 GET /api/rider/applications forwards status filter and pagination', async () => {
    let capturedUrl = '';
    let capturedAuth = '';

    const { server, url } = await createMockBackend((req, res) => {
      capturedUrl = req.url || '';
      capturedAuth = req.headers.authorization || '';

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: true,
          data: {
            items: [
              {
                id: 'app-rider-1',
                jobId: 'job-1',
                jobTitle: 'Parcel Sorting',
                restStopName: 'Indiranagar Hub',
                payAmount: 250,
                payType: 'fixed',
                status: JobApplicationStatus.ACCEPTED,
                createdAt: '2026-10-12T00:00:00.000Z',
              },
            ],
            pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          },
        })
      );
    });

    process.env.PITSTOP_API_BASE_URL = url;

    try {
      const req = new NextRequest('http://localhost:3000/api/rider/applications?status=accepted&page=1', {
        headers: { cookie: `${AUTH_COOKIE_NAME}=test_rider_token` },
      });

      const res = await listRiderApplicationsHandler(req);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.items.length, 1);
      assert.equal(capturedAuth, 'Bearer test_rider_token');
      assert.match(capturedUrl, /status=accepted/);
    } finally {
      server.close();
    }
  });

  // ==========================================
  // 4. Rider Application Withdrawal (POST /api/rider/applications/:id/withdraw)
  // ==========================================
  await t.test('4.1 POST /api/rider/applications/:id/withdraw rejects CSRF violations', async () => {
    const req = new NextRequest('http://localhost:3000/api/rider/applications/app-1/withdraw', {
      method: 'POST',
      headers: {
        origin: 'http://malicious.io',
        host: 'localhost:3000',
        cookie: `${AUTH_COOKIE_NAME}=test_token`,
      },
    });

    const res = await withdrawApplicationHandler(req, { params: { id: 'app-1' } });
    assert.equal(res.status, 403);
  });

  await t.test('4.2 POST /api/rider/applications/:id/withdraw withdraws pending application successfully', async () => {
    let capturedUrl = '';

    const { server, url } = await createMockBackend((req, res) => {
      capturedUrl = req.url || '';
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: true,
          data: { id: 'app-1', status: JobApplicationStatus.WITHDRAWN },
          message: 'Application withdrawn successfully',
        })
      );
    });

    process.env.PITSTOP_API_BASE_URL = url;

    try {
      const req = new NextRequest('http://localhost:3000/api/rider/applications/app-1/withdraw', {
        method: 'POST',
        headers: {
          host: 'localhost:3000',
          cookie: `${AUTH_COOKIE_NAME}=test_token`,
        },
      });

      const res = await withdrawApplicationHandler(req, { params: { id: 'app-1' } });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.status, 'withdrawn');
      assert.match(capturedUrl, /app-1\/withdraw/);
    } finally {
      server.close();
    }
  });

  await t.test('4.3 POST /api/rider/applications/:id/withdraw propagates backend 400 when withdrawing non-pending application', async () => {
    const { server, url } = await createMockBackend((req, res) => {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: false,
          error: 'BadRequest',
          message: 'Only pending applications can be withdrawn.',
        })
      );
    });

    process.env.PITSTOP_API_BASE_URL = url;

    try {
      const req = new NextRequest('http://localhost:3000/api/rider/applications/app-accepted/withdraw', {
        method: 'POST',
        headers: {
          host: 'localhost:3000',
          cookie: `${AUTH_COOKIE_NAME}=test_token`,
        },
      });

      const res = await withdrawApplicationHandler(req, { params: { id: 'app-accepted' } });
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.match(body.message, /only pending/i);
    } finally {
      server.close();
    }
  });

  // ==========================================
  // 5. Security & Invariant Verification
  // ==========================================
  await t.test('5.1 JWT token is never leaked in response text', async () => {
    const { server, url } = await createMockBackend((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: { items: [] } }));
    });

    process.env.PITSTOP_API_BASE_URL = url;

    try {
      const req = new NextRequest('http://localhost:3000/api/rider/applications', {
        headers: { cookie: `${AUTH_COOKIE_NAME}=secret_jwt_bearer_token_999` },
      });

      const res = await listRiderApplicationsHandler(req);
      const text = await res.text();
      assert.ok(!text.includes('secret_jwt_bearer_token_999'), 'JWT must not be reflected');
    } finally {
      server.close();
    }
  });

  await t.test('5.2 sanitizeReturnUrl blocks open-redirects and preserves safe job returns', () => {
    assert.equal(sanitizeReturnUrl('/jobs?jobId=123', '/jobs'), '/jobs?jobId=123');
    assert.equal(sanitizeReturnUrl('//evil.com', '/jobs'), '/jobs');
    assert.equal(sanitizeReturnUrl('/\\evil.com', '/jobs'), '/jobs');
    assert.equal(sanitizeReturnUrl('https://evil.com', '/jobs'), '/jobs');
    assert.equal(sanitizeReturnUrl(null, '/jobs'), '/jobs');
  });

  await t.test('5.3 Custom error classes expose status codes and properties', () => {
    const jobErr = new JobApiError('Conflict', 409, 'ConflictError');
    assert.equal(jobErr.status, 409);
    assert.equal(jobErr.statusCode, 409);
    assert.equal(jobErr.name, 'JobApiError');

    const appErr = new RiderApplicationApiError('Forbidden', 403, 'ForbiddenError');
    assert.equal(appErr.status, 403);
    assert.equal(appErr.statusCode, 403);
    assert.equal(appErr.name, 'RiderApplicationApiError');
  });
});
