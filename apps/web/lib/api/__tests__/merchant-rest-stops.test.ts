import test from 'node:test';
import assert from 'node:assert/strict';
import http, { Server } from 'node:http';
import { NextRequest } from 'next/server';
import { GET as listRestStopsHandler, POST as createRestStopHandler } from '../../../app/api/merchant/rest-stops/route';
import { GET as getRestStopHandler, PATCH as updateRestStopHandler } from '../../../app/api/merchant/rest-stops/[id]/route';
import { GET as getQrCredentialHandler } from '../../../app/api/merchant/rest-stops/[id]/qr-credential/route';
import { POST as rotateQrCredentialHandler } from '../../../app/api/merchant/rest-stops/[id]/qr-credential/rotate/route';
import { AUTH_COOKIE_NAME } from '../../auth/cookies';
import { UserRole, RestStopStatus, CapacityStatus, Facility } from 'shared-types';
import { MerchantRestStopApiError } from '../merchant-rest-stops';

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

test('Merchant Rest-Stop Management & Venue QR BFF Suite (Phase 6B)', async (t) => {
  const originalBaseUrl = process.env.PITSTOP_API_BASE_URL;

  t.afterEach(() => {
    process.env.PITSTOP_API_BASE_URL = originalBaseUrl;
  });

  // ==========================================
  // 1. Merchant Rest-Stops Listing BFF
  // ==========================================
  await t.test('GET /api/merchant/rest-stops returns 401 when auth cookie is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/merchant/rest-stops');
    const res = await listRestStopsHandler(req);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /authentication required/i);
  });

  await t.test('GET /api/merchant/rest-stops forwards token and query parameters to backend', async () => {
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
              id: 'rs-owner-1',
              merchantId: 'merchant-123',
              name: 'Indiranagar PitStop Hub',
              slug: 'indiranagar-pitstop-hub',
              description: 'Charging points and seating for gig partners',
              status: RestStopStatus.ACTIVE,
              facilities: [Facility.CHARGING, Facility.SEATING],
              capacity: { maxRiders: 15, currentOccupancy: 3, status: CapacityStatus.AVAILABLE },
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
      const req = new NextRequest('http://localhost:3000/api/merchant/rest-stops?status=active&search=Indiranagar', {
        headers: {
          cookie: `${AUTH_COOKIE_NAME}=mock_merchant_jwt_token`,
        },
      });

      const res = await listRestStopsHandler(req);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.items.length, 1);
      assert.equal(body.data.items[0].id, 'rs-owner-1');
      assert.equal(capturedAuth, 'Bearer mock_merchant_jwt_token');
      assert.match(capturedUrl, /status=active/);
      assert.match(capturedUrl, /search=Indiranagar/);
    } finally {
      server.close();
    }
  });

  // ==========================================
  // 2. Rest-Stop Creation BFF
  // ==========================================
  await t.test('POST /api/merchant/rest-stops rejects untrusted cross-origin requests (CSRF)', async () => {
    const req = new NextRequest('http://localhost:3000/api/merchant/rest-stops', {
      method: 'POST',
      headers: {
        host: 'localhost:3000',
        origin: 'https://evil-attacker-site.com',
        cookie: `${AUTH_COOKIE_NAME}=valid_token`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ name: 'Malicious Venue' }),
    });

    const res = await createRestStopHandler(req);
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error, 'Forbidden');
    assert.match(body.message, /CSRF/i);
  });

  await t.test('POST /api/merchant/rest-stops rejects schema-invalid input before hitting backend', async () => {
    const req = new NextRequest('http://localhost:3000/api/merchant/rest-stops', {
      method: 'POST',
      headers: {
        host: 'localhost:3000',
        origin: 'http://localhost:3000',
        cookie: `${AUTH_COOKIE_NAME}=valid_token`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Incomplete Venue',
        // missing address, location, facilities, capacity
      }),
    });

    const res = await createRestStopHandler(req);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error, 'ValidationError');
  });

  await t.test('POST /api/merchant/rest-stops forwards validated creation to backend with token', async () => {
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
            id: 'rs-new-777',
            merchantId: 'merchant-123',
            name: capturedBody.name,
            slug: 'new-cafe-koramangala',
            status: RestStopStatus.PENDING_APPROVAL,
          },
        };
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(mockCreated));
      });
    });

    process.env.PITSTOP_API_BASE_URL = url;

    try {
      const validPayload = {
        name: 'New Cafe Koramangala',
        description: 'Cozy rider hub with water and fast WiFi',
        address: {
          street: '12th Main Road',
          area: 'Koramangala 4th Block',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560034',
        },
        location: {
          type: 'Point',
          coordinates: [77.625, 12.934],
        },
        facilities: [Facility.DRINKING_WATER, Facility.CHARGING],
        images: [],
        capacity: {
          maxRiders: 12,
          status: CapacityStatus.AVAILABLE,
        },
        operatingHours: [
          { day: 'mon', openTime: '08:00', closeTime: '22:00', isOpen: true },
        ],
      };

      const req = new NextRequest('http://localhost:3000/api/merchant/rest-stops', {
        method: 'POST',
        headers: {
          host: 'localhost:3000',
          origin: 'http://localhost:3000',
          cookie: `${AUTH_COOKIE_NAME}=token_123`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(validPayload),
      });

      const res = await createRestStopHandler(req);
      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.id, 'rs-new-777');
      assert.equal(body.data.status, RestStopStatus.PENDING_APPROVAL);
      assert.equal(capturedAuth, 'Bearer token_123');
      assert.equal(capturedBody.name, 'New Cafe Koramangala');
    } finally {
      server.close();
    }
  });

  // ==========================================
  // 3. Rest-Stop Update BFF
  // ==========================================
  await t.test('PATCH /api/merchant/rest-stops/[id] rejects empty update payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/merchant/rest-stops/rs-123', {
      method: 'PATCH',
      headers: {
        host: 'localhost:3000',
        origin: 'http://localhost:3000',
        cookie: `${AUTH_COOKIE_NAME}=valid_token`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const res = await updateRestStopHandler(req, { params: Promise.resolve({ id: 'rs-123' }) });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error, 'BadRequest');
  });

  await t.test('PATCH /api/merchant/rest-stops/[id] denies cross-merchant update attempt (HTTP 403 from backend)', async () => {
    const { server, url } = await createMockBackend((req, res) => {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Forbidden', message: 'You do not own this rest stop.' }));
    });

    process.env.PITSTOP_API_BASE_URL = url;

    try {
      const req = new NextRequest('http://localhost:3000/api/merchant/rest-stops/rs-other-merchant', {
        method: 'PATCH',
        headers: {
          host: 'localhost:3000',
          origin: 'http://localhost:3000',
          cookie: `${AUTH_COOKIE_NAME}=merchant_token`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ description: 'Hacked description' }),
      });

      const res = await updateRestStopHandler(req, { params: Promise.resolve({ id: 'rs-other-merchant' }) });
      assert.equal(res.status, 403);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.match(body.message, /do not own/i);
    } finally {
      server.close();
    }
  });

  // ==========================================
  // 4. Venue QR Credential Retrieval BFF
  // ==========================================
  await t.test('GET /api/merchant/rest-stops/[id]/qr-credential returns 401 when auth cookie is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/merchant/rest-stops/rs-123/qr-credential');
    const res = await getQrCredentialHandler(req, { params: Promise.resolve({ id: 'rs-123' }) });
    assert.equal(res.status, 401);
  });

  await t.test('GET /api/merchant/rest-stops/[id]/qr-credential returns valid credential for active owned venue', async () => {
    const { server, url } = await createMockBackend((req, res) => {
      assert.equal(req.url, '/merchant/rest-stops/rs-123/qr-credential');
      assert.equal(req.headers.authorization, 'Bearer valid_token');

      const mockCredential = {
        success: true,
        data: {
          restStopId: 'rs-123',
          version: 1,
          qrCredential: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_qr_token',
          expiresAt: '2026-11-10T00:00:00.000Z',
        },
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(mockCredential));
    });

    process.env.PITSTOP_API_BASE_URL = url;

    try {
      const req = new NextRequest('http://localhost:3000/api/merchant/rest-stops/rs-123/qr-credential', {
        headers: {
          cookie: `${AUTH_COOKIE_NAME}=valid_token`,
        },
      });

      const res = await getQrCredentialHandler(req, { params: Promise.resolve({ id: 'rs-123' }) });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.restStopId, 'rs-123');
      assert.equal(body.data.version, 1);
      assert.ok(body.data.qrCredential);
    } finally {
      server.close();
    }
  });

  await t.test('GET /api/merchant/rest-stops/[id]/qr-credential passes through 403 on cross-merchant access attempt', async () => {
    const { server, url } = await createMockBackend((req, res) => {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Forbidden: You do not own this rest stop.' }));
    });

    process.env.PITSTOP_API_BASE_URL = url;

    try {
      const req = new NextRequest('http://localhost:3000/api/merchant/rest-stops/rs-other/qr-credential', {
        headers: {
          cookie: `${AUTH_COOKIE_NAME}=attacker_merchant_token`,
        },
      });

      const res = await getQrCredentialHandler(req, { params: Promise.resolve({ id: 'rs-other' }) });
      assert.equal(res.status, 403);
    } finally {
      server.close();
    }
  });

  // ==========================================
  // 5. Venue QR Rotation BFF
  // ==========================================
  await t.test('POST /api/merchant/rest-stops/[id]/qr-credential/rotate rejects cross-origin request (CSRF)', async () => {
    const req = new NextRequest('http://localhost:3000/api/merchant/rest-stops/rs-123/qr-credential/rotate', {
      method: 'POST',
      headers: {
        host: 'localhost:3000',
        origin: 'https://malicious-rotator.com',
        cookie: `${AUTH_COOKIE_NAME}=valid_token`,
      },
    });

    const res = await rotateQrCredentialHandler(req, { params: Promise.resolve({ id: 'rs-123' }) });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error, 'Forbidden');
  });

  await t.test('POST /api/merchant/rest-stops/[id]/qr-credential/rotate successfully increments version', async () => {
    let rotationEndpointCalled = false;

    const { server, url } = await createMockBackend((req, res) => {
      if (req.method === 'POST' && req.url === '/merchant/rest-stops/rs-123/qr-credential/rotate') {
        rotationEndpointCalled = true;
        const mockRotated = {
          success: true,
          message: 'Venue QR credential rotated successfully. Previous credentials have been invalidated.',
          data: {
            restStopId: 'rs-123',
            version: 2,
            qrCredential: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.rotated_v2_token',
            expiresAt: '2026-11-10T00:00:00.000Z',
          },
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(mockRotated));
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    process.env.PITSTOP_API_BASE_URL = url;

    try {
      const req = new NextRequest('http://localhost:3000/api/merchant/rest-stops/rs-123/qr-credential/rotate', {
        method: 'POST',
        headers: {
          host: 'localhost:3000',
          origin: 'http://localhost:3000',
          cookie: `${AUTH_COOKIE_NAME}=valid_token`,
        },
      });

      const res = await rotateQrCredentialHandler(req, { params: Promise.resolve({ id: 'rs-123' }) });
      assert.equal(res.status, 200);
      assert.equal(rotationEndpointCalled, true);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.version, 2);
      assert.match(body.message, /invalidated/i);
    } finally {
      server.close();
    }
  });

  // ==========================================
  // 6. Client API Error Class Verification
  // ==========================================
  await t.test('MerchantRestStopApiError exposes status code and error code', () => {
    const err = new MerchantRestStopApiError('Unauthorized access', 401, 'UNAUTHORIZED');
    assert.equal(err.name, 'MerchantRestStopApiError');
    assert.equal(err.message, 'Unauthorized access');
    assert.equal(err.statusCode, 401);
    assert.equal(err.errorCode, 'UNAUTHORIZED');
  });
});
