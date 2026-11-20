const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const UserVerification = sequelize.define('UserVerification', {
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
  nid_front_image: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  verified_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    }
  },
  verified_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'userverifications',
  timestamps: true,
  underscored: true
});

UserVerification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
UserVerification.belongsTo(User, { foreignKey: 'verified_by', as: 'verified_by_user' });

module.exports = UserVerification;
