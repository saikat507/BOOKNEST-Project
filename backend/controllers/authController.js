const { User, UserVerification } = require('../models');
const jwt = require('jsonwebtoken');
const { hashPassword, verifyPassword } = require('../utils/passwordHash');
const { awardCoins } = require('../utils/coinService');
const { sendOTPEmail, sendWelcomeEmail } = require('../utils/sendEmail');
const { getOTPExpiry } = require('../utils/generateOTP');
const { uploadToCloudinary } = require('../config/cloudinary');
const { attachVerificationState } = require('../utils/verificationService');
const { createResetToken, digestResetToken, verifyResetToken, isResetTokenExpired } = require('../utils/passwordResetToken');
const { validatePassword } = require('../utils/passwordPolicy');
const { progressiveDelay, recordFailure, clearFailures } = require('../middleware/loginThrottle');
const { Op } = require('sequelize');
const DUMMY_PASSWORD_HASH = '$2b$12$2GoN2KzlVOOmVXut8zyop.q2yVm5EYwQEEDg00p0bA9fH59qXajMa';
require('dotenv').config();

/**
 * User Registration
 * @route POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, phone } = req.body;

    // Validation
    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and phone are required'
      });
    }

    if (typeof name !== 'string' || name.trim().length < 2 || name.length > 100 ||
        typeof email !== 'string' || email.length > 150 ||
        !/^(?!.*\.\.)(?!\.)[^\s@]+@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/.test(email) ||
        typeof phone !== 'string' || !/^(?:01[3-9]\d{8}|\+8801[3-9]\d{8})$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Enter a valid name, email, and phone number.' });
    }
    if (typeof password !== 'string' || password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    const passwordErrors = validatePassword(password, { name, email });
    if (passwordErrors.length) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet the security requirements.',
        errors: passwordErrors
      });
    }

    // Check if email already exists
    const normalizedEmail = email.toLowerCase();
    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await User.create({
      name,
      email: normalizedEmail,
      password_hash: hashedPassword,
      phone,
      role: 'user',
      coin_balance: 0
    });

    // Award initial coins
    await awardCoins(
      user.id,
      parseInt(process.env.INITIAL_COIN_AMOUNT) || 50,
      'register_bonus'
    );

    // Refresh user from DB to get updated coin_balance
    await user.reload();

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.name, user.coin_balance);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError.message);
      // Don't fail registration if email fails
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: await attachVerificationState(user.toSafeObject())
    });
  } catch (error) {
    next(error);
  }
};

/**
 * User Login
 * @route POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    await progressiveDelay(req);

    // Validation
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Find user by email
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      await verifyPassword(password, DUMMY_PASSWORD_HASH);
      recordFailure(req);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Compare password
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid || user.is_active === false) {
      recordFailure(req);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    clearFailures(req);

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: await attachVerificationState(user.toSafeObject())
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin Login
 * @route POST /api/auth/admin/login
 */
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    await progressiveDelay(req);

    // Validation
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Find user by email
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      await verifyPassword(password, DUMMY_PASSWORD_HASH);
      recordFailure(req);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Compare password
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid || user.role !== 'admin' || user.is_active === false) {
      recordFailure(req);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    clearFailures(req);

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token,
      user: await attachVerificationState(user.toSafeObject())
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot Password - Generate and send OTP
 * @route POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Validation
    if (typeof email !== 'string' || !/^(?!.*\.\.)(?!\.)[^\s@]+@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid email address.'
      });
    }

    // Find user
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(200).json({ success: true, message: 'If an account exists for that email, reset instructions have been sent.' });
    }

    // Store only a digest of a cryptographically random, single-use token.
    const otp = createResetToken();
    const otpExpiresAt = getOTPExpiry();

    // Save OTP to user
    await user.update({
      password_reset_token_hash: digestResetToken(otp),
      otp_expires_at: otpExpiresAt
    });

    // Send OTP email
    try {
      await sendOTPEmail(user.email, user.name, otp);
    } catch (emailError) {
      await user.update({ password_reset_token_hash: null, otp_expires_at: null });
      console.error('Failed to send password reset email');
      return res.status(200).json({ success: true, message: 'If an account exists for that email, reset instructions have been sent.' });
    }

    return res.status(200).json({
      success: true,
      message: 'If an account exists for that email, reset instructions have been sent.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset Password using OTP
 * @route POST /api/auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    // Validation
    if (typeof email !== 'string' || !/^(?!.*\.\.)(?!\.)[^\s@]+@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/.test(email) || typeof otp !== 'string' || typeof newPassword !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required'
      });
    }

    if (typeof confirmPassword !== 'string' || newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    // Find user
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Reset token is invalid or expired. Request a new one.' });
    }

    const passwordErrors = validatePassword(newPassword, { name: user.name, email: user.email });
    if (passwordErrors.length) {
      return res.status(400).json({ success: false, message: 'Password does not meet the security requirements.', errors: passwordErrors });
    }

    if (!verifyResetToken(otp, user.password_reset_token_hash) || isResetTokenExpired(user.otp_expires_at)) {
      return res.status(400).json({ success: false, message: 'Reset token is invalid or expired. Request a new one.' });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user password and clear OTP
    const [updatedCount] = await User.update({
      password_hash: hashedPassword,
      otp: null,
      otp_expires_at: null,
      password_reset_token_hash: null
    }, {
      where: {
        id: user.id,
        password_reset_token_hash: user.password_reset_token_hash,
        otp_expires_at: { [Op.gt]: new Date() }
      }
    });
    if (!updatedCount) return res.status(400).json({ success: false, message: 'Reset token is invalid or expired. Request a new one.' });

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || !currentPassword) {
      return res.status(400).json({ success: false, message: 'Current and new passwords are required.' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }
    const user = await User.scope('withPassword').findByPk(req.user.id);
    if (!user || !(await verifyPassword(currentPassword, user.password_hash))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }
    const errors = validatePassword(newPassword, { name: user.name, email: user.email });
    if (errors.length) {
      return res.status(400).json({ success: false, message: 'Password does not meet the security requirements.', errors });
    }
    await user.update({
      password_hash: await hashPassword(newPassword),
      password_reset_token_hash: null,
      otp: null,
      otp_expires_at: null
    });
    return res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Current User Profile
 * @route GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    // Get user from token (req.user should be set by verifyToken middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Fetch fresh user data from database
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.is_active === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked. Please contact support.'
      });
    }

    const safeUser = await attachVerificationState({
      ...user.toSafeObject(),
      coin_balance: user.coin_balance
    });

    return res.status(200).json({
      success: true,
      user: safeUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update User Profile
 * @route PUT /api/auth/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, facebook_url, address, profession, institute } = req.body;
    if (phone && !/^(?:01[3-9]\d{8}|\+8801[3-9]\d{8})$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Enter a valid Bangladesh mobile number.' });
    }
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (facebook_url !== undefined) user.facebook_url = facebook_url;
    if (address !== undefined) user.address = address;
    if (profession !== undefined) user.profession = profession;
    if (institute !== undefined) user.institute = institute;

    if (req.file) {
      try {
        const { secure_url } = await uploadToCloudinary(req.file.path, 'booknest/profiles');
        user.profile_image_url = secure_url;
      } catch (uploadError) {
        console.error('Upload error:', uploadError);
        return res.status(400).json({
          success: false,
          message: 'Failed to upload profile image'
        });
      }
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: await attachVerificationState(user.toSafeObject())
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload ID Document for Verification
 * @route POST /api/auth/upload-id
 */
const uploadID = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      });
    }

    let verification;

    try {
      const { secure_url } = await uploadToCloudinary(req.file.path, 'booknest/ids');
      const existing = await UserVerification.findOne({
        where: {
          user_id: user.id,
          status: 'pending'
        }
      });

      if (existing) {
        verification = await existing.update({
          nid_front_image: secure_url,
          verified_by: null,
          verified_at: null,
          rejection_reason: null
        });
      } else {
        verification = await UserVerification.create({
          user_id: user.id,
          nid_front_image: secure_url,
          status: 'pending'
        });
      }
    } catch (uploadError) {
      console.error('Upload error:', uploadError);
      return res.status(400).json({
        success: false,
        message: 'Failed to upload ID document'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'ID document uploaded successfully. Your verification request is pending review.',
      user: await attachVerificationState(user.toSafeObject()),
      verification
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  adminLogin,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
  updateProfile,
  uploadID
};
