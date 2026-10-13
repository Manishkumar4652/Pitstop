import test from 'node:test';
import assert from 'node:assert/strict';
import { Server } from 'http';
import mongoose from 'mongoose';
import {
  UserRole,
  MerchantVerificationStatus,
  RestStopStatus,
  JobStatus,
  Facility,
  CapacityStatus,
} from 'shared-types';
import { createApp } from '../app';
import { config } from '../config/env';
import { signAccessToken } from '../utils/jwt';
import { mockUserStore } from '../controllers/auth.controller';
import {
  mockRestStopStore,
  clearMockRestStopStore,
  MockRestStopItem,
} from '../controllers/restStopMockStore';
import {
  mockDealStore,
  clearMockDealStore,
  MockDealItem,
} from '../controllers/dealMockStore';
import {
  mockJobStore,
  clearMockJobStore,
  MockJobItem,
} from '../controllers/jobMockStore';
import {
  mockAuditLogStore,
  clearMockAuditLogStore,
} from '../controllers/auditLogMockStore';
import { User } from '../models/User';
import { RestStop } from '../models/RestStop';
import { AuditLog } from '../models/AuditLog';

const TEST_JWT_SECRET = 'a_very_secure_test_jwt_secret_that_has_at_least_32_characters_for_testing';

function setupAdminTestServer() {
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

test('Admin Dashboard & System Moderation API Test Suite (Phase 9)', async (t) => {
  const { server, baseUrl } = await setupAdminTestServer();

  const adminId = 'admin-usr-999';
  const riderId = 'rider-usr-111';
  const merchant1Id = 'merchant-usr-201';
  const merchant2Id = 'merchant-usr-202';

  const adminToken = signAccessToken({ userId: adminId, role: UserRole.ADMIN });
  const riderToken = signAccessToken({ userId: riderId, role: UserRole.RIDER });
  const merchantToken = signAccessToken({ userId: merchant1Id, role: UserRole.MERCHANT });

  t.beforeEach(() => {
    mockUserStore.clear();
    clearMockRestStopStore();
    clearMockDealStore();
    clearMockJobStore();
    clearMockAuditLogStore();

    // Seed mock users
    mockUserStore.set(adminId, {
      _id: adminId,
      id: adminId,
      name: 'Super Admin',
      phone: '+919999999999',
      role: UserRole.ADMIN,
      isVerified: true,
      createdAt: new Date(),
    });

    mockUserStore.set(riderId, {
      _id: riderId,
      id: riderId,
      name: 'Ramesh Rider',
      phone: '+919888888888',
      role: UserRole.RIDER,
      isVerified: true,
      createdAt: new Date(),
    });

    mockUserStore.set(merchant1Id, {
      _id: merchant1Id,
      id: merchant1Id,
      name: 'Chai Point Owner',
      phone: '+919777777777',
      email: 'owner@chaipoint.com',
      passwordHash: 'secret_hash_never_leak',
      role: UserRole.MERCHANT,
      isVerified: false,
      merchantProfile: {
        businessName: 'Chai Point Indiranagar',
        businessType: 'cafe',
        gstin: '29ABCDE1234F1Z5',
        verificationStatus: MerchantVerificationStatus.PENDING_REVIEW,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockUserStore.set(merchant2Id, {
      _id: merchant2Id,
      id: merchant2Id,
      name: 'Dosa Camp Owner',
      phone: '+919666666666',
      email: 'owner@dosacamp.com',
      passwordHash: 'secret_hash_never_leak_2',
      role: UserRole.MERCHANT,
      isVerified: true,
      merchantProfile: {
        businessName: 'Dosa Camp Koramangala',
        businessType: 'restaurant',
        verificationStatus: MerchantVerificationStatus.VERIFIED,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  t.after(() => {
    server.close();
    mockUserStore.clear();
    clearMockRestStopStore();
    clearMockDealStore();
    clearMockJobStore();
    clearMockAuditLogStore();
  });

  // ========================================================
  // 1. Authentication & Role-Based Access Control
  // ========================================================
  await t.test('1. Authentication & Role-Based Access Control', async (t2) => {
    await t2.test('Rejects unauthenticated requests to /api/v1/admin/stats with HTTP 401', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/stats`);
      assert.equal(res.status, 401);
    });

    await t2.test('Rejects unauthenticated requests to /api/v1/admin/merchants with HTTP 401', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/merchants`);
      assert.equal(res.status, 401);
    });

    await t2.test('Rejects unauthenticated requests to /api/v1/admin/audit-logs with HTTP 401', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/audit-logs`);
      assert.equal(res.status, 401);
    });

    await t2.test('Rejects rider access to admin endpoints with HTTP 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/stats`, {
        headers: { Authorization: `Bearer ${riderToken}` },
      });
      assert.equal(res.status, 403);
    });

    await t2.test('Rejects merchant access to admin endpoints with HTTP 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/merchants`, {
        headers: { Authorization: `Bearer ${merchantToken}` },
      });
      assert.equal(res.status, 403);
    });

    await t2.test('Permits valid admin to access /api/v1/admin/stats with HTTP 200', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/stats`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(json.data.users);
      assert.ok(json.data.restStops);
      assert.ok(json.data.deals);
      assert.ok(json.data.jobs);
    });
  });

  // ========================================================
  // 2. Admin Operational Stats Aggregation
  // ========================================================
  await t.test('2. Admin Operational Stats Aggregation', async (t2) => {
    await t2.test('Returns accurate counts and distinguishes zero counts from unavailable', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/stats`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      const { users, restStops, deals, jobs } = body.data;

      assert.equal(users.total, 4); // 1 admin, 1 rider, 2 merchants
      assert.equal(users.admins, 1);
      assert.equal(users.riders, 1);
      assert.equal(users.merchants, 2);
      assert.equal(users.pendingMerchants, 1); // merchant1 is pending_review
      assert.equal(restStops.total, 0);
      assert.equal(deals.total, 0);
      assert.equal(jobs.total, 0);
    });
  });

  // ========================================================
  // 3. Merchant Listing & Search Moderation
  // ========================================================
  await t.test('3. Merchant Listing & Search Moderation', async (t2) => {
    await t2.test('Lists merchants with pagination metadata and safe formatting without leaks', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/merchants`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.pagination.total, 2);
      assert.equal(json.data.items.length, 2);

      // Verify no password hash or secrets leaked
      for (const merchant of json.data.items) {
        assert.equal(merchant.passwordHash, undefined);
        assert.equal(merchant.password, undefined);
        assert.ok(merchant.merchantProfile);
      }
    });

    await t2.test('Filters merchants by verification status (pending_review)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/merchants?status=pending_review`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.data.items.length, 1);
      assert.equal(json.data.items[0].id, merchant1Id);
    });

    await t2.test('Searches merchants by business name keyword', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/merchants?search=dosa`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.data.items.length, 1);
      assert.equal(json.data.items[0].id, merchant2Id);
    });

    await t2.test('Fetches single merchant details by ID', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/merchants/${merchant1Id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.id, merchant1Id);
      assert.equal(json.data.merchantProfile.businessName, 'Chai Point Indiranagar');
      assert.equal(json.data.passwordHash, undefined);
    });
  });

  // ========================================================
  // 4. Merchant Status Transitions & Verification
  // ========================================================
  await t.test('4. Merchant Status Transitions & Verification', async (t2) => {
    await t2.test('Admin approves merchant: transitions to verified and updates isVerified to true', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/merchants/${merchant1Id}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'verified',
          reason: 'Verified GSTIN and trade license successfully.',
        }),
      });
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.data.isVerified, true);
      assert.equal(json.data.merchantProfile.verificationStatus, 'verified');
      assert.equal(json.data.merchantProfile.verificationReason, 'Verified GSTIN and trade license successfully.');

      // Check audit log was recorded
      assert.equal(mockAuditLogStore.size, 1);
      const audit = Array.from(mockAuditLogStore.values())[0];
      assert.equal(audit.action, 'merchant_verification');
      assert.equal(audit.targetType, 'merchant');
      assert.equal(audit.targetId, merchant1Id);
      assert.equal(audit.prevStatus, 'pending_review');
      assert.equal(audit.newStatus, 'verified');
    });

    await t2.test('Admin rejects merchant: transitions to rejected and updates isVerified to false', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/merchants/${merchant2Id}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'rejected',
          reason: 'Invalid establishment documentation.',
        }),
      });
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.data.isVerified, false);
      assert.equal(json.data.merchantProfile.verificationStatus, 'rejected');
    });

    await t2.test('Rejects invalid status value with HTTP 400', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/merchants/${merchant1Id}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'invalid_status_value',
        }),
      });
      assert.equal(res.status, 400);
    });
  });

  // ========================================================
  // 5. Rest-Stop, Job & Deal Moderation Audit Logging
  // ========================================================
  await t.test('5. Moderation Actions Create Audit Logs', async (t2) => {
    await t2.test('Admin approves rest stop and audit log is recorded', async () => {
      // Seed mock rest stop inside test
      const restStopId = 'rs-mod-001';
      const rsItem: MockRestStopItem = {
        _id: restStopId,
        id: restStopId,
        merchantId: merchant1Id,
        name: 'Sample Cafe Rest Stop',
        slug: 'sample-cafe-rest-stop',
        description: 'Clean drinking water and seating.',
        address: {
          street: 'MG Road',
          area: 'Central',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
        },
        location: { type: 'Point', coordinates: [77.5946, 12.9716] },
        facilities: [Facility.DRINKING_WATER, Facility.CHARGING, Facility.SEATING],
        images: [],
        capacity: { maxRiders: 10, currentOccupancy: 0, status: CapacityStatus.AVAILABLE },
        status: RestStopStatus.PENDING_APPROVAL,
        rating: { average: 0, count: 0 },
        operatingHours: [],
        qrRotationVersion: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockRestStopStore.set(restStopId, rsItem);

      const res = await fetch(`${baseUrl}/api/v1/admin/rest-stops/${restStopId}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'active',
          reason: 'Inspected facility on site.',
        }),
      });
      assert.equal(res.status, 200);

      // Verify audit log
      assert.equal(mockAuditLogStore.size, 1);
      const audit = Array.from(mockAuditLogStore.values())[0];
      assert.equal(audit.action, 'rest_stop_moderation');
      assert.equal(audit.targetType, 'rest_stop');
      assert.equal(audit.targetId, restStopId);
      assert.equal(audit.prevStatus, RestStopStatus.PENDING_APPROVAL);
      assert.equal(audit.newStatus, 'active');
      assert.equal(audit.reason, 'Inspected facility on site.');
    });

    await t2.test('Admin queries audit logs via /api/v1/admin/audit-logs', async () => {
      // Seed audit log entry for this subtest
      mockAuditLogStore.set('audit-test-1', {
        _id: 'audit-test-1',
        id: 'audit-test-1',
        adminId,
        adminName: 'Super Admin',
        action: 'rest_stop_moderation',
        targetType: 'rest_stop',
        targetId: 'rs-mod-001',
        targetName: 'Sample Cafe Rest Stop',
        prevStatus: 'pending_approval',
        newStatus: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await fetch(`${baseUrl}/api/v1/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(json.data.items.length >= 1);
      assert.equal(json.data.items[0].targetType, 'rest_stop');
    });
  });

  // ========================================================
  // 6. Database Foundation & Model Validation
  // ========================================================
  await t.test('6. Database Foundation & Model Validation', async (t2) => {
    await t2.test('AuditLog model validates required fields and targetType enum', async () => {
      const validAudit = new AuditLog({
        adminId: new mongoose.Types.ObjectId(),
        adminName: 'Admin User',
        action: 'merchant_verification',
        targetType: 'merchant',
        targetId: 'm-1',
        targetName: 'Test Cafe',
        prevStatus: 'pending_review',
        newStatus: 'verified',
        reason: 'Documents checked',
      });
      const err = await validAudit.validate().catch((e: any) => e);
      assert.equal(err, undefined);

      const invalidAudit = new AuditLog({
        targetType: 'invalid_type' as any,
      });
      const invErr: any = await invalidAudit.validate().catch((e: any) => e);
      assert.ok(invErr);
      assert.ok(invErr.errors['adminId']);
      assert.ok(invErr.errors['action']);
      assert.ok(invErr.errors['targetType']);
    });

    await t2.test('User model persists verificationStatus and verificationReason on merchantProfile', async () => {
      const merchant = new User({
        name: 'Test Merchant',
        phone: '9876543210',
        email: 'test@merchant.com',
        role: UserRole.MERCHANT,
        isVerified: true,
        merchantProfile: {
          businessName: 'Test Stalls',
          businessType: 'restaurant',
          verificationStatus: MerchantVerificationStatus.VERIFIED,
          verificationReason: 'Approved by admin',
        },
      });
      const err = await merchant.validate().catch((e: any) => e);
      assert.equal(err, undefined);
      assert.equal(merchant.merchantProfile?.verificationStatus, 'verified');
    });
  });
});
