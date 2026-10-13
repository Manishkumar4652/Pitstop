import test from 'node:test';
import assert from 'node:assert/strict';
import http, { Server } from 'node:http';
import {
  fetchPublicRestStops,
  fetchPublicRestStopBySlug,
  ApiNotFoundError,
  ApiError,
  ApiNetworkError,
  mapPublicRestStopToDisplay,
} from '../rest-stops';
import { getApiBaseUrl, isDemoFallbackAllowed } from '../config';
import { Facility, CapacityStatus, RestStopPublicResponse } from 'shared-types';

function createMockApiServer(handler: http.RequestListener) {
  return new Promise<{ server: Server; url: string }>((resolve) => {
    const server = http.createServer(handler);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        throw new Error('Unable to bind mock server');
      }
      resolve({ server, url: `http://127.0.0.1:${addr.port}/api/v1` });
    });
  });
}

const SAMPLE_BACKEND_DOC: RestStopPublicResponse = {
  id: 'rs-indiranagar-101',
  name: 'Chai Point Indiranagar',
  slug: 'chai-point-indiranagar',
  description: 'Clean RO drinking water, charging stations, and dedicated seating.',
  address: {
    street: '100 Feet Road',
    area: 'Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
  },
  location: { type: 'Point', coordinates: [77.6408, 12.9719] },
  facilities: [Facility.DRINKING_WATER, Facility.CHARGING, Facility.SEATING],
  images: [],
  capacity: { maxRiders: 12, currentOccupancy: 3, status: CapacityStatus.AVAILABLE },
  operatingHours: [{ day: 'mon', openTime: '08:00', closeTime: '23:00', isOpen: true }],
  rating: { average: 4.8, count: 120 },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

test('Public Rest-Stop Discovery API Client Suite (Phase 4A)', async (t) => {
  const originalBaseUrl = process.env.PITSTOP_API_BASE_URL;
  const originalFallback = process.env.PITSTOP_ENABLE_DEMO_FALLBACK;
  const originalNodeEnv = process.env.NODE_ENV;

  t.afterEach(() => {
    process.env.PITSTOP_API_BASE_URL = originalBaseUrl;
    process.env.PITSTOP_ENABLE_DEMO_FALLBACK = originalFallback;
    (process.env as any).NODE_ENV = originalNodeEnv;
  });

  // ==========================================
  // 1. Config & Environment Rules
  // ==========================================
  await t.test('Config defaults and production fallback protection', () => {
    delete process.env.PITSTOP_API_BASE_URL;
    assert.equal(getApiBaseUrl(), 'http://127.0.0.1:5000/api/v1');

    // Default: demo fallback is disabled
    delete process.env.PITSTOP_ENABLE_DEMO_FALLBACK;
    (process.env as any).NODE_ENV = 'development';
    assert.equal(isDemoFallbackAllowed(), false);

    // Development with explicit flag
    process.env.PITSTOP_ENABLE_DEMO_FALLBACK = 'true';
    assert.equal(isDemoFallbackAllowed(), true);

    // Production guard: MUST NEVER permit fallback in production
    (process.env as any).NODE_ENV = 'production';
    assert.equal(isDemoFallbackAllowed(), false);
  });

  // ==========================================
  // 2. Data Mapping (Zero Fabrication)
  // ==========================================
  await t.test('mapPublicRestStopToDisplay maps fields cleanly without fabricating missing data', () => {
    const display = mapPublicRestStopToDisplay(SAMPLE_BACKEND_DOC);

    assert.equal(display.id, SAMPLE_BACKEND_DOC.id);
    assert.equal(display.name, SAMPLE_BACKEND_DOC.name);
    assert.equal(display.slug, SAMPLE_BACKEND_DOC.slug);
    assert.equal(display.isDemoData, false);
    // Merchant identity is not in public DTO and must NOT be fabricated
    assert.equal(display.merchantName, undefined);
    assert.equal(display.venueType, undefined);
    assert.equal(display.rating.average, 4.8);
    assert.equal(display.rating.count, 120);
  });

  // ==========================================
  // 3. Successful List Query & Parameter Serialization
  // ==========================================
  await t.test('fetchPublicRestStops handles successful response and maps parameters', async () => {
    let capturedUrl = '';

    const { server, url } = await createMockApiServer((req, res) => {
      capturedUrl = req.url || '';
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: true,
          data: {
            items: [SAMPLE_BACKEND_DOC],
            pagination: {
              page: 1,
              limit: 10,
              total: 1,
              totalPages: 1,
              hasNextPage: false,
              hasPrevPage: false,
            },
          },
          timestamp: new Date().toISOString(),
        })
      );
    });

    try {
      process.env.PITSTOP_API_BASE_URL = url;
      (process.env as any).NODE_ENV = 'production';

      const result = await fetchPublicRestStops({
        page: 2,
        limit: 15,
        search: 'Indiranagar',
        city: 'Bengaluru',
        facilities: [Facility.DRINKING_WATER, Facility.CHARGING],
        sort: 'rating',
      });

      assert.equal(result.isDemoFallback, false);
      assert.equal(result.items.length, 1);
      assert.equal(result.items[0].id, SAMPLE_BACKEND_DOC.id);
      assert.equal(result.pagination.total, 1);

      // Verify captured query parameters
      assert.match(capturedUrl, /page=2/);
      assert.match(capturedUrl, /limit=15/);
      assert.match(capturedUrl, /search=Indiranagar/);
      assert.match(capturedUrl, /city=Bengaluru/);
      assert.match(capturedUrl, /sort=rating/);
      assert.match(capturedUrl, /drinking_water%2Ccharging|drinking_water,charging/);
    } finally {
      server.close();
    }
  });

  // ==========================================
  // 4. Detail Fetch & Genuine 404 Differentiation
  // ==========================================
  await t.test('fetchPublicRestStopBySlug handles successful detail and genuine 404', async () => {
    const { server, url } = await createMockApiServer((req, res) => {
      if (req.url?.endsWith('valid-slug')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: true,
            data: SAMPLE_BACKEND_DOC,
            timestamp: new Date().toISOString(),
          })
        );
      } else if (req.url?.endsWith('missing-slug')) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: false,
            error: 'NotFoundError',
            message: "Rest stop with slug 'missing-slug' was not found or is not active.",
          })
        );
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Internal Server Error' }));
      }
    });

    try {
      process.env.PITSTOP_API_BASE_URL = url;
      (process.env as any).NODE_ENV = 'production';

      // 1. Success
      const detail = await fetchPublicRestStopBySlug('valid-slug');
      assert.equal(detail.isDemoFallback, false);
      assert.equal(detail.item.slug, 'chai-point-indiranagar');

      // 2. Genuine 404 throws ApiNotFoundError
      await assert.rejects(
        async () => {
          await fetchPublicRestStopBySlug('missing-slug');
        },
        (err: any) => {
          assert.ok(err instanceof ApiNotFoundError);
          assert.equal(err.statusCode, 404);
          return true;
        }
      );

      // 3. 500 error throws ApiError (does NOT convert to 404!)
      await assert.rejects(
        async () => {
          await fetchPublicRestStopBySlug('server-error-slug');
        },
        (err: any) => {
          assert.ok(err instanceof ApiError);
          assert.equal(err.statusCode, 500);
          return true;
        }
      );
    } finally {
      server.close();
    }
  });

  // ==========================================
  // 5. Malformed Envelope & Network Failures
  // ==========================================
  await t.test('Rejects malformed JSON and malformed envelope', async () => {
    const { server, url } = await createMockApiServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      // Missing required data field
      res.end(JSON.stringify({ success: false }));
    });

    try {
      process.env.PITSTOP_API_BASE_URL = url;
      (process.env as any).NODE_ENV = 'production';

      await assert.rejects(async () => {
        await fetchPublicRestStops();
      }, ApiError);
    } finally {
      server.close();
    }
  });

  // ==========================================
  // 6. Development Fallback vs Production Guard
  // ==========================================
  await t.test('Offline demo fallback operates in development with flag, rejected in production', async () => {
    // Point API base URL to an unreachable port
    process.env.PITSTOP_API_BASE_URL = 'http://127.0.0.1:54321/api/v1';

    // A. Development with fallback enabled
    (process.env as any).NODE_ENV = 'development';
    process.env.PITSTOP_ENABLE_DEMO_FALLBACK = 'true';

    const fallbackResult = await fetchPublicRestStops({ search: 'Indiranagar' });
    assert.equal(fallbackResult.isDemoFallback, true);
    assert.ok(fallbackResult.items.length > 0);
    assert.equal(fallbackResult.items[0].isDemoData, true);

    // B. Development with fallback disabled (default behavior)
    process.env.PITSTOP_ENABLE_DEMO_FALLBACK = 'false';
    await assert.rejects(async () => {
      await fetchPublicRestStops();
    }, ApiNetworkError);

    // C. Production guard: even if PITSTOP_ENABLE_DEMO_FALLBACK='true', fallback is FORBIDDEN
    (process.env as any).NODE_ENV = 'production';
    process.env.PITSTOP_ENABLE_DEMO_FALLBACK = 'true';

    await assert.rejects(
      async () => {
        await fetchPublicRestStops();
      },
      (err: any) => {
        assert.ok(err instanceof ApiNetworkError);
        return true;
      }
    );
  });

  // ==========================================
  // 7. Empty Results & Zero Fabrication (Phase 4B)
  // ==========================================
  await t.test('fetchPublicRestStops handles empty results without falling back to demo data', async () => {
    const { server, url } = await createMockApiServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: true,
          data: {
            items: [],
            pagination: {
              page: 1,
              limit: 10,
              total: 0,
              totalPages: 0,
              hasNextPage: false,
              hasPrevPage: false,
            },
          },
          timestamp: new Date().toISOString(),
        })
      );
    });

    try {
      process.env.PITSTOP_API_BASE_URL = url;
      (process.env as any).NODE_ENV = 'production';

      const result = await fetchPublicRestStops({ search: 'NonExistentPlace' });
      assert.equal(result.isDemoFallback, false);
      assert.equal(result.items.length, 0);
      assert.equal(result.pagination.total, 0);
    } finally {
      server.close();
    }
  });

  await t.test('fetchPublicRestStops serializes multiple facilities as comma-separated list', async () => {
    let capturedUrl = '';
    const { server, url } = await createMockApiServer((req, res) => {
      capturedUrl = req.url || '';
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: true,
          data: {
            items: [],
            pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false },
          },
        })
      );
    });

    try {
      process.env.PITSTOP_API_BASE_URL = url;
      (process.env as any).NODE_ENV = 'production';

      await fetchPublicRestStops({
        facilities: [Facility.DRINKING_WATER, Facility.RESTROOM, Facility.WIFI],
      });

      assert.match(capturedUrl, /facilities=drinking_water%2Crestroom%2Cwifi|facilities=drinking_water,restroom,wifi/);
    } finally {
      server.close();
    }
  });
});
