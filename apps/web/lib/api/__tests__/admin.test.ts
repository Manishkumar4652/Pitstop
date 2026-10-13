import test from 'node:test';
import assert from 'node:assert/strict';
import http, { Server } from 'node:http';
import { NextRequest } from 'next/server';
import { GET as getStatsHandler } from '../../../app/api/admin/stats/route';
import { GET as getMerchantsHandler } from '../../../app/api/admin/merchants/route';
import { GET as getMerchantByIdHandler } from '../../../app/api/admin/merchants/[id]/route';
import { PATCH as updateMerchantStatusHandler } from '../../../app/api/admin/merchants/[id]/status/route';
import { GET as getRestStopsHandler } from '../../../app/api/admin/rest-stops/route';
import { PATCH as updateRestStopStatusHandler } from '../../../app/api/admin/rest-stops/[id]/status/route';
import { GET as getJobsHandler } from '../../../app/api/admin/jobs/route';
import { PATCH as updateJobStatusHandler } from '../../../app/api/admin/jobs/[id]/status/route';
import { GET as getDealsHandler } from '../../../app/api/admin/deals/route';
import { PATCH as updateDealStatusHandler } from '../../../app/api/admin/deals/[id]/status/route';
import { GET as getAuditLogsHandler } from '../../../app/api/admin/audit-logs/route';
import { AUTH_COOKIE_NAME } from '../../auth/cookies';

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

