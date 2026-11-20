const rateLimit = require('express-rate-limit');

const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again later.' }
});

const sensitiveAuthRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});

const failures = new Map();
const MAX_ENTRIES = 10000;

function accountKey(req) {
  const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase() : '';
  return `${req.ip}:${email.slice(0, 150)}`;
}

async function progressiveDelay(req) {
  const entry = failures.get(accountKey(req));
  if (entry && entry.count >= 3) {
    const wait = Math.min(1000 * (2 ** Math.min(entry.count - 3, 4)), 16000);
    await new Promise(resolve => setTimeout(resolve, wait));
  }
}

function recordFailure(req) {
  const key = accountKey(req);
  const previous = failures.get(key) || { count: 0 };
  const count = previous.count + 1;
  failures.set(key, { count });
  if (failures.size > MAX_ENTRIES) failures.delete(failures.keys().next().value);
}

function clearFailures(req) { failures.delete(accountKey(req)); }

module.exports = { loginRateLimit, sensitiveAuthRateLimit, progressiveDelay, recordFailure, clearFailures };
