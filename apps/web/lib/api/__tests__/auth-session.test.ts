import test from 'node:test';
import assert from 'node:assert/strict';
import http, { Server } from 'node:http';
import { NextRequest } from 'next/server';
import { POST as registerHandler } from '../../../app/api/auth/register/route';
import { POST as loginHandler } from '../../../app/api/auth/login/route';
import { GET as meHandler } from '../../../app/api/auth/me/route';
import { POST as logoutHandler } from '../../../app/api/auth/logout/route';
import { AUTH_COOKIE_NAME, getAuthCookieOptions } from '../../auth/cookies';
import { validateCsrfOrigin } from '../../auth/csrf';
import { UserRole } from 'shared-types';

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

test('Rider Authentication & Secure Session BFF Suite (Phase 5A)', async (t) => {
  const originalBaseUrl = process.env.PITSTOP_API_BASE_URL;

  t.afterEach(() => {
    process.env.PITSTOP_API_BASE_URL = originalBaseUrl;
  });

  // ==========================================
  // 1. Cookie & CSRF Security Rules
  // ==========================================
  await t.test('getAuthCookieOptions enforces HttpOnly, SameSite=lax, and path=/', () => {
    const opts = getAuthCookieOptions();
    assert.equal(opts.httpOnly, true);
    assert.equal(opts.sameSite, 'lax');
    assert.equal(opts.path, '/');
    assert.equal(typeof opts.maxAge, 'number');
    assert.ok(opts.maxAge > 0);
  });

  await t.test('validateCsrfOrigin verifies matching origin and reject untrusted origin', () => {
    // Valid same-origin request
    const validReq = new NextRequest('http://localhost:3000/api/auth/login', {
      headers: {
        host: 'localhost:3000',
        origin: 'http://localhost:3000',
      },
    });
    assert.equal(validateCsrfOrigin(validReq), true);

    // Untrusted cross-origin request
    const invalidReq = new NextRequest('http://localhost:3000/api/auth/login', {
      headers: {
        host: 'localhost:3000',
        origin: 'https://malicious-phishing-site.com',
      },
    });
    assert.equal(validateCsrfOrigin(invalidReq), false);
  });

  // ==========================================
  // 2. Rider Registration BFF
  // ==========================================
  await t.test('POST /api/auth/register issues HttpOnly cookie and does NOT expose JWT in JSON body', async () => {
    const mockUser = {
      id: 'rider-123',
      name: 'Ramesh Kumar',
      phone: '9876543210',
      role: UserRole.RIDER,
      isVerified: false,
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const { server, url } = await createMockBackend((req, res) => {
      if (req.url === '/auth/register' && req.method === 'POST') {
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: true,
            message: 'User registered successfully.',
            data: {
              token: 'jwt.secret.token.for.rider',
              user: mockUser,
            },
          })
        );
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    try {
      process.env.PITSTOP_API_BASE_URL = url;

      const req = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          host: 'localhost:3000',
          origin: 'http://localhost:3000',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Ramesh Kumar',
          phone: '9876543210',
          password: 'password123',
          riderProfile: {
            platform: 'zomato',
            vehicleType: '2-wheeler-ev',
          },
        }),
      });

      const response = await registerHandler(req);
      assert.equal(response.status, 201);

      const body = await response.json();
      assert.equal(body.success, true);
      assert.equal(body.user.id, 'rider-123');
      // Crucial Security Verification: JWT MUST NOT be returned in JSON body!
      assert.equal((body as any).token, undefined);

      // Verify HttpOnly cookie header was set
      const setCookie = response.headers.get('set-cookie');
      assert.ok(setCookie, 'set-cookie header must be present');
      assert.match(setCookie, /pitstop_token=jwt\.secret\.token\.for\.rider/);
      assert.match(setCookie, /HttpOnly/i);
    } finally {
      server.close();
    }
  });

  await t.test('POST /api/auth/register strictly rejects admin registration attempts', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        host: 'localhost:3000',
        origin: 'http://localhost:3000',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Malicious Attacker',
        phone: '9876543210',
        password: 'password123',
        role: 'admin',
      }),
    });

    const response = await registerHandler(req);
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.match(body.message, /admin/i);
  });

  // ==========================================
  // 3. Rider Login BFF
  // ==========================================
  await t.test('POST /api/auth/login issues HttpOnly cookie and does NOT expose JWT in JSON body', async () => {
    const mockUser = {
      id: 'rider-456',
      name: 'Priya Sharma',
      phone: '9876543211',
      role: UserRole.RIDER,
      isVerified: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const { server, url } = await createMockBackend((req, res) => {
      if (req.url === '/auth/login' && req.method === 'POST') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: true,
            message: 'Login successful.',
            data: {
              token: 'jwt.login.token.for.priya',
              user: mockUser,
            },
          })
        );
      } else {
        res.writeHead(401);
        res.end();
      }
    });

    try {
      process.env.PITSTOP_API_BASE_URL = url;

      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          host: 'localhost:3000',
          origin: 'http://localhost:3000',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: '9876543211',
          password: 'password123',
        }),
      });

      const response = await loginHandler(req);
      assert.equal(response.status, 200);

      const body = await response.json();
      assert.equal(body.success, true);
      assert.equal(body.user.name, 'Priya Sharma');
      // Crucial Security Verification: JWT MUST NOT be returned in JSON body!
      assert.equal((body as any).token, undefined);

      const setCookie = response.headers.get('set-cookie');
      assert.ok(setCookie);
      assert.match(setCookie, /pitstop_token=jwt\.login\.token\.for\.priya/);
      assert.match(setCookie, /HttpOnly/i);
    } finally {
      server.close();
    }
  });

  await t.test('POST /api/auth/login returns generic error on invalid credentials', async () => {
    const { server, url } = await createMockBackend((_req, res) => {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: false,
          error: 'UnauthorizedError',
          message: 'Invalid phone number or password. Please check your credentials.',
        })
      );
    });

    try {
      process.env.PITSTOP_API_BASE_URL = url;

      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          host: 'localhost:3000',
          origin: 'http://localhost:3000',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: '9876543210',
          password: 'wrongpassword',
        }),
      });

      const response = await loginHandler(req);
      assert.equal(response.status, 401);
      const body = await response.json();
      assert.equal(body.success, false);
      assert.match(body.message, /invalid phone number or password/i);
    } finally {
      server.close();
    }
  });

  // ==========================================
  // 4. Session Validation (GET /api/auth/me)
  // ==========================================
  await t.test('GET /api/auth/me returns 401 when cookie is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/me');
    const response = await meHandler(req);
    assert.equal(response.status, 401);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.match(body.message, /no active session/i);
  });

  await t.test('GET /api/auth/me returns user profile when cookie is valid', async () => {
    const mockUser = {
      id: 'rider-789',
      name: 'Anil Verma',
      phone: '9876543212',
      role: UserRole.RIDER,
      isVerified: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    let authHeaderCaptured = '';
    const { server, url } = await createMockBackend((req, res) => {
      authHeaderCaptured = req.headers['authorization'] || '';
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: true,
          data: {
            user: mockUser,
          },
        })
      );
    });

    try {
      process.env.PITSTOP_API_BASE_URL = url;

      const req = new NextRequest('http://localhost:3000/api/auth/me', {
        headers: {
          cookie: `${AUTH_COOKIE_NAME}=valid.session.jwt.token`,
        },
      });

      const response = await meHandler(req);
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.equal(body.success, true);
      assert.equal(body.user.name, 'Anil Verma');
      assert.equal(authHeaderCaptured, 'Bearer valid.session.jwt.token');
    } finally {
      server.close();
    }
  });

  await t.test('GET /api/auth/me clears cookie if backend returns 401 (expired session)', async () => {
    const { server, url } = await createMockBackend((_req, res) => {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'UnauthorizedError', message: 'Token expired' }));
    });

    try {
      process.env.PITSTOP_API_BASE_URL = url;

      const req = new NextRequest('http://localhost:3000/api/auth/me', {
        headers: {
          cookie: `${AUTH_COOKIE_NAME}=expired.session.jwt.token`,
        },
      });

      const response = await meHandler(req);
      assert.equal(response.status, 401);
      const setCookie = response.headers.get('set-cookie');
      assert.ok(setCookie);
      assert.match(setCookie, /Max-Age=0/i);
    } finally {
      server.close();
    }
  });

  // ==========================================
  // 5. Logout BFF
  // ==========================================
  await t.test('POST /api/auth/logout clears session cookie', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
      headers: {
        host: 'localhost:3000',
        origin: 'http://localhost:3000',
      },
    });

    const response = await logoutHandler(req);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.success, true);

    const setCookie = response.headers.get('set-cookie');
    assert.ok(setCookie);
    assert.match(setCookie, /Max-Age=0/i);
  });
});
