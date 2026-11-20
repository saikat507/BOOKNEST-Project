const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Book = sequelize.define('Book', {
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
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  author: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  genre: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  condition: {
    type: DataTypes.ENUM('new', 'good', 'fair', 'poor'),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cover_image_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  listing_type: {
    type: DataTypes.ENUM('donate', 'exchange', 'adopt', 'sell'),
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  coin_required: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  pickup_location: {
    type: DataTypes.STRING(300),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('available', 'pending', 'completed', 'closed'),
    defaultValue: 'available'
  },
  return_days: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = Book;
