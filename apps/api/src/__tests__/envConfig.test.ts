import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig, getJwtSecret, getQrSigningSecret } from '../config/env';
import { maskMongoUri } from '../config/database';

test('Production Environment Configuration & Secret Enforcement Suite (Phase 10)', async (t) => {
  const VALID_SECRET = 'a_very_secure_test_secret_that_has_at_least_32_characters_for_prod';
  const VALID_QR_SECRET = 'a_separate_secure_qr_secret_that_has_at_least_32_characters';
  const VALID_MONGO_URI = 'mongodb://127.0.0.1:27017/pitstop_prod';

  await t.test('1. In development, defaults apply cleanly without crashing', () => {
    const devConfig = loadConfig({
      NODE_ENV: 'development',
    });
    assert.equal(devConfig.NODE_ENV, 'development');
    assert.equal(devConfig.PORT, 5000);
    assert.equal(devConfig.CLIENT_URL, 'http://localhost:3000');
  });

  await t.test('2. In production, MONGODB_URI is strictly required', () => {
    assert.throws(
      () => {
        loadConfig({
          NODE_ENV: 'production',
          JWT_SECRET: VALID_SECRET,
        });
      },
      /MONGODB_URI is required in production environment/
    );
  });

  await t.test('3. In production, JWT_SECRET is strictly required and must be >= 32 characters', () => {
    // Missing JWT_SECRET
    assert.throws(
      () => {
        loadConfig({
          NODE_ENV: 'production',
          MONGODB_URI: VALID_MONGO_URI,
        });
      },
      /JWT_SECRET is required and must be at least 32 characters in production/
    );

    // Too short JWT_SECRET
    assert.throws(
      () => {
        loadConfig({
          NODE_ENV: 'production',
          MONGODB_URI: VALID_MONGO_URI,
          JWT_SECRET: 'short_key',
        });
      },
      /JWT_SECRET is required and must be at least 32 characters in production/
    );
  });

  await t.test('4. In production, valid configuration parses successfully', () => {
    const prodConfig = loadConfig({
      NODE_ENV: 'production',
      MONGODB_URI: VALID_MONGO_URI,
      JWT_SECRET: VALID_SECRET,
      QR_SIGNING_SECRET: VALID_QR_SECRET,
    });
    assert.equal(prodConfig.NODE_ENV, 'production');
    assert.equal(prodConfig.MONGODB_URI, VALID_MONGO_URI);
    assert.equal(prodConfig.JWT_SECRET, VALID_SECRET);
    assert.equal(prodConfig.QR_SIGNING_SECRET, VALID_QR_SECRET);
  });

  await t.test('5. Non-production rejects invalid short JWT_SECRET when provided', () => {
    assert.throws(
      () => {
        loadConfig({
          NODE_ENV: 'development',
          JWT_SECRET: 'short_secret_under_32',
        });
      },
      /JWT_SECRET must be at least 32 characters long when provided/
    );
  });

  await t.test('6. Rejects short QR_SIGNING_SECRET when provided', () => {
    assert.throws(
      () => {
        loadConfig({
          NODE_ENV: 'development',
          QR_SIGNING_SECRET: 'short_qr_key',
        });
      },
      /QR_SIGNING_SECRET must be at least 32 characters long when provided/
    );
  });

  await t.test('7. maskMongoUri hides user credentials from log output', () => {
    const uriWithAuth = 'mongodb+srv://adminUser:superSecretPassword123@cluster0.abcde.mongodb.net/pitstop?retryWrites=true';
    const masked = maskMongoUri(uriWithAuth);
    assert.ok(!masked.includes('superSecretPassword123'), 'Raw password must not be present');
    assert.ok(!masked.includes('adminUser'), 'Raw username must not be present');
    assert.ok(masked.includes('//***:***@cluster0.abcde.mongodb.net/pitstop'), 'Expected masked pattern');
  });
});
