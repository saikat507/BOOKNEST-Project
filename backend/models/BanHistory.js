const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const BanHistory = sequelize.define('BanHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  admin_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    }
  },
  action: {
    type: DataTypes.ENUM('block', 'unblock', 'ban', 'warn'),
    allowNull: false
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'ban_histories',
  timestamps: true,
  underscored: true
});

module.exports = BanHistory;
