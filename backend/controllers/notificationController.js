const { Notification } = require('../models');
require('dotenv').config();

/**
 * Get all notifications for current user
 * @route GET /api/notifications
 */
const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.id;

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Fetch notifications
    const { count, rows } = await Notification.findAndCountAll({
      where: { user_id: userId },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Count unread notifications
    const unreadCount = await Notification.count({
      where: {
        user_id: userId,
        is_read: false
      }
    });

    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      success: true,
      notifications: rows,
      total: count,
      unreadCount,
      page: parseInt(page),
      totalPages,
      limit: parseInt(limit)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a single notification as read
 * @route PATCH /api/notifications/:id/read
 */
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find notification
    const notification = await Notification.findByPk(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if notification belongs to current user
    if (notification.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this notification'
      });
    }

    // Mark as read
    notification.is_read = true;
    await notification.save();

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read for current user
 * @route PATCH /api/notifications/mark-all-read
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Update all unread notifications
    const result = await Notification.update(
      { is_read: true },
      {
        where: {
          user_id: userId,
          is_read: false
        }
      }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      updatedCount: result[0]
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};
