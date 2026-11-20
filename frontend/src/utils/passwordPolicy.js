const commonPasswords = new Set([
  'password123!', 'password123', 'password1!', 'qwerty123!', 'qwerty123',
  'letmein123!', 'welcome123!', 'iloveyou123!', 'admin123456!', 'booknest123!',
  'password1234!', 'qwertyuiop123!', 'abc123456789!', 'changeme123!', 'welcome1!'
]);

export function getPasswordChecks(password, { name = '', email = '' } = {}) {
  const lower = password.toLowerCase();
  const username = email.split('@')[0].trim().toLowerCase();
  const nameParts = name.toLowerCase().split(/[^a-z0-9]+/);
  const identifiable = [...nameParts, username].some(value => value.length >= 3 && lower.includes(value));
  return [
    { label: 'At least 12 characters', valid: password.length >= 12 },
    { label: 'No more than 128 characters', valid: password.length <= 128 },
    { label: 'Uppercase letter (A–Z)', valid: /[A-Z]/.test(password) },
    { label: 'Lowercase letter (a–z)', valid: /[a-z]/.test(password) },
    { label: 'Number (0–9)', valid: /[0-9]/.test(password) },
    { label: 'Special character', valid: /[^A-Za-z0-9\s]/.test(password) },
    { label: 'Not a commonly used password', valid: !commonPasswords.has(lower) && !/^(.)\1{11,}/.test(lower) && !/^(?:123456|qwerty|abcdef)/i.test(password) && !/^(?:password|passw[o0]rd|letmein|welcome|admin|iloveyou)(?:[0-9!@#$%^&*._-]*)$/i.test(password) },
    { label: 'Does not contain your name or email username', valid: !identifiable },
  ];
}

export function getPasswordStrength(checks, password) {
  if (!password) return '';
  const score = checks.filter(check => check.valid).length;
  if (score <= 2) return 'Very Weak';
  if (score <= 4) return 'Weak';
  if (score <= 5) return 'Medium';
  if (score <= 6) return 'Strong';
  return 'Very Strong';
}
