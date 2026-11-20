const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BookReturn = sequelize.define('BookReturn', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  transaction_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  actual_return_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  fine_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  status: {
    type: DataTypes.ENUM('borrowed', 'returned', 'late'),
    defaultValue: 'borrowed'
  }
}, {
  tableName: 'bookreturns',
  timestamps: true,
  underscored: true
});

module.exports = BookReturn;
