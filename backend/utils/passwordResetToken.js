const crypto = require('crypto');

function createResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

function digestResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function verifyResetToken(token, storedDigest) {
  if (typeof token !== 'string' || typeof storedDigest !== 'string' || !/^[a-f0-9]{64}$/i.test(storedDigest)) return false;
  const submitted = Buffer.from(digestResetToken(token), 'hex');
  const stored = Buffer.from(storedDigest, 'hex');
  return crypto.timingSafeEqual(submitted, stored);
}

function isResetTokenExpired(expiresAt, now = Date.now()) {
  return !expiresAt || new Date(expiresAt).getTime() <= now;
}

module.exports = { createResetToken, digestResetToken, verifyResetToken, isResetTokenExpired };
