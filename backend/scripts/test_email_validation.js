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
  'test@.org',
  'ddd12gmail.com',
  'ddd12@',
  'ddd12@@gmail.com',
  'ddd..12@gmail.com',
  '.ddd@gmail.com',
  'ddd.@gmail.com',
  'ddd@.gmail.com',
  'ddd@gmail..com',
  '+user@gmail.com',
  'user+@gmail.com',
];

const validEmails = [
  'name@gmail.com',
  'aman@kiranaerp.com',
  'ayyan@kiranaerp.com',
  'support@my-store.co.in',
  'john.doe@company.org',
  'user_123@domain.net',
  'user+test@gmail.com',
  'john_doe@gmail.com',
  'user123@outlook.com',
  'firstname.lastname@company.co.in',
  'ddd12@gmil.com',
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
