const { ValidationError, UniqueConstraintError } = require('sequelize');
const jwt = require('jsonwebtoken');

const errorHandler = (err, req, res, next) => {
  // Log error in development mode
  if (process.env.NODE_ENV === 'development') {
    if (req.path.startsWith('/api/auth')) console.error('Authentication endpoint error:', err.name || 'Error');
    else console.error('Error:', err);
  }

  let statusCode = 500;
  let message = 'Internal server error';
  let errors = [];

  // Sequelize Validation Error
  if (err instanceof ValidationError) {
    statusCode = 400;
    message = 'Validation error';
    errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
  }
  // Sequelize Unique Constraint Error
  else if (err instanceof UniqueConstraintError) {
    statusCode = 409;
    message = 'Record already exists';
    errors = err.errors.map(e => ({
      field: e.path,
      message: `${e.path} already exists`
    }));
  }
  // JWT JsonWebTokenError
  else if (err instanceof jwt.JsonWebTokenError) {
    statusCode = 401;
    message = 'Invalid token';
  }
  // JWT TokenExpiredError
  else if (err instanceof jwt.TokenExpiredError) {
    statusCode = 401;
    message = 'Token expired';
  }
  // Multer file upload errors
  else if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'FILE_TOO_LARGE' || err.code === 'LIMIT_FILE_SIZE') {
      message = 'File is too large';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field';
    } else {
      message = err.message || 'File upload error';
    }
  }
  // Custom file type validation error
  else if (err.message && err.message.includes('Only')) {
    statusCode = 400;
    message = err.message;
  }
  // Default error
  else {
    statusCode = err.statusCode || 500;
    message = err.message || 'Internal server error';
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message: message,
    errors: errors
  });
};

module.exports = { errorHandler };
