import test from 'node:test';
import assert from 'node:assert/strict';
import http, { Server } from 'node:http';
import { NextRequest } from 'next/server';
import { POST as verifyHandler } from '../../../app/api/check-ins/verify/route';
import { GET as meHandler } from '../../../app/api/check-ins/me/route';
import { POST as initiateHandler } from '../../../app/api/check-ins/route';
import { POST as cancelHandler } from '../../../app/api/check-ins/[id]/cancel/route';
import { AUTH_COOKIE_NAME } from '../../auth/cookies';
import { CheckInApiError } from '../check-ins';
import { CheckinStatus } from 'shared-types';

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

test('Rider QR Scanner & Check-In Verification BFF Suite (Phase 5B2)', async (t) => {
  const originalBaseUrl = process.env.PITSTOP_API_BASE_URL;

  t.afterEach(() => {
    process.env.PITSTOP_API_BASE_URL = originalBaseUrl;
  });

  // ==========================================
  // 1. BFF /api/check-ins/verify Tests
  // ==========================================
  await t.test('POST /api/check-ins/verify rejects untrusted cross-origin request (HTTP 403)', async () => {
    const req = new NextRequest('http://localhost:3000/api/check-ins/verify', {
      method: 'POST',
      headers: {
        host: 'localhost:3000',
        origin: 'https://attacker-origin.com',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ restStopId: 'rs-001', qrCredential: 'token.sig' }),
    });

    const res = await verifyHandler(req);
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.match(body.message, /csrf/i);
  });

  await t.test('POST /api/check-ins/verify returns 401 when auth cookie is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/check-ins/verify', {
      method: 'POST',
      headers: {
        host: 'localhost:3000',
        origin: 'http://localhost:3000',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ restStopId: 'rs-001', qrCredential: 'token.sig' }),
    });

    const res = await verifyHandler(req);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.match(body.message, /authentication required/i);
  });

  await t.test('POST /api/check-ins/verify returns 400 on malformed or missing fields', async () => {
    const req = new NextRequest('http://localhost:3000/api/check-ins/verify', {
      method: 'POST',
      headers: {
        host: 'localhost:3000',
        origin: 'http://localhost:3000',
        cookie: `${AUTH_COOKIE_NAME}=test-rider-jwt-token`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ restStopId: '' }), // missing qrCredential and invalid restStopId
    });

    const res = await verifyHandler(req);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error, 'ValidationError');
  });

  await t.test('POST /api/check-ins/verify forwards verified request to backend and returns DTO', async () => {
    let capturedAuthHeader: string | undefined;
    let capturedBody: any;

    const { server, url } = await createMockBackend((req, res) => {
      capturedAuthHeader = req.headers['authorization'];
      let chunks = '';
      req.on('data', (c) => (chunks += c));
      req.on('end', () => {
        capturedBody = JSON.parse(chunks);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: true,
            data: {
              id: 'ci-12345',
              restStopId: 'rs-001',
              restStopName: 'Chai Point Indiranagar',
              method: 'qr_code',
              status: 'verified',
              checkInTime: new Date().toISOString(),
              verifiedAt: new Date().toISOString(),
            },
            message: 'Check-in verified successfully via venue QR scan.',
          })
        );
      });
    });

    try {
      process.env.PITSTOP_API_BASE_URL = url;

      const req = new NextRequest('http://localhost:3000/api/check-ins/verify', {
        method: 'POST',
        headers: {
          host: 'localhost:3000',
          origin: 'http://localhost:3000',
          cookie: `${AUTH_COOKIE_NAME}=test-rider-jwt-token`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          restStopId: 'rs-001',
          qrCredential: 'valid.credential.payload',
        }),
      });

      const res = await verifyHandler(req);
      assert.equal(res.status, 200);
      assert.equal(capturedAuthHeader, 'Bearer test-rider-jwt-token');
      assert.equal(capturedBody.restStopId, 'rs-001');

      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.status, 'verified');
      assert.ok(body.data.verifiedAt);
    } finally {
      server.close();
    }
  });

  await t.test('POST /api/check-ins/verify forwards manual verificationCode to backend', async () => {
    let capturedBody: any;
    const { server, url } = await createMockBackend((req, res) => {
      let chunks = '';
      req.on('data', (c) => (chunks += c));
      req.on('end', () => {
        capturedBody = JSON.parse(chunks);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: true,
            data: {
              id: 'ci-manual-1',
              restStopId: 'rs-001',
              restStopName: 'Chai Point Indiranagar',
              method: 'otp',
              status: 'verified',
              checkInTime: new Date().toISOString(),
              verifiedAt: new Date().toISOString(),
            },
          })
        );
      });
    });

    try {
      process.env.PITSTOP_API_BASE_URL = url;
      const req = new NextRequest('http://localhost:3000/api/check-ins/verify', {
        method: 'POST',
        headers: {
          host: 'localhost:3000',
          origin: 'http://localhost:3000',
          cookie: `${AUTH_COOKIE_NAME}=test-rider-jwt-token`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          restStopId: 'rs-001',
          verificationCode: '482910',
        }),
      });

      const res = await verifyHandler(req);
      assert.equal(res.status, 201);
      assert.equal(capturedBody.verificationCode, '482910');
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.method, 'otp');
      assert.equal(body.data.status, 'verified');
    } finally {
      server.close();
    }
  });

  await t.test('POST /api/check-ins/verify cleanly forwards 409 Cooldown Conflict from backend', async () => {
    const { server, url } = await createMockBackend((_req, res) => {
      res.writeHead(409, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: false,
          error: 'ConflictError',
          message: 'A verified check-in for this rest stop was already recorded within the last 15 minutes.',
        })
      );
    });

    try {
      process.env.PITSTOP_API_BASE_URL = url;

      const req = new NextRequest('http://localhost:3000/api/check-ins/verify', {
        method: 'POST',
        headers: {
          host: 'localhost:3000',
          origin: 'http://localhost:3000',
          cookie: `${AUTH_COOKIE_NAME}=test-rider-jwt-token`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          restStopId: 'rs-001',
          qrCredential: 'valid.credential.payload',
        }),
      });

      const res = await verifyHandler(req);
      assert.equal(res.status, 409);
      const body = await res.json();
      assert.match(body.message, /last 15 minutes/i);
    } finally {
      server.close();
    }
  });

  await t.test('POST /api/check-ins/verify cleanly forwards 400 Invalid QR from backend', async () => {
    const { server, url } = await createMockBackend((_req, res) => {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: false,
          error: 'BadRequestError',
          message: 'Venue QR credential has expired or been revoked.',
        })
      );
    });

    try {
      process.env.PITSTOP_API_BASE_URL = url;

      const req = new NextRequest('http://localhost:3000/api/check-ins/verify', {
        method: 'POST',
        headers: {
          host: 'localhost:3000',
          origin: 'http://localhost:3000',
          cookie: `${AUTH_COOKIE_NAME}=test-rider-jwt-token`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          restStopId: 'rs-001',
          qrCredential: 'expired.token.sig',
        }),
      });

      const res = await verifyHandler(req);
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.match(body.message, /expired or been revoked/i);
    } finally {
      server.close();
    }
  });

  // ==========================================
  // 2. BFF /api/check-ins/me History Tests
  // ==========================================
  await t.test('GET /api/check-ins/me returns 401 when auth cookie is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/check-ins/me');
    const res = await meHandler(req);
    assert.equal(res.status, 401);
  });

  await t.test('GET /api/check-ins/me forwards query parameters and returns check-in history', async () => {
    let capturedUrl: string | undefined;

    const { server, url } = await createMockBackend((req, res) => {
      capturedUrl = req.url;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: true,
          data: {
            items: [
              {
                id: 'ci-001',
                restStopId: 'rs-001',
                restStopName: 'Chai Point Indiranagar',
                method: 'qr_code',
                status: 'verified',
                checkInTime: new Date().toISOString(),
                verifiedAt: new Date().toISOString(),
              },
            ],
            pagination: {
              page: 1,
              limit: 5,
              total: 1,
              totalPages: 1,
              hasNextPage: false,
              hasPrevPage: false,
            },
          },
        })
      );
    });

    try {
      process.env.PITSTOP_API_BASE_URL = url;

      const req = new NextRequest('http://localhost:3000/api/check-ins/me?limit=5&sort=newest', {
        headers: {
          cookie: `${AUTH_COOKIE_NAME}=test-rider-jwt-token`,
        },
      });

      const res = await meHandler(req);
      assert.equal(res.status, 200);
      assert.ok(capturedUrl?.includes('limit=5'));

      const body = await res.json();
      assert.equal(body.data.items.length, 1);
      assert.equal(body.data.items[0].status, 'verified');
    } finally {
      server.close();
    }
  });

  // ==========================================
  // 3. CheckInApiError & Callback Deduplication Logic
  // ==========================================
  await t.test('CheckInApiError provides statusCode and errorCode', () => {
    const err = new CheckInApiError('Cooldown active', 409, 'ConflictError');
    assert.equal(err.message, 'Cooldown active');
    assert.equal(err.statusCode, 409);
    assert.equal(err.errorCode, 'ConflictError');
    assert.equal(err.name, 'CheckInApiError');
  });

  await t.test('Scanner callback deduplication simulates single execution during active processing', () => {
    let executionCount = 0;
    const isProcessingRef = { current: false };

    const simulateScanCallback = (token: string) => {
      if (isProcessingRef.current) {
        return false; // deduplicated, ignored
      }
      isProcessingRef.current = true;
      executionCount++;
      return true;
    };

    // First scan callback triggers processing
    const firstResult = simulateScanCallback('token.part1.part2');
    assert.equal(firstResult, true);
    assert.equal(executionCount, 1);

    // Rapid successive callbacks while isProcessingRef is true are dropped
    const secondResult = simulateScanCallback('token.part1.part2');
    const thirdResult = simulateScanCallback('token.part1.part2');
    assert.equal(secondResult, false);
    assert.equal(thirdResult, false);
    assert.equal(executionCount, 1, 'Only exactly 1 request should be executed');

    // Reset processing flag
    isProcessingRef.current = false;
    const fourthResult = simulateScanCallback('new.token.payload');
    assert.equal(fourthResult, true);
    assert.equal(executionCount, 2);
  });
});
