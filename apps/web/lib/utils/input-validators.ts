/**
 * Input validation and restriction helpers for PitStop.
 * Ensures numeric/phone/pincode fields strictly reject invalid characters (alphabets, symbols, spaces).
 */

// Common navigation, editing and control keys allowed in numeric inputs
const ALLOWED_CONTROL_KEYS = new Set([
  'Backspace',
  'Delete',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Tab',
  'Enter',
  'Home',
  'End',
  'Escape',
]);

/**
 * KeyDown event handler that allows only digits (0-9) and standard control/navigation keys.
 * Completely blocks any alphabetic letters, symbols, or whitespace.
 */
export const allowOnlyDigitsKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  // Allow Ctrl / Command combinations (e.g. Copy, Paste, Cut, Select All, Undo)
  if (e.ctrlKey || e.metaKey) {
    return;
  }

  // Allow navigation and editing keys
  if (ALLOWED_CONTROL_KEYS.has(e.key)) {
    return;
  }

  // Block any non-digit character key
  if (e.key.length === 1 && !/^[0-9]$/.test(e.key)) {
    e.preventDefault();
  }
};

/**
 * KeyDown event handler for numbers (blocking 'e', 'E', '+', '-', spaces).
 * Optionally allows a single decimal point.
 */
export const allowNumberKeyDown = (
  e: React.KeyboardEvent<HTMLInputElement>,
  allowDecimal: boolean = false
) => {
  if (e.ctrlKey || e.metaKey || ALLOWED_CONTROL_KEYS.has(e.key)) {
    return;
  }

  if (allowDecimal && e.key === '.') {
    if (e.currentTarget.value.includes('.')) {
      e.preventDefault();
    }
    return;
  }

  if (e.key.length === 1 && !/^[0-9]$/.test(e.key)) {
    e.preventDefault();
  }
};

/**
 * Strips all non-digit characters, removes leading +91 or 0 prefix if string > 10,
 * and restricts length to 10 digits for Indian mobile numbers.
 */
export const sanitizePhoneNumber = (val: string): string => {
  let cleaned = val.replace(/\D/g, '');
  if (cleaned.startsWith('91') && cleaned.length > 10) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith('0') && cleaned.length > 10) {
    cleaned = cleaned.slice(1);
  }
  return cleaned.slice(0, 10);
};

/**
 * Cleans Indian postal PIN code: strictly 6 digits max.
 */
export const sanitizePincode = (val: string): string => {
  return val.replace(/\D/g, '').slice(0, 6);
};

