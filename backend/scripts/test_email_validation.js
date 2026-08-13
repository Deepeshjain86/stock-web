import { isValidEmail, validateEmailField, INVALID_EMAIL_MESSAGE } from '../utils/validators.js';

console.log('====================================================');
console.log('   TESTING EMAIL VALIDATION ENGINE                  ');
console.log('====================================================\n');

const invalidEmails = [
  'abhi@875gmail.com',
  'admin@',
  'admin@gmail',
  '@gmail.com',
  'admin@gmail.',
  'admin@.com',
  'admin..test@gmail.com',
  'admin gmail.com',
  '.admin@gmail.com',
  'admin.@gmail.com',
  'admin@gmail..com',
  'user@123domain.com',
  'test@.org'
];

const validEmails = [
  'name@gmail.com',
  'aman@kiranaerp.com',
  'ayyan@kiranaerp.com',
  'support@my-store.co.in',
  'john.doe@company.org',
  'user_123@domain.net'
];

let passed = true;

console.log('--- INVALID EMAIL TESTS (Expect false / Error message) ---');
for (const email of invalidEmails) {
  const result = isValidEmail(email);
  const msg = validateEmailField(email, true);
  console.log(`[TEST] "${email}" => isValid: ${result} | error: "${msg}"`);
  if (result !== false || msg !== INVALID_EMAIL_MESSAGE) {
    console.error(`❌ FAILED for invalid email: "${email}"`);
    passed = false;
  }
}

console.log('\n--- VALID EMAIL TESTS (Expect true / null) ---');
for (const email of validEmails) {
  const result = isValidEmail(email);
  const msg = validateEmailField(email, true);
  console.log(`[TEST] "${email}" => isValid: ${result} | error: "${msg}"`);
  if (result !== true || msg !== null) {
    console.error(`❌ FAILED for valid email: "${email}"`);
    passed = false;
  }
}

console.log('\n====================================================');
if (passed) {
  console.log('   ✅ ALL EMAIL VALIDATION TESTS PASSED 100% SUCCESS  ');
} else {
  console.log('   ❌ SOME TESTS FAILED                             ');
}
console.log('====================================================');
