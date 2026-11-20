const crypto = require('crypto');

/**
 * Generate a random 6-digit OTP
 * @returns {string} 6-digit OTP as string (e.g., "482910")
 */
const generateOTP = () => {
  // Generate a random number between 100000 and 999999
  const otp = crypto.randomInt(100000, 1000000);
  return otp.toString();
};

/**
 * Get OTP expiry time (10 minutes from now)
 * @returns {Date} Date object representing 10 minutes from current time
 */
const getOTPExpiry = () => {
  const expiryTime = new Date();
  expiryTime.setMinutes(expiryTime.getMinutes() + 10);
  return expiryTime;
};

module.exports = {
  generateOTP,
  getOTPExpiry
};