test('Admin Console BFF & System Moderation Suite (Phase 9)', async (t) => {
  const originalBaseUrl = process.env.PITSTOP_API_BASE_URL;

  t.afterEach(() => {
    process.env.PITSTOP_API_BASE_URL = originalBaseUrl;
  });

  // ==========================================
  // 1. Admin Stats BFF
  // ==========================================
  await t.test('GET /api/admin/stats returns 401 when auth cookie is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/stats');
    const res = await getStatsHandler(req);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /authentication required/i);
  });

  await t.test('GET /api/admin/stats forwards token and returns stats from backend', async () => {
    let capturedAuth = '';
    const { server, url } = await createMockBackend((req, res) => {
      capturedAuth = req.headers.authorization || '';
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: true,
          data: {
            users: { total: 10, riders: 6, merchants: 3, admins: 1, pendingMerchants: 1 },
            restStops: { total: 5, active: 3, pendingApproval: 1, suspended: 1 },
            deals: { total: 8, active: 6, inactive: 2 },
            jobs: { total: 4, open: 2, inProgress: 1, completed: 1, cancelled: 0 },
            applications: { total: 12, pending: 4, accepted: 6, rejected: 2, withdrawn: 0 },
            recentActivity: [],
          },
        })
      );
    });

    process.env.PITSTOP_API_BASE_URL = url;

    try {
      const req = new NextRequest('http://localhost:3000/api/admin/stats', {
        headers: {
          cookie: `${AUTH_COOKIE_NAME}=valid_admin_jwt_token`,
        },
      });

      const res = await getStatsHandler(req);
      assert.equal(res.status, 200);
      assert.equal(capturedAuth, 'Bearer valid_admin_jwt_token');
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.users.total, 10);
      assert.equal(body.data.restStops.pendingApproval, 1);
    } finally {
      server.close();
    }
  });

  // ==========================================
  // 2. Admin Merchant Verification BFF
  // ==========================================
  await t.test('GET /api/admin/merchants returns 401 when auth cookie is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/merchants');
    const res = await getMerchantsHandler(req);
    assert.equal(res.status, 401);
  });

  await t.test('GET /api/admin/merchants forwards query params to backend', async () => {
    let capturedUrl = '';
    const { server, url } = await createMockBackend((req, res) => {
      capturedUrl = req.url || '';
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: true,
          data: {
            items: [],
            pagination: { page: 1, limit: 10, total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false },
          },
        })
      );
    });

    process.env.PITSTOP_API_BASE_URL = url;

    try {
      const req = new NextRequest(
        'http://localhost:3000/api/admin/merchants?page=2&status=pending_review&search=chai',
        {
          headers: {
            cookie: `${AUTH_COOKIE_NAME}=admin_token`,
          },
        }
      );

      const res = await getMerchantsHandler(req);
      assert.equal(res.status, 200);
      assert.ok(capturedUrl.includes('page=2'));
      assert.ok(capturedUrl.includes('status=pending_review'));
      assert.ok(capturedUrl.includes('search=chai'));
    } finally {
      server.close();
    }
  });

  await t.test('PATCH /api/admin/merchants/[id]/status rejects CSRF mismatch with 403', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/merchants/m-123/status', {
      method: 'PATCH',
      headers: {
        host: 'localhost:3000',
        cookie: `${AUTH_COOKIE_NAME}=admin_token`,
        origin: 'https://evil-attacker.com',
      },
      body: JSON.stringify({ status: 'verified' }),
    });

    const res = await updateMerchantStatusHandler(req, { params: Promise.resolve({ id: 'm-123' }) });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.match(body.message, /forgery/i);
  });

  await t.test('PATCH /api/admin/merchants/[id]/status forwards valid status update', async () => {
    let capturedBody = '';
    const { server, url } = await createMockBackend((req, res) => {
      let bodyData = '';
      req.on('data', (c) => (bodyData += c));
      req.on('end', () => {
        capturedBody = bodyData;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: true,
            data: { id: 'm-123', isVerified: true, merchantProfile: { verificationStatus: 'verified' } },
          })
        );
      });
    });

    process.env.PITSTOP_API_BASE_URL = url;

    try {
      const req = new NextRequest('http://localhost:3000/api/admin/merchants/m-123/status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `${AUTH_COOKIE_NAME}=admin_token`,
          origin: 'http://localhost:3000',
        },
        body: JSON.stringify({ status: 'verified', reason: 'Valid trade certificate' }),
      });

      const res = await updateMerchantStatusHandler(req, { params: Promise.resolve({ id: 'm-123' }) });
      assert.equal(res.status, 200);
      const json = JSON.parse(capturedBody);
      assert.equal(json.status, 'verified');
      assert.equal(json.reason, 'Valid trade certificate');
    } finally {
      server.close();
    }
  });

  // ==========================================
  // 3. Admin Rest-Stop Moderation BFF
  // ==========================================
  await t.test('PATCH /api/admin/rest-stops/[id]/status rejects CSRF and forwards status', async () => {
    const csrfReq = new NextRequest('http://localhost:3000/api/admin/rest-stops/rs-1/status', {
      method: 'PATCH',
      headers: {
        host: 'localhost:3000',
        cookie: `${AUTH_COOKIE_NAME}=admin_token`,
        origin: 'https://malicious.com',
      },
      body: JSON.stringify({ status: 'active' }),
    });

    const csrfRes = await updateRestStopStatusHandler(csrfReq, { params: Promise.resolve({ id: 'rs-1' }) });
    assert.equal(csrfRes.status, 403);

    const { server, url } = await createMockBackend((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: { id: 'rs-1', status: 'active' } }));
    });

    process.env.PITSTOP_API_BASE_URL = url;

    try {
      const validReq = new NextRequest('http://localhost:3000/api/admin/rest-stops/rs-1/status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `${AUTH_COOKIE_NAME}=admin_token`,
          origin: 'http://localhost:3000',
        },
        body: JSON.stringify({ status: 'active', reason: 'Passed inspection' }),
      });

      const res = await updateRestStopStatusHandler(validReq, { params: Promise.resolve({ id: 'rs-1' }) });
      assert.equal(res.status, 200);
    } finally {
      server.close();
    }
  });

  // ==========================================
  // 4. Admin Jobs & Deals Moderation BFF
  // ==========================================
  await t.test('PATCH /api/admin/jobs/[id]/status updates job status safely', async () => {
    const { server, url } = await createMockBackend((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: { id: 'job-1', status: 'cancelled' } }));
    });

    process.env.PITSTOP_API_BASE_URL = url;

    try {
      const req = new NextRequest('http://localhost:3000/api/admin/jobs/job-1/status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `${AUTH_COOKIE_NAME}=admin_token`,
          origin: 'http://localhost:3000',
        },
        body: JSON.stringify({ status: 'cancelled', reason: 'Flagged listing' }),
      });

      const res = await updateJobStatusHandler(req, { params: Promise.resolve({ id: 'job-1' }) });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.data.status, 'cancelled');
    } finally {
      server.close();
    }
  });

  await t.test('PATCH /api/admin/deals/[id]/status updates deal status safely', async () => {
    const { server, url } = await createMockBackend((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: { id: 'deal-1', isActive: false } }));
    });

    process.env.PITSTOP_API_BASE_URL = url;

    try {
      const req = new NextRequest('http://localhost:3000/api/admin/deals/deal-1/status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `${AUTH_COOKIE_NAME}=admin_token`,
          origin: 'http://localhost:3000',
        },
        body: JSON.stringify({ isActive: false, reason: 'Temporarily paused' }),
      });

      const res = await updateDealStatusHandler(req, { params: Promise.resolve({ id: 'deal-1' }) });
      assert.equal(res.status, 200);
    } finally {
      server.close();
    }
  });

  // ==========================================
  // 5. Admin Audit Logs BFF
  // ==========================================
  await t.test('GET /api/admin/audit-logs forwards targetType and returns logs', async () => {
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
                id: 'audit-1',
                adminId: 'admin-1',
                action: 'merchant_verification',
                targetType: 'merchant',
                targetId: 'm-1',
                createdAt: new Date().toISOString(),
              },
            ],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false },
          },
        })
      );
    });

    process.env.PITSTOP_API_BASE_URL = url;

    try {
      const req = new NextRequest('http://localhost:3000/api/admin/audit-logs?targetType=merchant', {
        headers: {
          cookie: `${AUTH_COOKIE_NAME}=admin_token`,
        },
      });

      const res = await getAuditLogsHandler(req);
      assert.equal(res.status, 200);
      assert.ok(capturedUrl.includes('targetType=merchant'));
      const body = await res.json();
      assert.equal(body.data.items.length, 1);
    } finally {
      server.close();
    }
  });
});
