const sequelize = require('../config/database');
const User = require('./User');
const Book = require('./Book');
const BookRequest = require('./BookRequest');
const Transaction = require('./Transaction');
const CoinLedger = require('./CoinLedger');
const Notification = require('./Notification');
const Review = require('./Review');
const BookReturn = require('./BookReturn');
const UserVerification = require('./UserVerification');
const Report = require('./Report');
const AdminSetting = require('./AdminSetting');
const BanHistory = require('./BanHistory');

// Define all associations centrally with consistent aliases

// === User associations ===
User.hasMany(Book, { foreignKey: 'user_id', as: 'books' });
User.hasMany(BookRequest, { foreignKey: 'requester_id', as: 'requests' });
User.hasMany(Transaction, { foreignKey: 'giver_id', as: 'givenTransactions' });
User.hasMany(Transaction, { foreignKey: 'receiver_id', as: 'receivedTransactions' });
User.hasMany(CoinLedger, { foreignKey: 'user_id', as: 'coinEntries' });
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
User.hasMany(Review, { foreignKey: 'reviewer_id', as: 'givenReviews' });
User.hasMany(Review, { foreignKey: 'reviewed_user_id', as: 'receivedReviews' });
User.hasMany(UserVerification, { foreignKey: 'user_id', as: 'verifications' });
User.hasMany(Report, { foreignKey: 'reporter_id', as: 'submittedReports' });
User.hasMany(Report, { foreignKey: 'reported_user_id', as: 'receivedReports' });
User.hasMany(BanHistory, { foreignKey: 'user_id', as: 'banHistory' });

// === Book associations ===
Book.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });
Book.hasMany(BookRequest, { foreignKey: 'book_id', as: 'requests' });
Book.hasMany(Transaction, { foreignKey: 'book_id', as: 'transactions' });
Book.hasMany(Review, { foreignKey: 'book_id', as: 'reviews' });

// === BookRequest associations ===
BookRequest.belongsTo(Book, { foreignKey: 'book_id', as: 'book' });
BookRequest.belongsTo(User, { foreignKey: 'requester_id', as: 'requester' });

// === Transaction associations ===
Transaction.belongsTo(Book, { foreignKey: 'book_id', as: 'book' });
Transaction.belongsTo(User, { foreignKey: 'giver_id', as: 'giver' });
Transaction.belongsTo(User, { foreignKey: 'receiver_id', as: 'receiver' });
Transaction.hasOne(BookReturn, { foreignKey: 'transaction_id', as: 'bookReturn' });
Transaction.hasMany(Report, { foreignKey: 'transaction_id', as: 'reports' });

// === BookReturn associations ===
BookReturn.belongsTo(Transaction, { foreignKey: 'transaction_id', as: 'transaction' });

// === CoinLedger associations ===
CoinLedger.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// === Report associations ===
Report.belongsTo(User, { foreignKey: 'reporter_id', as: 'reporter' });
Report.belongsTo(User, { foreignKey: 'reported_user_id', as: 'reported_user' });
Report.belongsTo(Book, { foreignKey: 'book_id', as: 'book' });
Report.belongsTo(Transaction, { foreignKey: 'transaction_id', as: 'transaction' });
Report.belongsTo(User, { foreignKey: 'resolved_by', as: 'resolver' });

// === Admin setting / ban history associations ===
AdminSetting.belongsTo(User, { foreignKey: 'updated_by', as: 'updatedBy' });
BanHistory.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
BanHistory.belongsTo(User, { foreignKey: 'admin_id', as: 'admin' });

// === Notification associations ===
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// === Review associations ===
Review.belongsTo(User, { foreignKey: 'reviewer_id', as: 'reviewer' });
Review.belongsTo(User, { foreignKey: 'reviewed_user_id', as: 'reviewedUser' });
Review.belongsTo(Book, { foreignKey: 'book_id', as: 'book' });

// Sync all tables with the database (force = false means don't drop tables)
sequelize.sync({ alter: false })
  .then(() => {
    console.log('All models were synchronized successfully.');
  })
  .catch(err => {
    console.error('Error syncing models:', err);
  });

// Export all models and sequelize
module.exports = {
  sequelize,
  User,
  Book,
  BookRequest,
  Transaction,
  CoinLedger,
  Notification,
  Review,
  BookReturn,
  UserVerification,
  Report,
  AdminSetting,
  BanHistory
};
