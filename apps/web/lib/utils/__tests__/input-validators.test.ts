import { describe, it } from 'node:test';
import assert from 'node:assert';
import { sanitizePhoneNumber, sanitizePincode } from '../input-validators';

describe('Input Validators & Sanitizers', () => {
  it('correctly cleans a standard 10-digit mobile number', () => {
    assert.strictEqual(sanitizePhoneNumber('9876543210'), '9876543210');
  });

  it('strips non-digits from phone number input', () => {
    assert.strictEqual(sanitizePhoneNumber('98a76b54c32d10'), '9876543210');
    assert.strictEqual(sanitizePhoneNumber('hello world'), '');
    assert.strictEqual(sanitizePhoneNumber('98 765 43210'), '9876543210');
    assert.strictEqual(sanitizePhoneNumber('+91-9876543210'), '9876543210');
  });

  it('handles leading 91 or 0 prefix when length exceeds 10', () => {
    assert.strictEqual(sanitizePhoneNumber('919876543210'), '9876543210');
    assert.strictEqual(sanitizePhoneNumber('09876543210'), '9876543210');
  });

  it('restricts phone number to maximum 10 digits', () => {
    assert.strictEqual(sanitizePhoneNumber('98765432109999'), '9876543210');
  });

  it('correctly cleans and clamps a 6-digit postal pincode', () => {
    assert.strictEqual(sanitizePincode('302001'), '302001');
    assert.strictEqual(sanitizePincode('302abc001'), '302001');
    assert.strictEqual(sanitizePincode('3020019999'), '302001');
    assert.strictEqual(sanitizePincode('invalid'), '');
  });
});

