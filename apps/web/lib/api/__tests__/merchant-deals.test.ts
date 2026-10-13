import test from 'node:test';
import assert from 'node:assert/strict';
import http, { Server } from 'node:http';
import { NextRequest } from 'next/server';
import { GET as listDealsHandler, POST as createDealHandler } from '../../../app/api/merchant/deals/route';
import { GET as getDealHandler, PATCH as updateDealHandler } from '../../../app/api/merchant/deals/[id]/route';
import { AUTH_COOKIE_NAME } from '../../auth/cookies';
import { DealDiscountType } from 'shared-types';
import { MerchantDealApiError } from '../merchant-deals';

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

test('Merchant Deals Management BFF Suite (Phase 6C)', async (t) => {
  const originalBaseUrl = process.env.PITSTOP_API_BASE_URL;

  t.afterEach(() => {
    process.env.PITSTOP_API_BASE_URL = originalBaseUrl;
  });

  // ==========================================
  // 1. Merchant Deals Listing BFF
  // ==========================================
  await t.test('GET /api/merchant/deals returns 401 when auth cookie is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/merchant/deals');
    const res = await listDealsHandler(req);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /authentication required/i);
  });

  await t.test('GET /api/merchant/deals forwards token and query parameters to backend', async () => {
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
              id: 'deal-owner-1',
              restStopId: 'rs-owner-1',
              restStopName: 'Indiranagar PitStop Hub',
              merchantId: 'merchant-123',
              title: '50% Off Fresh Masala Chai',
              description: 'Exclusive afternoon discount for verified delivery riders.',
              discountType: DealDiscountType.PERCENTAGE,
              discountPercentage: 50,
              isActive: true,
              validFrom: '2026-01-01T00:00:00.000Z',
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
              status: 'active',
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
      const req = new NextRequest('http://localhost:3000/api/merchant/deals?status=active&search=Chai', {
        headers: {
          cookie: `${AUTH_COOKIE_NAME}=mock_merchant_token`,
        },
      });

      const res = await listDealsHandler(req);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.items.length, 1);
      assert.equal(body.data.items[0].id, 'deal-owner-1');
      assert.equal(capturedAuth, 'Bearer mock_merchant_token');
      assert.match(capturedUrl, /status=active/);
      assert.match(capturedUrl, /search=Chai/);
    } finally {
      server.close();
    }
  });

  // ==========================================
  // 2. Deal Creation BFF
  // ==========================================
  await t.test('POST /api/merchant/deals rejects cross-origin request (CSRF)', async () => {
    const req = new NextRequest('http://localhost:3000/api/merchant/deals', {
      method: 'POST',
      headers: {
        host: 'localhost:3000',
        origin: 'https://malicious-deals-attacker.com',
        cookie: `${AUTH_COOKIE_NAME}=valid_token`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ title: 'Malicious Deal' }),
    });

    const res = await createDealHandler(req);
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error, 'Forbidden');
    assert.match(body.message, /CSRF/i);
  });

  await t.test('POST /api/merchant/deals rejects schema-invalid input before hitting backend', async () => {
    const req = new NextRequest('http://localhost:3000/api/merchant/deals', {
      method: 'POST',
      headers: {
        host: 'localhost:3000',
        origin: 'http://localhost:3000',
        cookie: `${AUTH_COOKIE_NAME}=valid_token`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        restStopId: 'rs-123',
        title: 'Too', // < 5 chars
        description: 'Short', // < 10 chars
        discountType: 'percentage',
        discountPercentage: 150, // > 100%
      }),
    });

    const res = await createDealHandler(req);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error, 'ValidationError');
  });

  await t.test('POST /api/merchant/deals forwards validated creation to backend with token', async () => {
    let capturedBody: any = null;
    let capturedAuth = '';

    const { server, url } = await createMockBackend((req, res) => {
      capturedAuth = req.headers.authorization || '';
      let raw = '';
      req.on('data', (c) => (raw += c));
      req.on('end', () => {
        capturedBody = JSON.parse(raw);
        const mockCreated = {
          success: true,
          data: {
            id: 'deal-new-999',
            restStopId: capturedBody.restStopId,
            merchantId: 'merchant-123',
            title: capturedBody.title,
            description: capturedBody.description,
            discountType: capturedBody.discountType,
            discountPercentage: capturedBody.discountPercentage,
            isActive: true,
            status: 'active',
          },
        };
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(mockCreated));
      });
    });

    process.env.PITSTOP_API_BASE_URL = url;

    try {
      const validPayload = {
        restStopId: 'rs-owner-1',
        title: '25% Off Fresh Juice & Snacks',
        description: 'Exclusive afternoon energy booster for all gig delivery riders.',
        discountType: DealDiscountType.PERCENTAGE,
        discountPercentage: 25,
        validHours: '14:00 - 18:00',
        isActive: true,
      };

      const req = new NextRequest('http://localhost:3000/api/merchant/deals', {
        method: 'POST',
        headers: {
          host: 'localhost:3000',
          origin: 'http://localhost:3000',
          cookie: `${AUTH_COOKIE_NAME}=merchant_token_abc`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(validPayload),
      });

      const res = await createDealHandler(req);
      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.id, 'deal-new-999');
      assert.equal(capturedAuth, 'Bearer merchant_token_abc');
      assert.equal(capturedBody.title, '25% Off Fresh Juice & Snacks');
    } finally {
      server.close();
    }
  });

  // ==========================================
  // 3. Deal Detail & Update BFF
  // ==========================================
  await t.test('GET /api/merchant/deals/[id] returns single owned deal with restStopName', async () => {
    const { server, url } = await createMockBackend((req, res) => {
      assert.equal(req.url, '/merchant/deals/deal-owner-1');
      assert.equal(req.headers.authorization, 'Bearer valid_token');

      const mockDeal = {
        success: true,
        data: {
          id: 'deal-owner-1',
          restStopId: 'rs-owner-1',
          restStopName: 'Indiranagar Hub',
          merchantId: 'merchant-123',
          title: '50% Off Chai',
          description: 'Valid for delivery riders.',
          discountType: DealDiscountType.PERCENTAGE,
          discountPercentage: 50,
          isActive: true,
        },
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(mockDeal));
    });

    process.env.PITSTOP_API_BASE_URL = url;

    try {
      const req = new NextRequest('http://localhost:3000/api/merchant/deals/deal-owner-1', {
        headers: {
          cookie: `${AUTH_COOKIE_NAME}=valid_token`,
        },
      });

      const res = await getDealHandler(req, { params: Promise.resolve({ id: 'deal-owner-1' }) });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.id, 'deal-owner-1');
      assert.equal(body.data.restStopName, 'Indiranagar Hub');
    } finally {
      server.close();
    }
  });

  await t.test('GET /api/merchant/deals/[id] passes through 403 on cross-merchant access attempt', async () => {
    const { server, url } = await createMockBackend((req, res) => {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Forbidden', message: 'You do not have permission to view this deal.' }));
    });

    process.env.PITSTOP_API_BASE_URL = url;

    try {
      const req = new NextRequest('http://localhost:3000/api/merchant/deals/deal-other-merchant', {
        headers: {
          cookie: `${AUTH_COOKIE_NAME}=attacker_merchant_token`,
        },
      });

      const res = await getDealHandler(req, { params: Promise.resolve({ id: 'deal-other-merchant' }) });
      assert.equal(res.status, 403);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.match(body.message, /permission/i);
    } finally {
      server.close();
    }
  });

  await t.test('PATCH /api/merchant/deals/[id] rejects empty update payload (HTTP 400)', async () => {
    const req = new NextRequest('http://localhost:3000/api/merchant/deals/deal-123', {
      method: 'PATCH',
      headers: {
        host: 'localhost:3000',
        origin: 'http://localhost:3000',
        cookie: `${AUTH_COOKIE_NAME}=valid_token`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const res = await updateDealHandler(req, { params: Promise.resolve({ id: 'deal-123' }) });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error, 'BadRequest');
  });

  await t.test('PATCH /api/merchant/deals/[id] passes through backend 400 when attempting to activate expired deal', async () => {
    const { server, url } = await createMockBackend((req, res) => {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'BadRequest',
        message: 'Cannot activate an expired deal. Please update the validity period first.',
      }));
    });

    process.env.PITSTOP_API_BASE_URL = url;

    try {
      const req = new NextRequest('http://localhost:3000/api/merchant/deals/deal-expired-1', {
        method: 'PATCH',
        headers: {
          host: 'localhost:3000',
          origin: 'http://localhost:3000',
          cookie: `${AUTH_COOKIE_NAME}=merchant_token`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ isActive: true }),
      });

      const res = await updateDealHandler(req, { params: Promise.resolve({ id: 'deal-expired-1' }) });
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.match(body.message, /Cannot activate an expired deal/i);
    } finally {
      server.close();
    }
  });

  // ==========================================
  // 4. Client API Error Class Verification
  // ==========================================
  await t.test('MerchantDealApiError exposes status code and error code', () => {
    const err = new MerchantDealApiError('Forbidden access', 403, 'FORBIDDEN');
    assert.equal(err.name, 'MerchantDealApiError');
    assert.equal(err.message, 'Forbidden access');
    assert.equal(err.statusCode, 403);
    assert.equal(err.errorCode, 'FORBIDDEN');
  });
});
