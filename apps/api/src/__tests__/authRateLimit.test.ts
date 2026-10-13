import test from 'node:test';
import assert from 'node:assert/strict';
import { Server } from 'http';
import express from 'express';
import { createRateLimiter } from '../middleware/rateLimit';

test('Authentication Rate Limiter Middleware Suite (Phase 5A)', async (t) => {
  let server: Server;
  let baseUrl: string;

  t.before(async () => {
    const app = express();
    app.use(express.json());

    // Strict rate limiter for testing (3 requests per window, skipInTest: false)
    const testLimiter = createRateLimiter({
      windowMs: 5000,
      max: 3,
      message: 'Too many test requests. Throttled.',
      skipInTest: false,
    });

    app.post('/test-throttled', testLimiter, (_req, res) => {
      res.status(200).json({ success: true, message: 'Passed rate limit' });
    });

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        if (addr && typeof addr !== 'string') {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  t.after(() => {
    server.close();
  });

  await t.test('Allows requests under the configured threshold with remaining header', async () => {
    const res1 = await fetch(`${baseUrl}/test-throttled`, { method: 'POST' });
    assert.equal(res1.status, 200);
    assert.equal(res1.headers.get('X-RateLimit-Limit'), '3');
    assert.equal(res1.headers.get('X-RateLimit-Remaining'), '2');

    const res2 = await fetch(`${baseUrl}/test-throttled`, { method: 'POST' });
    assert.equal(res2.status, 200);
    assert.equal(res2.headers.get('X-RateLimit-Remaining'), '1');

    const res3 = await fetch(`${baseUrl}/test-throttled`, { method: 'POST' });
    assert.equal(res3.status, 200);
    assert.equal(res3.headers.get('X-RateLimit-Remaining'), '0');
  });

  await t.test('Blocks requests exceeding the threshold with HTTP 429 and Retry-After', async () => {
    const res4 = await fetch(`${baseUrl}/test-throttled`, { method: 'POST' });
    assert.equal(res4.status, 429);
    assert.ok(res4.headers.get('Retry-After'));

    const body = await res4.json();
    assert.equal(body.success, false);
    assert.equal(body.error, 'RateLimitError');
    assert.match(body.message, /too many/i);
    assert.ok(typeof body.retryAfterSeconds === 'number');
  });
});
