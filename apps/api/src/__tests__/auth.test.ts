import test from 'node:test';
import assert from 'node:assert/strict';
import { Server } from 'http';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole, RegisterRequestSchema, LoginRequestSchema } from 'shared-types';
import { createApp } from '../app';
import { hashPassword, comparePassword } from '../utils/password';
import { signAccessToken, verifyAccessToken } from '../utils/jwt';
import { getJwtSecret, config } from '../config/env';
import { authenticateJwt } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { mockUserStore } from '../controllers/auth.controller';
import { sendSuccess } from '../utils/response';

const TEST_JWT_SECRET = 'a_very_secure_test_jwt_secret_that_has_at_least_32_characters_for_testing';

// Helper to launch test server with custom test routes
function setupAuthTestServer() {
  // Ensure valid test secret is configured in environment
  process.env.JWT_SECRET = TEST_JWT_SECRET;
  config.JWT_SECRET = TEST_JWT_SECRET;

  const testRouter = Router();

  // RBAC fixture 1: Admin only
  testRouter.get(
    '/test-admin-only',
    authenticateJwt,
    requireRoles(UserRole.ADMIN),
    (_req, res) => {
      sendSuccess(res, { secretAdminData: 'accessible_only_by_admin' });
    }
  );

  // RBAC fixture 2: Rider or Merchant only
  testRouter.get(
    '/test-rider-or-merchant',
    authenticateJwt,
    requireRoles(UserRole.RIDER, UserRole.MERCHANT),
    (_req, res) => {
      sendSuccess(res, { partnerData: 'accessible_by_riders_and_merchants' });
    }
  );

  const app = createApp(testRouter);

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

test('Authentication and Authorization Test Suite (Phase 3C)', async (t) => {
  const { server, baseUrl } = await setupAuthTestServer();

  t.after(() => {
    server.close();
    mockUserStore.clear();
  });

  // ==========================================
  // 1. Password Utility Tests
  // ==========================================
  await t.test('1. Password Hashing Utility', async (sub) => {
    await sub.test('hashPassword produces a valid bcrypt hash distinct from plaintext', async () => {
      const plaintext = 'SecurePass123';
      const hash = await hashPassword(plaintext);

      assert.notEqual(hash, plaintext);
      assert.ok(hash.startsWith('$2a$') || hash.startsWith('$2b$'));
    });

    await sub.test('comparePassword returns true for matching password', async () => {
      const plaintext = 'P@ssword999';
      const hash = await hashPassword(plaintext);
      const isMatch = await comparePassword(plaintext, hash);

      assert.equal(isMatch, true);
    });

    await sub.test('comparePassword returns false for non-matching password', async () => {
      const hash = await hashPassword('CorrectPass123');
      const isMatch = await comparePassword('WrongPassword!', hash);

      assert.equal(isMatch, false);
    });

    await sub.test('hashPassword rejects empty or short password', async () => {
      await assert.rejects(
        async () => {
          await hashPassword('');
        },
        { name: 'ValidationError' }
      );

      await assert.rejects(
        async () => {
          await hashPassword('12345'); // < 6 chars
        },
        { name: 'ValidationError' }
      );
    });

    await sub.test('hashPassword rejects excessively long passwords over 128 characters', async () => {
      const oversized = 'a'.repeat(129);
      await assert.rejects(
        async () => {
          await hashPassword(oversized);
        },
        { name: 'ValidationError' }
      );
    });
  });

  // ==========================================
  // 2. JWT Utility Tests
  // ==========================================
  await t.test('2. JWT Signing and Verification Utility', async (sub) => {
    await sub.test('signAccessToken generates a token that verifyAccessToken can decode', () => {
      const token = signAccessToken({
        userId: 'user-id-12345',
        role: UserRole.RIDER,
      });

      assert.ok(typeof token === 'string' && token.length > 20);

      const payload = verifyAccessToken(token);
      assert.equal(payload.sub, 'user-id-12345');
      assert.equal(payload.role, UserRole.RIDER);
    });

    await sub.test('verifyAccessToken rejects tampered token with invalid signature', () => {
      const validToken = signAccessToken({
        userId: 'user-id-12345',
        role: UserRole.RIDER,
      });
      const tamperedToken = validToken.slice(0, -6) + 'abcdef';

      assert.throws(
        () => {
          verifyAccessToken(tamperedToken);
        },
        { name: 'UnauthorizedError', message: 'Invalid authentication token' }
      );
    });

    await sub.test('verifyAccessToken rejects expired tokens', () => {
      // Create a token expired in the past (-10 seconds)
      const expiredToken = jwt.sign(
        { sub: 'expired-user-id', role: UserRole.RIDER },
        TEST_JWT_SECRET,
        { expiresIn: -10 }
      );

      assert.throws(
        () => {
          verifyAccessToken(expiredToken);
        },
        {
          name: 'UnauthorizedError',
          message: 'Authentication token has expired. Please log in again.',
        }
      );
    });

    await sub.test('getJwtSecret fails safely if secret is missing or under 32 characters', () => {
      const originalSecret = process.env.JWT_SECRET;
      process.env.JWT_SECRET = 'short_secret';
      config.JWT_SECRET = 'short_secret';

      assert.throws(
        () => {
          getJwtSecret();
        },
        /fewer than 32 characters/
      );

      // Restore secret
      process.env.JWT_SECRET = originalSecret;
      config.JWT_SECRET = originalSecret;
    });
  });

  // ==========================================
  // 3. Schema Validation Unit Tests
  // ==========================================
  await t.test('3. Shared Auth Schemas Validation', async (sub) => {
    await sub.test('RegisterRequestSchema accepts valid rider registration', () => {
      const validRider = {
        name: 'Ramesh Kumar',
        phone: '9876543210',
        email: 'ramesh@example.com',
        password: 'Password123!',
        role: UserRole.RIDER,
        riderProfile: {
          platform: 'zomato',
          vehicleType: '2-wheeler-petrol',
          vehicleNumber: 'KA-01-AB-1234',
        },
      };

      const result = RegisterRequestSchema.safeParse(validRider);
      assert.equal(result.success, true);
    });

    await sub.test('RegisterRequestSchema accepts valid merchant registration', () => {
      const validMerchant = {
        name: 'Suresh Patel',
        phone: '8765432109',
        password: 'MerchantPass123',
        role: UserRole.MERCHANT,
        merchantProfile: {
          businessName: 'Chai & Snacks Corner',
          businessType: 'tea_stall',
          address: 'Shop 12, Indiranagar 100ft Rd, Bengaluru',
        },
      };

      const result = RegisterRequestSchema.safeParse(validMerchant);
      assert.equal(result.success, true);
    });

    await sub.test('RegisterRequestSchema rejects admin role from public registration input', () => {
      const adminAttempt = {
        name: 'Malicious Attacker',
        phone: '9988776655',
        password: 'AdminPassword123!',
        role: 'admin',
      };

      const result = RegisterRequestSchema.safeParse(adminAttempt);
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(
          result.error.issues.some(
            (issue) => issue.path.includes('role') && issue.message.includes('Admin')
          )
        );
      }
    });

    await sub.test('RegisterRequestSchema rejects invalid Indian phone numbers', () => {
      const badPhone = {
        name: 'John Doe',
        phone: '1234567890', // Does not start with 6-9
        password: 'ValidPassword123',
        role: UserRole.RIDER,
      };

      const result = RegisterRequestSchema.safeParse(badPhone);
      assert.equal(result.success, false);
    });

    await sub.test('LoginRequestSchema validates phone and password fields', () => {
      const valid = { phone: '9876543210', password: 'SomePassword' };
      assert.equal(LoginRequestSchema.safeParse(valid).success, true);

      const missingPass = { phone: '9876543210' };
      assert.equal(LoginRequestSchema.safeParse(missingPass).success, false);
    });
  });

  // ==========================================
  // 4. API Registration Endpoint (/api/v1/auth/register)
  // ==========================================
  await t.test('4. POST /api/v1/auth/register', async (sub) => {
    await sub.test('Successfully registers a rider and returns safe profile without password', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Arun Swiggy Rider',
          phone: '9123456780',
          email: 'arun.swiggy@example.com',
          password: 'RiderSecret123',
          role: UserRole.RIDER,
          riderProfile: {
            platform: 'swiggy',
            vehicleType: '2-wheeler-ev',
          },
        }),
      });

      assert.equal(res.status, 201);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(typeof json.data.token === 'string');
      assert.equal(json.data.user.name, 'Arun Swiggy Rider');
      assert.equal(json.data.user.phone, '9123456780');
      assert.equal(json.data.user.email, 'arun.swiggy@example.com');
      assert.equal(json.data.user.role, UserRole.RIDER);
      assert.equal(json.data.user.isVerified, false);

      // Security verify: No password or hash in response
      assert.equal(json.data.user.password, undefined);
      assert.equal(json.data.user.passwordHash, undefined);
    });

    await sub.test('Successfully registers a merchant with merchantProfile', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Gupta Tea Merchant',
          phone: '9123456781',
          password: 'TeaMerchant456',
          role: UserRole.MERCHANT,
          merchantProfile: {
            businessName: 'Gupta Chai Point',
            businessType: 'tea_stall',
            address: '12th Main, Koramangala 4th Block',
          },
        }),
      });

      assert.equal(res.status, 201);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.user.role, UserRole.MERCHANT);
      assert.equal(json.data.user.merchantProfile.businessName, 'Gupta Chai Point');

      // Verify unified shop creation: the merchant's rest stop was created automatically!
      const restStopsRes = await fetch(`${baseUrl}/api/v1/merchant/rest-stops`, {
        headers: { Authorization: `Bearer ${json.data.token}` },
      });
      assert.equal(restStopsRes.status, 200);
      const restStopsJson = await restStopsRes.json();
      assert.equal(restStopsJson.success, true);
      assert.equal(restStopsJson.data.items.length, 1);
      assert.equal(restStopsJson.data.items[0].name, 'Gupta Chai Point');
    });

    await sub.test('Rejects duplicate phone registration with HTTP 409 Conflict', async () => {
      const duplicateRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Duplicate Arun Attempt',
          phone: '9123456780', // Same phone as above
          password: 'AnotherPassword123',
          role: UserRole.RIDER,
        }),
      });

      assert.equal(duplicateRes.status, 409);
      const json = await duplicateRes.json();
      assert.equal(json.success, false);
      assert.ok(json.error.includes('Conflict'));
      assert.ok(json.message.includes('already exists'));
    });

    await sub.test('Rejects duplicate email registration with HTTP 409 Conflict', async () => {
      const duplicateEmailRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Different Phone Same Email',
          phone: '9123456782',
          email: 'arun.swiggy@example.com', // Same email as above
          password: 'Password999!',
          role: UserRole.RIDER,
        }),
      });

      assert.equal(duplicateEmailRes.status, 409);
      const json = await duplicateEmailRes.json();
      assert.equal(json.success, false);
      assert.ok(json.error.includes('Conflict'));
    });


    await sub.test('Rejects registration with role: admin with HTTP 400', async () => {
      const adminRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Hacker Admin',
          phone: '9123456783',
          password: 'SecretAdminPassword123',
          role: 'admin',
        }),
      });

      assert.equal(adminRes.status, 400);
      const json = await adminRes.json();
      assert.equal(json.success, false);
    });

    await sub.test('Prevents client from injecting passwordHash or isVerified', async () => {
      const injectRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Privilege Escalation Attempt',
          phone: '9123456784',
          password: 'ValidPassword123',
          role: UserRole.RIDER,
          isVerified: true, // Should be ignored / server-controlled
          passwordHash: 'injected_fake_hash',
        }),
      });

      assert.equal(injectRes.status, 201);
      const json = await injectRes.json();
      assert.equal(json.data.user.isVerified, false);
      assert.equal(json.data.user.passwordHash, undefined);
    });
  });

  // ==========================================
  // 5. API Login Endpoint (/api/v1/auth/login)
  // ==========================================
  await t.test('5. POST /api/v1/auth/login', async (sub) => {
    await sub.test('Successfully logs in with valid phone and password', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: '9123456780',
          password: 'RiderSecret123',
        }),
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(typeof json.data.token === 'string');
      assert.equal(json.data.user.name, 'Arun Swiggy Rider');
      assert.equal(json.data.user.phone, '9123456780');
      assert.equal(json.data.user.passwordHash, undefined);
    });

    await sub.test('Rejects login with incorrect password with HTTP 401', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: '9123456780',
          password: 'WrongPassword!',
        }),
      });

      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.ok(json.error.includes('Unauthorized'));
      assert.ok(json.message.includes('Invalid phone number or password'));
    });

    await sub.test('Rejects login with unknown phone number with identical generic HTTP 401 message', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: '9999999999',
          password: 'AnyPassword123',
        }),
      });

      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.ok(json.error.includes('Unauthorized'));
      // Generic message prevents phone enumeration
      assert.ok(json.message.includes('Invalid phone number or password'));
    });

  });

  // ==========================================
  // 6. Current User Endpoint (/api/v1/auth/me) & Auth Middleware
  // ==========================================
  await t.test('6. GET /api/v1/auth/me and Auth Middleware', async (sub) => {
    let validToken: string;

    // Login first to get token
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '9123456780',
        password: 'RiderSecret123',
      }),
    });
    const loginData = await loginRes.json();
    validToken = loginData.data.token;

    await sub.test('Returns authenticated user profile with valid Bearer token', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.user.phone, '9123456780');
      assert.equal(json.data.user.role, UserRole.RIDER);
      assert.equal(json.data.user.passwordHash, undefined);
    });

    await sub.test('Rejects request with missing Authorization header (HTTP 401)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/me`);
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.ok(json.message.includes('token is required'));
    });

    await sub.test('Rejects request with malformed Authorization format (HTTP 401)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
        headers: {
          Authorization: `Token ${validToken}`, // Not Bearer
        },
      });
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.ok(json.message.includes('Bearer token expected'));
    });

    await sub.test('Rejects request with tampered/invalid token (HTTP 401)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
        headers: {
          Authorization: `Bearer ${validToken}tampered`,
        },
      });
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.ok(json.message.includes('Invalid authentication token'));
    });

    await sub.test('Rejects request for nonexistent or deleted user (HTTP 401)', async () => {
      const ghostToken = signAccessToken({
        userId: 'nonexistent-user',
        role: UserRole.RIDER,
      });

      const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
        headers: {
          Authorization: `Bearer ${ghostToken}`,
        },
      });

      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.ok(json.message.includes('deactivated') || json.message.includes('not found'));
    });
  });

  // ==========================================
  // 7. Role-Based Access Control (RBAC) Tests
  // ==========================================
  await t.test('7. Role-Based Access Control (RBAC Middleware)', async (sub) => {
    const adminToken = signAccessToken({
      userId: 'test-admin-id',
      role: UserRole.ADMIN,
    });

    const riderToken = signAccessToken({
      userId: 'test-rider-id',
      role: UserRole.RIDER,
    });

    const merchantToken = signAccessToken({
      userId: 'test-merchant-id',
      role: UserRole.MERCHANT,
    });

    await sub.test('Unauthenticated user cannot access role-protected route (HTTP 401)', async () => {
      const res = await fetch(`${baseUrl}/test-admin-only`);
      assert.equal(res.status, 401);
    });

    await sub.test('Authenticated rider is rejected from admin-only endpoint with HTTP 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/test-admin-only`, {
        headers: {
          Authorization: `Bearer ${riderToken}`,
        },
      });
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.ok(json.error.includes('Forbidden'));
      assert.ok(json.message.includes('insufficient permissions') || json.message.includes('forbidden'));

    });

    await sub.test('Authenticated merchant is rejected from admin-only endpoint with HTTP 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/test-admin-only`, {
        headers: {
          Authorization: `Bearer ${merchantToken}`,
        },
      });
      assert.equal(res.status, 403);
    });

    await sub.test('Authorized admin can access admin-only endpoint with HTTP 200', async () => {
      const res = await fetch(`${baseUrl}/test-admin-only`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.secretAdminData, 'accessible_only_by_admin');
    });

    await sub.test('Both rider and merchant can access multi-role endpoint', async () => {
      const resRider = await fetch(`${baseUrl}/test-rider-or-merchant`, {
        headers: { Authorization: `Bearer ${riderToken}` },
      });
      assert.equal(resRider.status, 200);

      const resMerchant = await fetch(`${baseUrl}/test-rider-or-merchant`, {
        headers: { Authorization: `Bearer ${merchantToken}` },
      });
      assert.equal(resMerchant.status, 200);
    });
  });
});
