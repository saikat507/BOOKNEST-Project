const express = require('express');
const http = require('http');
const cors = require('cors');
require('dotenv').config();

// Import models and trigger Sequelize sync
const { sequelize } = require('./models');

// Import route files
const authRoutes = require('./routes/auth.routes');
const bookRoutes = require('./routes/book.routes');
const requestRoutes = require('./routes/request.routes');
const coinRoutes = require('./routes/coin.routes');
const notificationRoutes = require('./routes/notification.routes');
const reviewRoutes = require('./routes/review.routes');
const adminRoutes = require('./routes/admin.routes');
const userRoutes = require('./routes/user.routes');
const returnRoutes = require('./routes/return.routes');
const reportRoutes = require('./routes/report.routes');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');

// Initialize Express app
const app = express();

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
  app.use((req, res, next) => {
    if (!req.secure) return res.status(426).json({ success: false, message: 'HTTPS is required.' });
    next();
  });
}

// Create HTTP server
const server = http.createServer(app);

// Middleware setup
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/coins', coinRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/bookreturns', returnRoutes);
app.use('/api/reports', reportRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'BookNest API running',
    timestamp: new Date(),
    environment: process.env.NODE_ENV
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Get port from environment
const PORT = process.env.PORT || 5000;

// Start server
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║     BookNest Backend Server Started    ║
╚════════════════════════════════════════╝
  
  📚 Server: http://localhost:${PORT}
  🔌 Socket.io: ws://localhost:${PORT}
  🌍 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}
  🗄️  Database: ${process.env.DB_NAME}
  📦 Environment: ${process.env.NODE_ENV}
  
  Waiting for connections...
  `);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Shutting down BookNest server...');
  
  try {
    await sequelize.close();
    console.log('✓ Database connection closed');
  } catch (error) {
    console.error('Error closing database:', error);
  }
  
  server.close(() => {
    console.log('✓ Server closed');
    process.exit(0);
  });
});

module.exports = app;
