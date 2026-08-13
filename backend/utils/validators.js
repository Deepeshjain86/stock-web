/**
 * Central Strict Validation Utilities for Kirana ERP Backend
 */

// Strict Email Regex: username@domain.tld
// - Username: alphanumeric characters, dots, hyphens, underscores (no consecutive dots, no leading/trailing dots)
// - Domain name: MUST start with an alphabet letter [a-zA-Z], followed by letters, digits, or hyphens (rejects domains starting with digits like 875gmail)
// - TLD: 2 to 10 letters (e.g. .com, .in, .org, .net, .co.in)
export const STRICT_EMAIL_REGEX = /^[a-zA-Z0-9]+(?:[._-][a-zA-Z0-9]+)*@[a-zA-Z][a-zA-Z0-9-]*(?:\.[a-zA-Z][a-zA-Z0-9-]*)*\.[a-zA-Z]{2,10}$/;

export const INVALID_EMAIL_MESSAGE = "Please enter a valid email address. Example: name@gmail.com";

/**
 * Validates strict email format.
 * @param {string} email
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length > 254) return false;
  return STRICT_EMAIL_REGEX.test(trimmed);
};

/**
 * Validates email field if provided (or required).
 * @param {string} email 
 * @param {boolean} isRequired 
 * @returns {string|null} Error message if invalid, null if valid
 */
export const validateEmailField = (email, isRequired = true) => {
  if (!email || typeof email !== 'string' || !email.trim()) {
    if (isRequired) return "Email address is required";
    return null;
  }
  if (!isValidEmail(email)) {
    return INVALID_EMAIL_MESSAGE;
  }
  return null;
};
