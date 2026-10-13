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
import { verifyMerchantAccess } from '../../auth/merchant-session';
import { sanitizeReturnUrl } from '../../auth/return-url';
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

test('Merchant Authentication & Protected Portal Suite (Phase 6A)', async (t) => {
  const originalBaseUrl = process.env.PITSTOP_API_BASE_URL;

  t.afterEach(() => {
    process.env.PITSTOP_API_BASE_URL = originalBaseUrl;
  });

  // ==========================================
  // 1. Merchant Registration BFF
  // ==========================================
  await t.test('POST /api/auth/register registers merchant, issues HttpOnly cookie and does NOT expose JWT', async () => {
    const mockMerchant = {
      id: 'merchant-101',
      name: 'Ramesh Gupta',
      phone: '9876543220',
      email: 'ramesh.gupta@example.com',
      role: UserRole.MERCHANT,
      merchantProfile: {
        businessName: 'Gupta Chai & Rest Station',
        businessType: 'tea_stall',
        address: '100 Feet Road, Indiranagar, Bengaluru',
      },
      isVerified: false,
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    let capturedPayload: any = null;

    const { server, url } = await createMockBackend((req, res) => {
      if (req.url === '/auth/register' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', () => {
          capturedPayload = JSON.parse(body);
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              success: true,
              message: 'User registered successfully.',
              data: {
                token: 'jwt.merchant.secret.token',
                user: mockMerchant,
              },
            })
          );
        });
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
          name: 'Ramesh Gupta',
          phone: '9876543220',
          email: 'ramesh.gupta@example.com',
          password: 'Password123',
          role: UserRole.MERCHANT,
          merchantProfile: {
            businessName: 'Gupta Chai & Rest Station',
            businessType: 'tea_stall',
            address: '100 Feet Road, Indiranagar, Bengaluru',
          },
        }),
      });

      const response = await registerHandler(req);
      assert.equal(response.status, 201);

      const body = await response.json();
      assert.equal(body.success, true);
      assert.equal(body.user.role, UserRole.MERCHANT);
      assert.equal(body.user.merchantProfile.businessName, 'Gupta Chai & Rest Station');

      // Crucial Security Verification: JWT MUST NOT be exposed in body
      assert.equal((body as any).token, undefined);

      // Verify HttpOnly cookie header was set
      const setCookie = response.headers.get('set-cookie');
      assert.ok(setCookie, 'set-cookie header must be present');
      assert.match(setCookie, /pitstop_token=jwt\.merchant\.secret\.token/);
      assert.match(setCookie, /HttpOnly/i);

      // Verify payload forwarded to backend had role MERCHANT
      assert.equal(capturedPayload.role, UserRole.MERCHANT);
      assert.equal(capturedPayload.merchantProfile.businessName, 'Gupta Chai & Rest Station');
    } finally {
      server.close();
    }
  });

  await t.test('POST /api/auth/register strictly rejects public admin registration attempts', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        host: 'localhost:3000',
        origin: 'http://localhost:3000',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Attacker Attempting Escalation',
        phone: '9876543221',
        password: 'Password123',
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
  // 2. Merchant Login BFF & Role Enforcement
  // ==========================================
  await t.test('POST /api/auth/login succeeds for valid merchant with requiredRole: MERCHANT', async () => {
    const mockMerchant = {
      id: 'merchant-202',
      name: 'Pooja Reddy',
      phone: '9876543222',
      role: UserRole.MERCHANT,
      merchantProfile: {
        businessName: 'Reddy Cafe & Bakery',
        businessType: 'restaurant',
      },
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
              token: 'jwt.login.token.for.pooja',
              user: mockMerchant,
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

      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          host: 'localhost:3000',
          origin: 'http://localhost:3000',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: '9876543222',
          password: 'Password123',
          requiredRole: UserRole.MERCHANT,
        }),
      });

      const response = await loginHandler(req);
      assert.equal(response.status, 200);

      const body = await response.json();
      assert.equal(body.success, true);
      assert.equal(body.user.role, UserRole.MERCHANT);
      assert.equal(body.user.name, 'Pooja Reddy');
      assert.equal((body as any).token, undefined);

      const setCookie = response.headers.get('set-cookie');
      assert.ok(setCookie);
      assert.match(setCookie, /pitstop_token=jwt\.login\.token\.for\.pooja/);
      assert.match(setCookie, /HttpOnly/i);
    } finally {
      server.close();
    }
  });

  await t.test('POST /api/auth/login denies Rider attempting merchant portal login with HTTP 403 Forbidden and NO cookie', async () => {
    const mockRider = {
      id: 'rider-303',
      name: 'Ravi Teja',
      phone: '9876543223',
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
              token: 'jwt.login.token.for.ravi.rider',
              user: mockRider,
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

      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          host: 'localhost:3000',
          origin: 'http://localhost:3000',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: '9876543223',
          password: 'Password123',
          requiredRole: UserRole.MERCHANT,
        }),
      });

      const response = await loginHandler(req);
      assert.equal(response.status, 403);

      const body = await response.json();
      assert.equal(body.success, false);
      assert.equal(body.error, 'ForbiddenError');
      assert.match(body.message, /access denied/i);
      assert.match(body.message, /rider/i);
      assert.match(body.message, /merchant/i);

      // Verify that NO session cookie was issued
      const setCookie = response.headers.get('set-cookie');
      assert.equal(setCookie, null);
    } finally {
      server.close();
    }
  });

  await t.test('POST /api/auth/login rejects invalid credentials with generic HTTP 401 message', async () => {
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
          phone: '9876543224',
          password: 'IncorrectPassword',
          requiredRole: UserRole.MERCHANT,
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
  // 3. Session Restoration & Logout
  // ==========================================
  await t.test('GET /api/auth/me returns merchant profile and role for active merchant session', async () => {
    const mockMerchant = {
      id: 'merchant-404',
      name: 'Suresh QuickBite',
      phone: '9876543225',
      role: UserRole.MERCHANT,
      merchantProfile: {
        businessName: 'QuickBite Cloud Kitchen',
        businessType: 'restaurant',
      },
      isVerified: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const { server, url } = await createMockBackend((req, res) => {
      if (req.url === '/auth/me' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: true,
            data: { user: mockMerchant },
          })
        );
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    try {
      process.env.PITSTOP_API_BASE_URL = url;

      const req = new NextRequest('http://localhost:3000/api/auth/me', {
        headers: {
          cookie: `${AUTH_COOKIE_NAME}=valid.merchant.token`,
        },
      });

      const response = await meHandler(req);
      assert.equal(response.status, 200);

      const body = await response.json();
      assert.equal(body.success, true);
      assert.equal(body.user.role, UserRole.MERCHANT);
      assert.equal(body.user.name, 'Suresh QuickBite');
      assert.equal(body.user.merchantProfile.businessName, 'QuickBite Cloud Kitchen');
    } finally {
      server.close();
    }
  });

  await t.test('POST /api/auth/logout invalidates merchant session cookie', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
      headers: {
        host: 'localhost:3000',
        origin: 'http://localhost:3000',
      },
    });

    const response = await logoutHandler(req);
    assert.equal(response.status, 200);

    const setCookie = response.headers.get('set-cookie');
    assert.ok(setCookie);
    assert.match(setCookie, /Max-Age=0/i);
  });

  // ==========================================
  // 4. Return URL Sanitization & Open-Redirect Defense
  // ==========================================
  await t.test('Open-redirect patterns, protocol-relative URLs, and control characters are neutralized', () => {
    // Malicious open redirect attempts
    assert.equal(sanitizeReturnUrl('https://malicious-phishing.com'), '/merchant');
    assert.equal(sanitizeReturnUrl('http://evil.com/login'), '/merchant');
    assert.equal(sanitizeReturnUrl('//evil.com/path'), '/merchant');
    assert.equal(sanitizeReturnUrl('/\\evil.com'), '/merchant');
    assert.equal(sanitizeReturnUrl('/path\\with\\backslash'), '/merchant');
    assert.equal(sanitizeReturnUrl('javascript:alert(1)'), '/merchant');
    assert.equal(sanitizeReturnUrl('data:text/html,evil'), '/merchant');

    // Control characters and CRLF injection attempts
    assert.equal(sanitizeReturnUrl('/merchant\r\nevil.com'), '/merchant');
    assert.equal(sanitizeReturnUrl('/merchant\x00evil'), '/merchant');
    assert.equal(sanitizeReturnUrl('/merchant\x1fevil'), '/merchant');
    assert.equal(sanitizeReturnUrl('/merchant\x7fevil'), '/merchant');

    // Empty, null, or undefined values
    assert.equal(sanitizeReturnUrl(''), '/merchant');
    assert.equal(sanitizeReturnUrl(null), '/merchant');
    assert.equal(sanitizeReturnUrl(undefined), '/merchant');
    assert.equal(sanitizeReturnUrl('   '), '/merchant');

    // Custom fallback option
    assert.equal(sanitizeReturnUrl('//evil.com', '/rider/dashboard'), '/rider/dashboard');

    // Legitimate internal paths
    assert.equal(sanitizeReturnUrl('/merchant'), '/merchant');
    assert.equal(sanitizeReturnUrl('/merchant/deals'), '/merchant/deals');
    assert.equal(sanitizeReturnUrl('/merchant/rest-stops/new'), '/merchant/rest-stops/new');
    assert.equal(sanitizeReturnUrl('/merchant/jobs'), '/merchant/jobs');
    assert.equal(sanitizeReturnUrl('/rider/dashboard'), '/rider/dashboard');
  });

  // ==========================================
  // 5. CSRF Defense Verification
  // ==========================================
  await t.test('CSRF origin validation blocks cross-site attacks and verifies referer headers', () => {
    // 1. Cross-site attacker Origin
    const maliciousOriginReq = new NextRequest('http://localhost:3000/api/auth/login', {
      headers: {
        host: 'localhost:3000',
        origin: 'https://attacker-domain.xyz',
      },
    });
    assert.equal(validateCsrfOrigin(maliciousOriginReq), false);

    // 2. Matching legitimate Origin
    const validOriginReq = new NextRequest('http://localhost:3000/api/auth/login', {
      headers: {
        host: 'localhost:3000',
        origin: 'http://localhost:3000',
      },
    });
    assert.equal(validateCsrfOrigin(validOriginReq), true);

    // 3. Missing Origin but matching Referer
    const validRefererReq = new NextRequest('http://localhost:3000/api/auth/login', {
      headers: {
        host: 'localhost:3000',
        referer: 'http://localhost:3000/merchant/login',
      },
    });
    assert.equal(validateCsrfOrigin(validRefererReq), true);

    // 4. Missing Origin with external/malicious Referer
    const maliciousRefererReq = new NextRequest('http://localhost:3000/api/auth/login', {
      headers: {
        host: 'localhost:3000',
        referer: 'https://attacker.xyz/phishing-page',
      },
    });
    assert.equal(validateCsrfOrigin(maliciousRefererReq), false);

    // 5. Missing Origin and missing Referer (direct server-to-server / curl request)
    const missingHeadersReq = new NextRequest('http://localhost:3000/api/auth/login', {
      headers: {
        host: 'localhost:3000',
      },
    });
    assert.equal(validateCsrfOrigin(missingHeadersReq), true);
  });
});
