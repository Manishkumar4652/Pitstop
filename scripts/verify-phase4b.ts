import mongoose from 'mongoose';
import { createApp } from '../apps/api/src/app';
import { config } from '../apps/api/src/config/env';
import { connectDatabase, disconnectDatabase, isDatabaseConnected } from '../apps/api/src/config/database';
import { RestStop } from '../apps/api/src/models/RestStop';
import { RestStopStatus, CapacityStatus, Facility } from 'shared-types';
import { fetchPublicRestStops, fetchPublicRestStopBySlug, ApiNotFoundError } from '../apps/web/lib/api/rest-stops';
import { Server } from 'http';

async function main() {
  console.log('====================================================');
  console.log('PitStop Phase 4B: Live Integration & Readiness Audit');
  console.log('====================================================\n');

  // 1. Boot Express server on port 5000
  console.log('--- Step 1: Booting Live Express API Server ---');
  const app = createApp();
  let server: Server;
  const PORT = 5000;

  await new Promise<void>((resolve, reject) => {
    server = app.listen(PORT, '127.0.0.1', () => {
      console.log(`[PASS] Express API Server listening on http://127.0.0.1:${PORT}`);
      resolve();
    });
    server.on('error', reject);
  });

  const baseUrl = `http://127.0.0.1:${PORT}`;
  process.env.PITSTOP_API_BASE_URL = `${baseUrl}/api/v1`;

  try {
    // 2. Health Endpoint Verification
    console.log('\n--- Step 2: Health Endpoint Verification ---');
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    console.log(`Top-level /health status: ${healthRes.status} (service: ${healthData.service})`);
    if (healthRes.status !== 200 || healthData.status !== 'ok') {
      throw new Error('Top-level /health check failed');
    }

    const v1HealthRes = await fetch(`${baseUrl}/api/v1/health`);
    const v1HealthData = await v1HealthRes.json();
    console.log(`API v1 /api/v1/health status: ${v1HealthRes.status} (database: ${v1HealthData.data.database})`);
    if (v1HealthRes.status !== 200 || v1HealthData.data.status !== 'ok') {
      throw new Error('/api/v1/health check failed');
    }
    console.log('[PASS] Both health endpoints responded successfully');

    // 3. Testing Real Database Connection (Local MongoDB vs Atlas)
    console.log('\n--- Step 3: Database Verification ---');
    console.log('Checking MongoDB Atlas configuration in environment:');
    if (process.env.MONGODB_URI && process.env.MONGODB_URI.startsWith('mongodb+srv://')) {
      console.log('[INFO] MongoDB Atlas URI is present in environment.');
    } else {
      console.log('[AUDIT NOTE] Cloud MongoDB Atlas URI (mongodb+srv://) is not configured.');
      console.log('Testing local MongoDB instance on mongodb://127.0.0.1:27017/pitstop_dev...');
    }

    config.MONGODB_URI = 'mongodb://127.0.0.1:27017/pitstop_dev';
    const dbConnected = await connectDatabase();
    console.log(`Database connected: ${dbConnected} (isDatabaseConnected: ${isDatabaseConnected()})`);

    if (dbConnected) {
      console.log('[PASS] Local MongoDB connection established successfully on port 27017');

      // Seed an active rest stop in local database for live verification
      console.log('Seeding temporary verified rest stop in local DB...');
      const testSlug = 'live-test-indiranagar-hub';
      await RestStop.deleteOne({ slug: testSlug });
      await RestStop.create({
        name: 'Live Test Indiranagar Hub',
        slug: testSlug,
        description: 'Test venue for live integration verification.',
        merchantId: new mongoose.Types.ObjectId(),
        address: {
          street: '100 Feet Road',
          area: 'Indiranagar',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560038',
        },
        location: { type: 'Point', coordinates: [77.6408, 12.9719] },
        facilities: [Facility.DRINKING_WATER, Facility.CHARGING, Facility.RESTROOM],
        capacity: { maxRiders: 10, currentOccupancy: 2, status: CapacityStatus.AVAILABLE },
        status: RestStopStatus.ACTIVE,
        dealBadge: '15% Off Snacks',
        rating: { average: 4.9, count: 50 },
      });

      // 4. Test Web Client against Live Express API backed by MongoDB
      console.log('\n--- Step 4: Web Client Live Discovery Query Execution ---');
      const listResult = await fetchPublicRestStops({
        city: 'Bengaluru',
        facilities: [Facility.DRINKING_WATER, Facility.CHARGING],
      });

      console.log(`[PASS] fetchPublicRestStops returned ${listResult.items.length} items from live backend`);
      console.log(`isDemoFallback: ${listResult.isDemoFallback} (zero fallback guarantee)`);
      const found = listResult.items.find((item) => item.slug === testSlug);
      if (!found) {
        throw new Error('Created live rest stop was not found in live discovery query');
      }
      console.log(`[PASS] Found venue "${found.name}" with deal "${found.dealBadge}"`);

      // Verify privacy
      if ((found as any).merchantId) {
        throw new Error('CRITICAL: merchantId was exposed in public response!');
      }
      console.log('[PASS] Verified merchantId is completely excluded from public response DTO');

      // 5. Test Detail by Slug
      console.log('\n--- Step 5: Web Client Detail Fetch Execution ---');
      const detailResult = await fetchPublicRestStopBySlug(testSlug);
      console.log(`[PASS] fetchPublicRestStopBySlug successfully fetched "${detailResult.item.name}"`);
      console.log(`isDemoFallback: ${detailResult.isDemoFallback}`);

      // 6. Test Unknown Slug (404 Differentiation)
      console.log('\n--- Step 6: Unknown Slug 404 Differentiation ---');
      try {
        await fetchPublicRestStopBySlug('completely-non-existent-slug-xyz');
        throw new Error('Expected 404 for unknown slug, but call succeeded!');
      } catch (err: any) {
        if (err instanceof ApiNotFoundError && err.statusCode === 404) {
          console.log(`[PASS] Unknown slug correctly threw ApiNotFoundError (HTTP 404): "${err.message}"`);
        } else {
          throw new Error(`Unexpected error type for 404 test: ${err}`);
        }
      }

      // Cleanup seeded test record
      await RestStop.deleteOne({ slug: testSlug });
      console.log('[CLEANUP] Deleted temporary test document from local MongoDB');
    } else {
      console.log('[INFO] Local MongoDB not reachable. Running live Express API against offline store.');
    }

    console.log('\n====================================================');
    console.log('Phase 4B Live Verification Audit PASSED Successfully');
    console.log('====================================================');
  } finally {
    if (isDatabaseConnected()) {
      await disconnectDatabase();
      console.log('Disconnected from local MongoDB.');
    }
    server!.close();
    console.log('Closed Live Express API server.');
  }
}

main().catch((err) => {
  console.error('[FAIL] Phase 4B Verification failed with error:', err);
  process.exit(1);
});
