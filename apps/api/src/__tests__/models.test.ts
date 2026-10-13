import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { User, RestStop, Deal, Job, CheckIn, JobApplication } from '../models';
import { UserRole, Facility, RestStopStatus, CapacityStatus, JobCategory, JobStatus, CheckinStatus, JobApplicationStatus } from 'shared-types';
import { isDatabaseConnected, connectDatabase, disconnectDatabase, maskMongoUri } from '../config/database';
import { config } from '../config/env';

/**
 * Helper to validate a Mongoose document asynchronously using modern doc.validate().
 * Returns the ValidationError if validation failed, or undefined if valid.
 */
async function validateDocument(doc: mongoose.Document): Promise<mongoose.Error.ValidationError | undefined> {
  try {
    await doc.validate();
    return undefined;
  } catch (err) {
    return err as mongoose.Error.ValidationError;
  }
}

test('Mongoose Models and Database Foundation Test Suite', async (t) => {
  await t.test('1. All Mongoose models can be imported and initialized without errors', () => {
    assert.ok(User);
    assert.ok(RestStop);
    assert.ok(Deal);
    assert.ok(Job);
    assert.ok(CheckIn);
    assert.ok(JobApplication);
    assert.equal(User.modelName, 'User');
    assert.equal(RestStop.modelName, 'RestStop');
    assert.equal(Deal.modelName, 'Deal');
    assert.equal(Job.modelName, 'Job');
    assert.equal(CheckIn.modelName, 'CheckIn');
    assert.equal(JobApplication.modelName, 'JobApplication');
  });

  await t.test('2. Valid User document passes schema validation', async () => {
    const validUser = new User({
      name: 'Ramesh Kumar',
      phone: '9876543210',
      email: 'ramesh.kumar@example.com',
      role: UserRole.RIDER,
      isVerified: true,
      riderProfile: {
        platform: 'zomato',
        vehicleType: '2-wheeler-ev',
        vehicleNumber: 'KA-01-AB-1234',
      },
    });

    const validationError = await validateDocument(validUser);
    assert.equal(validationError, undefined);
  });

  await t.test('3. User model enforces required fields and phone regex', async () => {
    // Missing required name and phone
    const emptyUser = new User({});
    const error = await validateDocument(emptyUser);
    assert.ok(error);
    assert.ok(error.errors['name'], 'Name should be required');
    assert.ok(error.errors['phone'], 'Phone should be required');

    // Invalid phone number (must be 10 digits starting with 6-9)
    const invalidPhoneUser = new User({
      name: 'Test Rider',
      phone: '12345', // Invalid
    });
    const phoneError = await validateDocument(invalidPhoneUser);
    assert.ok(phoneError);
    assert.ok(phoneError.errors['phone'], 'Invalid phone should be rejected');
  });

  await t.test('4. User model rejects invalid enum values', async () => {
    const invalidRoleUser = new User({
      name: 'Test Admin',
      phone: '9988776655',
      role: 'super_admin' as any,
    });

    const error = await validateDocument(invalidRoleUser);
    assert.ok(error);
    assert.ok(error.errors['role']);
  });

  await t.test('5. User model normalizes email and defines sparse unique index', () => {
    const userWithMixedCaseEmail = new User({
      name: 'Ananya Sharma',
      phone: '9123456780',
      email: ' Ananya.Sharma@Domain.COM ',
    });

    assert.equal(userWithMixedCaseEmail.email, 'ananya.sharma@domain.com');

    // Check that indexes are defined on phone and email
    const indexes = User.schema.indexes();
    const phoneIndex = indexes.find((idx) => (idx[0] as any).phone === 1);
    const emailIndex = indexes.find((idx) => (idx[0] as any).email === 1);

    assert.ok(phoneIndex, 'Phone index should be defined');
    assert.equal((phoneIndex[1] as any)?.unique, true, 'Phone index should be unique');
    assert.ok(emailIndex, 'Email index should be defined');
    assert.equal((emailIndex[1] as any)?.sparse, true, 'Email index should be sparse');
  });

  await t.test('6. User passwordHash is excluded from toJSON serialization', () => {
    const user = new User({
      name: 'Merchant Owner',
      phone: '9845012345',
      role: UserRole.MERCHANT,
      passwordHash: '$2b$10$hashedPasswordHere1234567890',
    });

    const json = user.toJSON();
    assert.equal(json.passwordHash, undefined, 'passwordHash must not appear in toJSON');
    assert.equal(json.name, 'Merchant Owner');
  });

  await t.test('7. Valid RestStop document passes validation and includes 2dsphere index', async () => {
    const merchantId = new mongoose.Types.ObjectId();
    const validStop = new RestStop({
      merchantId,
      name: 'Chai Point Indiranagar Rest Stop',
      slug: 'chai-point-indiranagar',
      description: 'Clean RO drinking water, seating, and fast charging docks for delivery riders.',
      address: {
        street: '100 Feet Road',
        area: 'Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
      },
      location: {
        type: 'Point',
        coordinates: [77.6408, 12.9719], // [Longitude, Latitude]
      },
      facilities: [Facility.DRINKING_WATER, Facility.SEATING, Facility.CHARGING],
      capacity: {
        maxRiders: 10,
        currentOccupancy: 2,
        status: CapacityStatus.AVAILABLE,
      },
      operatingHours: [
        { day: 'mon', openTime: '08:00', closeTime: '22:00', isOpen: true },
      ],
      status: RestStopStatus.ACTIVE,
    });

    const error = await validateDocument(validStop);
    assert.equal(error, undefined);

    // Verify 2dsphere index definition
    const indexes = RestStop.schema.indexes();
    const geoIndex = indexes.find((idx) => (idx[0] as any).location === '2dsphere');
    assert.ok(geoIndex, '2dsphere index must be defined on location field');
  });

  await t.test('8. RestStop rejects invalid coordinates or empty facilities', async () => {
    const badStop = new RestStop({
      merchantId: new mongoose.Types.ObjectId(),
      name: 'Invalid Geo Stop',
      slug: 'invalid-geo-stop',
      description: 'Testing validation error handling',
      address: {
        street: 'Main Road',
        area: 'Koramangala',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560034',
      },
      location: {
        type: 'Point',
        coordinates: [200, 100], // Invalid: Lon > 180, Lat > 90
      },
      facilities: [], // Empty facilities array
      capacity: { maxRiders: 5 },
    });

    const error = await validateDocument(badStop);
    assert.ok(error);
    assert.ok(error.errors['location.coordinates']);
    assert.ok(error.errors['facilities']);
  });

  await t.test('9. Valid Deal and Job models pass validation with references', async () => {
    const merchantId = new mongoose.Types.ObjectId();
    const restStopId = new mongoose.Types.ObjectId();

    // Deal
    const deal = new Deal({
      restStopId,
      merchantId,
      title: '50% Off Tea & Snack Combo',
      description: 'Exclusive off-peak discount for registered gig delivery partners.',
      discountType: 'percentage',
      discountPercentage: 50,
      validHours: '14:00 - 17:00',
      isActive: true,
    });
    const dealError = await validateDocument(deal);
    assert.equal(dealError, undefined);

    // Job
    const job = new Job({
      merchantId,
      restStopId,
      title: 'Afternoon Parcel Sorting Assistant',
      description: 'Assist kitchen desk in arranging delivery parcel bags by cluster.',
      category: JobCategory.PARCEL_SORTING,
      payAmount: 250,
      payType: 'fixed',
      durationMinutes: 90,
      startTime: new Date('2026-10-12T14:30:00Z'),
      endTime: new Date('2026-10-12T16:00:00Z'),
      requiredRiders: 2,
      status: JobStatus.OPEN,
      instructions: 'Report to store counter with delivery partner ID badge.',
    });
    const jobError = await validateDocument(job);
    assert.equal(jobError, undefined);
  });

  await t.test('10. Valid CheckIn document passes validation and rejects invalid status enum', async () => {
    const checkIn = new CheckIn({
      riderId: new mongoose.Types.ObjectId(),
      restStopId: new mongoose.Types.ObjectId(),
      merchantId: new mongoose.Types.ObjectId(),
      method: 'qr_code',
      verificationCode: 'PS-8921',
      status: CheckinStatus.VERIFIED,
      checkInTime: new Date(),
    });

    const checkInError = await validateDocument(checkIn);
    assert.equal(checkInError, undefined);

    // Invalid status enum
    const badCheckIn = new CheckIn({
      riderId: new mongoose.Types.ObjectId(),
      restStopId: new mongoose.Types.ObjectId(),
      merchantId: new mongoose.Types.ObjectId(),
      method: 'qr_code',
      status: 'fraudulent' as any,
    });
    const error = await validateDocument(badCheckIn);
    assert.ok(error);
    assert.ok(error.errors['status']);
  });

  await t.test('11. Valid JobApplication document passes schema validation and defines required fields', async () => {
    const validApp = new JobApplication({
      jobId: new mongoose.Types.ObjectId(),
      riderId: new mongoose.Types.ObjectId(),
      merchantId: new mongoose.Types.ObjectId(),
      status: JobApplicationStatus.PENDING,
      notes: 'Available for immediate afternoon shift.',
    });

    const error = await validateDocument(validApp);
    assert.equal(error, undefined);
  });

  await t.test('12. JobApplication model enforces required fields and rejects invalid status enum', async () => {
    // Missing required fields
    const emptyApp = new JobApplication({});
    const error = await validateDocument(emptyApp);
    assert.ok(error);
    assert.ok(error.errors['jobId'], 'Job ID should be required');
    assert.ok(error.errors['riderId'], 'Rider ID should be required');
    assert.ok(error.errors['merchantId'], 'Merchant ID should be required');

    // Invalid status enum
    const badStatusApp = new JobApplication({
      jobId: new mongoose.Types.ObjectId(),
      riderId: new mongoose.Types.ObjectId(),
      merchantId: new mongoose.Types.ObjectId(),
      status: 'hired_forever' as any,
    });
    const statusError = await validateDocument(badStatusApp);
    assert.ok(statusError);
    assert.ok(statusError.errors['status'], 'Invalid status enum should be rejected');
  });

  await t.test('13. JobApplication defines unique compound index on (jobId, riderId) and common lookup indexes', () => {
    const indexes = JobApplication.schema.indexes();

    // Unique compound index on (jobId, riderId)
    const compoundUniqueIndex = indexes.find(
      (idx) => (idx[0] as any).jobId === 1 && (idx[0] as any).riderId === 1
    );
    assert.ok(compoundUniqueIndex, 'Unique compound index on (jobId, riderId) should be defined');
    assert.equal((compoundUniqueIndex[1] as any)?.unique, true, 'Compound index must be unique');

    // Common lookup indexes
    const merchantStatusIndex = indexes.find(
      (idx) => (idx[0] as any).merchantId === 1 && (idx[0] as any).status === 1
    );
    assert.ok(merchantStatusIndex, 'Index on (merchantId, status) should be defined');

    const riderStatusIndex = indexes.find(
      (idx) => (idx[0] as any).riderId === 1 && (idx[0] as any).status === 1
    );
    assert.ok(riderStatusIndex, 'Index on (riderId, status) should be defined');

    const jobStatusIndex = indexes.find(
      (idx) => (idx[0] as any).jobId === 1 && (idx[0] as any).status === 1
    );
    assert.ok(jobStatusIndex, 'Index on (jobId, status) should be defined');
  });

  await t.test('14. Database connection is not established by importing app or models', () => {
    assert.equal(
      isDatabaseConnected(),
      false,
      'Database must remain disconnected until connectDatabase() is explicitly invoked'
    );
  });

  await t.test('12. Database connection handles missing MONGODB_URI gracefully', async () => {
    // When no MONGODB_URI is provided in environment, connectDatabase() returns false without throwing
    const originalUri = config.MONGODB_URI;
    try {
      (config as any).MONGODB_URI = undefined;
      const result = await connectDatabase();
      assert.equal(result, false);
      assert.equal(isDatabaseConnected(), false);
    } finally {
      (config as any).MONGODB_URI = originalUri;
    }
  });

  await t.test('13. Disconnect function runs safely without throwing when disconnected', async () => {
    await assert.doesNotReject(async () => {
      await disconnectDatabase();
    });
  });

  await t.test('14. maskMongoUri hides passwords and secrets from connection string logs', () => {
    const srvUri = 'mongodb+srv://admin_user:superSecretPassword123@cluster0.pitstop.mongodb.net/pitstop_dev?retryWrites=true';
    const masked = maskMongoUri(srvUri);
    assert.ok(!masked.includes('superSecretPassword123'), 'Raw password must not be visible in masked URI');
    assert.ok(masked.includes('***:***@cluster0.pitstop.mongodb.net'));
  });
});
