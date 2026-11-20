const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { verifyToken } = require('../middleware/auth.middleware');
const { attachVerificationState } = require('../utils/verificationService');

router.get('/:id', verifyToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: [
        'id',
        'name',
        'email',
        'phone',
        'facebook_url',
        'address',
        'profession',
        'institute',
        'profile_image_url'
      ]
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const safeUser = await attachVerificationState(user);

    return res.status(200).json({
      success: true,
      user: safeUser
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
