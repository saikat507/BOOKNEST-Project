const { UserVerification, User } = require('../models');
const { uploadToCloudinary } = require('../config/cloudinary');

const allowedStatuses = ['pending', 'approved', 'rejected'];

/**
 * Create a new verification request
 * @route POST /api/verifications
 */
const createVerificationRequest = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let { nid_front_image } = req.body;

    if (req.file) {
      try {
        const { secure_url } = await uploadToCloudinary(req.file.path, 'booknest/ids');
        nid_front_image = secure_url;
      } catch (uploadError) {
        console.error('Upload error:', uploadError);
        return res.status(400).json({
          success: false,
          message: 'Failed to upload ID document'
        });
      }
    }

    if (!nid_front_image) {
      return res.status(400).json({
        success: false,
        message: 'nid_front_image or an id_document upload is required'
      });
    }

    const existing = await UserVerification.findOne({
      where: {
        user_id: userId,
        status: 'pending'
      }
    });

    if (existing) {
      await existing.update({
        nid_front_image,
        verified_by: null,
        verified_at: null,
        rejection_reason: null
      });
      await User.update({ verification_status: 'pending', rejection_reason: null }, { where: { id: userId } });

      return res.status(200).json({
        success: true,
        message: 'Pending verification request updated successfully',
        verification: existing
      });
    }

    const verification = await UserVerification.create({
      user_id: userId,
      nid_front_image,
      status: 'pending'
    });
    await User.update({ verification_status: 'pending', rejection_reason: null }, { where: { id: userId } });

    return res.status(201).json({
      success: true,
      message: 'Verification request submitted successfully',
      verification
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get verification requests for current user or admin
 * @route GET /api/verifications
 */
const getVerifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const whereClause = {};

    if (req.user.role !== 'admin') {
      whereClause.user_id = req.user.id;
    }

    const { count, rows } = await UserVerification.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'verified_by_user', attributes: ['id', 'name', 'email'] }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return res.status(200).json({
      success: true,
      verifications: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
      limit: parseInt(limit)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single verification request
 * @route GET /api/verifications/:id
 */
const getVerificationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const verification = await UserVerification.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'verified_by_user', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verification request not found'
      });
    }

    if (req.user.role !== 'admin' && verification.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this verification request'
      });
    }

    return res.status(200).json({
      success: true,
      verification
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Review and update verification status (admin only)
 * @route PATCH /api/verifications/:id/status
 */
const reviewVerificationStatus = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can review verification requests'
      });
    }

    const { id } = req.params;
    const { status, rejection_reason } = req.body;

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const verification = await UserVerification.findByPk(id);
    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verification request not found'
      });
    }

    verification.status = status;
    verification.verified_by = req.user.id;
    verification.verified_at = new Date();
    verification.rejection_reason = status === 'rejected' ? rejection_reason : null;
    await verification.save();
    await User.update(
      {
        verification_status: status,
        rejection_reason: verification.rejection_reason
      },
      { where: { id: verification.user_id } }
    );

    return res.status(200).json({
      success: true,
      message: 'Verification request updated successfully',
      verification
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createVerificationRequest,
  getVerifications,
  getVerificationById,
  reviewVerificationStatus
};
