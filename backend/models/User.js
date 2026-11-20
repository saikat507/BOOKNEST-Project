const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('admin', 'moderator', 'verified_user', 'user'),
    defaultValue: 'user'
  },
  verification_status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: true
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  coin_balance: {
    type: DataTypes.INTEGER,
    defaultValue: 50,
    allowNull: false
  },
  profile_image_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  facebook_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  address: {
    type: DataTypes.STRING(300),
    allowNull: true
  },
  profession: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  institute: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  ban_status: {
    type: DataTypes.ENUM('none', 'blocked', 'banned'),
    defaultValue: 'none'
  },
  ban_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  banned_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  otp: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  otp_expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  password_reset_token_hash: {
    type: DataTypes.STRING(64),
    allowNull: true
  }
}, {
  timestamps: true,
  defaultScope: {
    attributes: {
      exclude: ['otp', 'otp_expires_at', 'password_reset_token_hash']
    }
  },
  scopes: {
    withOtp: {
      attributes: {
        include: ['otp', 'otp_expires_at']
      }
    },
    withPassword: {
      attributes: {
        include: ['password_hash']
      }
    },
    withPasswordAndOtp: {
      attributes: {
        include: ['password_hash', 'otp', 'otp_expires_at']
      }
    }
  }
});

// Instance method to return user data without sensitive fields
User.prototype.toSafeObject = function() {
  const user = this.toJSON();
  delete user.password_hash;
  delete user.otp;
  delete user.otp_expires_at;
  delete user.password_reset_token_hash;
  return user;
};

module.exports = User;
