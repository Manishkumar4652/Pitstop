import test from 'node:test';
import assert from 'node:assert/strict';
import { Server } from 'http';
import { createApp } from '../app';
import { z } from 'zod';
import { validateRequest } from '../middleware/validate';
import { sendSuccess } from '../utils/response';

import { Router } from 'express';

// Start test server on an ephemeral random port (port 0)
function setupTestServer() {
  const fixtureRouter = Router();

  // Test fixture 1: Isolated validation test endpoint
  const testInputSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    quantity: z.number().int().positive('Quantity must be positive'),
  });

  fixtureRouter.post(
    '/test-fixture-validation',
    validateRequest({ body: testInputSchema }),
    (req, res) => {
      sendSuccess(res, { processed: req.body });
    }
  );

  // Test fixture 2: Unhandled error test endpoint
  fixtureRouter.get('/test-fixture-error', () => {
    throw new Error('Simulated internal server exception with sensitive internal details');
  });

  const app = createApp(fixtureRouter);

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

test('API Foundation Test Suite', async (t) => {
  const { server, baseUrl } = await setupTestServer();

  t.after(() => {
    server.close();
  });

  await t.test('1. Top-level /health endpoint returns 200 with standard response', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'PitStop REST API');
    assert.ok(typeof body.environment === 'string');
    assert.ok(typeof body.uptimeSeconds === 'number');
    assert.ok(typeof body.timestamp === 'string');
    // Ensure no internal DB connection is claimed
    assert.equal(body.mongodb, undefined);
  });

  await t.test('2. Versioned /api/v1/health endpoint returns 200 with success structure', async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.status, 'ok');
    assert.equal(body.data.version, 'v1');
    assert.equal(body.data.database, 'disconnected'); // Truthful status when no DB connection is open
  });

  await t.test('3. Unknown route returns structured JSON 404', async () => {
    const res = await fetch(`${baseUrl}/api/v1/unknown-endpoint-xyz`);
    assert.equal(res.status, 404);

    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error, 'Not Found');
    assert.ok(body.message.includes('The requested API endpoint does not exist'));
  });

  await t.test('4. Malformed JSON request body returns controlled HTTP 400', async () => {
    const res = await fetch(`${baseUrl}/test-fixture-validation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{"invalidJson": ',
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error, 'Bad Request');
    assert.ok(body.message.includes('Malformed JSON payload'));
  });

  await t.test('5. Request validation rejects invalid input with HTTP 400 and structured issues', async () => {
    const res = await fetch(`${baseUrl}/test-fixture-validation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'a', // Too short (min 3)
        quantity: -2, // Not positive
      }),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error, 'Validation Error');
    assert.ok(Array.isArray(body.details));
    assert.equal(body.details.length, 2);

    const fields = body.details.map((d: any) => d.field);
    assert.ok(fields.includes('title'));
    assert.ok(fields.includes('quantity'));
  });

  await t.test('6. Request validation accepts valid payload and returns HTTP 200', async () => {
    const res = await fetch(`${baseUrl}/test-fixture-validation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Water Refill Station',
        quantity: 5,
      }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.processed.title, 'Water Refill Station');
    assert.equal(body.data.processed.quantity, 5);
  });

  await t.test('7. Error handling does not leak stack traces in response', async () => {
    const res = await fetch(`${baseUrl}/test-fixture-error`);
    assert.equal(res.status, 500);

    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error, 'Internal Server Error');
    // Ensure stack trace property is absent from response body
    assert.equal(body.stack, undefined);
  });

  await t.test('8. CORS headers reflect configured allowed client origin', async () => {
    const res = await fetch(`${baseUrl}/health`, {
      headers: {
        Origin: 'http://localhost:3000',
      },
    });

    assert.equal(res.status, 200);
    assert.equal(res.headers.get('access-control-allow-origin'), 'http://localhost:3000');
    assert.equal(res.headers.get('access-control-allow-credentials'), 'true');
  });
});
