const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AdminSetting = sequelize.define('AdminSetting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  value: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'admin_settings',
  timestamps: true,
  underscored: true
});

module.exports = AdminSetting;
