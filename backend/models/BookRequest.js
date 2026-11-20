const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Book = require('./Book');
const User = require('./User');

const BookRequest = sequelize.define('BookRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  book_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Book,
      key: 'id'
    }
  },
  requester_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  request_type: {
    type: DataTypes.ENUM('donate', 'exchange', 'adopt', 'buy'),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  offered_book_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  id_document_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'completed'),
    defaultValue: 'pending'
  },
  pickup_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  pickup_time: {
    type: DataTypes.STRING(10),
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = BookRequest;
