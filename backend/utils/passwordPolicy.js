const COMMON_PASSWORDS = new Set([
  'password123!', 'password123', 'password1!', 'qwerty123!', 'qwerty123',
  'letmein123!', 'welcome123!', 'iloveyou123!', 'admin123456!', 'booknest123!',
  'password1234!', 'qwertyuiop123!', 'abc123456789!', 'changeme123!', 'welcome1!'
]);

function validatePassword(password, { name = '', email = '' } = {}) {
  const errors = [];
  if (typeof password !== 'string') return ['Password is required.'];
  if (password.length < 12) errors.push('Password must be at least 12 characters.');
  if (password.length > 128) errors.push('Password must be no more than 128 characters.');
  if (!/[A-Z]/.test(password)) errors.push('Add at least one uppercase letter.');
  if (!/[a-z]/.test(password)) errors.push('Add at least one lowercase letter.');
  if (!/[0-9]/.test(password)) errors.push('Add at least one number.');
  if (!/[^A-Za-z0-9\s]/.test(password)) errors.push('Add at least one special character.');
  const normalized = password.toLowerCase();
  if (COMMON_PASSWORDS.has(normalized) || /^(.)\1{11,}/.test(normalized) || /^(?:123456|qwerty|abcdef)/i.test(password) || /^(?:password|passw[o0]rd|letmein|welcome|admin|iloveyou)(?:[0-9!@#$%^&*._-]*)$/i.test(password)) errors.push('Choose a less common password.');
  const emailUsername = typeof email === 'string' ? email.split('@')[0] : '';
  const identityTerms = [
    ...(typeof name === 'string' ? name.toLowerCase().split(/[^a-z0-9]+/) : []),
    typeof emailUsername === 'string' ? emailUsername.toLowerCase() : ''
  ];
  for (const term of identityTerms) {
    if (term.length >= 3 && normalized.includes(term)) {
      errors.push('Password must not contain your name or email username.');
      break;
    }
  }
  return errors;
}

module.exports = { validatePassword };
