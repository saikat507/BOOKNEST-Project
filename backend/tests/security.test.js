const test = require('node:test');
const assert = require('node:assert/strict');
const { validatePassword } = require('../utils/passwordPolicy');
const { hashPassword, verifyPassword } = require('../utils/passwordHash');
const { createResetToken, digestResetToken, verifyResetToken, isResetTokenExpired } = require('../utils/passwordResetToken');
const { progressiveDelay, recordFailure, clearFailures } = require('../middleware/loginThrottle');

test('password policy rejects each required weakness', () => {
  const invalid = [
    'Short1!abc',
    'lowercase123!',
    'UPPERCASE123!',
    'NoNumbersHere!!',
    'NoSpecial12345',
    'A'.repeat(129) + 'a1!',
    'Password123!',
    'ReaderName!123',
    'reader@example.test',
  ];
  for (const password of invalid) assert.notEqual(validatePassword(password, { name: 'Reader Name', email: 'reader@example.test' }).length, 0, password);
});

test('password policy accepts strong passphrases and preserves spaces', () => {
  assert.deepEqual(validatePassword('River Lanterns 48! Meadow', { name: 'Reader Name', email: 'reader@example.test' }), []);
});

test('bcrypt prehash safely supports passwords above bcrypt byte limit and unique salts', async () => {
  const password = 'R'.repeat(70) + 'iver Lanterns 48!';
  const first = await hashPassword(password);
  const second = await hashPassword(password);
  assert.notEqual(first, second);
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword(password + 'x', first), false);
});

test('legacy bcrypt hashes remain verifiable', async () => {
  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash('LegacyPassword123!', 12);
  assert.equal(await verifyPassword('LegacyPassword123!', hash), true);
});

test('reset tokens are random, single-use after clearing the digest, and expire', () => {
  const token = createResetToken();
  const secondToken = createResetToken();
  const storedDigest = digestResetToken(token);
  assert.equal(token.length, 64);
  assert.notEqual(token, secondToken);
  assert.equal(verifyResetToken(token, storedDigest), true);
  assert.equal(verifyResetToken(secondToken, storedDigest), false);
  assert.equal(verifyResetToken(token, null), false);
  assert.equal(isResetTokenExpired(new Date(1000), 1001), true);
  assert.equal(isResetTokenExpired(new Date(2000), 1001), false);
});

test('repeated failed login attempts trigger a progressive delay', async () => {
  const req = { ip: 'security-test', body: { email: 'throttle@example.test' } };
  recordFailure(req); recordFailure(req); recordFailure(req);
  const started = Date.now();
  await progressiveDelay(req);
  assert.ok(Date.now() - started >= 900);
  clearFailures(req);
});
