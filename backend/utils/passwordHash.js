const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// bcrypt only consumes 72 bytes. Pre-hash new passwords so the documented
// 128-character policy remains meaningful, while retaining legacy hash support.
const prehash = password => crypto.createHash('sha256').update(password, 'utf8').digest('base64');

async function hashPassword(password) {
  return `bcrypt-sha256$${await bcrypt.hash(prehash(password), 12)}`;
}

async function verifyPassword(password, storedHash) {
  if (storedHash.startsWith('bcrypt-sha256$')) {
    return bcrypt.compare(prehash(password), storedHash.slice('bcrypt-sha256$'.length));
  }
  return bcrypt.compare(password, storedHash);
}

module.exports = { hashPassword, verifyPassword };
