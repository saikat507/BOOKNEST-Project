# BookNest

A full-stack booksharing platform built with MERN stack (MySQL, Express, React, Node.js) for sharing, exchanging, and trading books within a community.

## 📚 Project Overview

BookNest is a Bengali-language booksharing platform that enables users to:
- **Donate** unwanted books (+20 Coin reward)
- **Exchange** books with other users (+15 Coin for both parties)
- **Adopt** books temporarily (with deposit refund)
- **Sell** books for coins
- Coin-based economy system
- Admin moderation system

---

## 🛠 Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.5 | UI Framework |
| Vite | 8.0.10 | Build Tool |
| React Bootstrap | 2.10.10 | UI Components |
| React Router DOM | 7.14.2 | Client-side Routing |
| Axios | 1.15.2 | HTTP Client |
| Socket.io Client | 4.8.3 | Real-time Communication |
| React Hook Form | 7.73.1 | Form Management |
| React Toastify | 11.1.0 | Toast Notifications |
| React Icons | 5.6.0 | Icon Library |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Express | 5.2.1 | Web Framework |
| MySQL2 | 3.22.2 | Database Driver |
| Sequelize | 6.37.8 | ORM |
| Socket.io | 4.8.3 | Real-time Communication |
| JWT | 9.0.3 | Authentication |
| bcryptjs | 3.0.3 | Password Hashing |
| Cloudinary | 2.9.0 | Image Storage |
| Nodemailer | 8.0.5 | Email Sending |
| Multer | 2.1.1 | File Upload |
| Express Rate Limit | 8.4.0 | Rate Limiting |
| CORS | 2.8.6 | Cross-Origin Resource Sharing |

---

## 📁 Project Structure

```
BookNest/
├── frontend/                     # React + Vite Frontend
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js       # Axios client with interceptors
│   │   ├── components/
│   │   │   ├── AdminRoute.jsx
│   │   │   ├── BookCard.jsx
│   │   │   ├── CoinBadge.jsx
│   │   │   ├── IDUploadForm.jsx
│   │   │   ├─�� Navbar.jsx
│   │   │   ├── NotificationBell.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── RequestModal.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   ├── CoinContext.jsx
│   │   │   └── SocketContext.jsx
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   └── Dashboard.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── BookListing.jsx
│   │   │   ├── BookDetail.jsx
│   │   │   ├── AddBook.jsx
│   │   │   ├── MyBooks.jsx
│   │   │   ├── MyRequests.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Wallet.jsx
│   │   │   ├── Chat.jsx
│   │   │   ├── Notifications.jsx
│   │   │   ├── ManageBooks.jsx
│   │   │   ├── ManageRequests.jsx
│   │   │   └── ManageUsers.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env
│   ├── vite.config.js
│   └── package.json
│
├── backend/                     # Express.js Backend
│   ├── config/
│   │   ├── database.js         # Sequelize MySQL config
│   │   └── cloudinary.js      # Cloudinary config
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── bookController.js
│   │   ├── requestController.js
│   │   ├── coinController.js
│   │   ├── chatController.js
│   │   ├── notificationController.js
│   │   ├── reviewController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── role.middleware.js
│   │   ├── errorHandler.js
│   │   └── upload.middleware.js
│   ├── models/
│   │   ├── index.js
│   │   ├── User.js
│   │   ├── Book.js
│   │   ├── BookRequest.js
│   │   ├── Notification.js
│   │   ├── Transaction.js
│   │   ├── CoinLedger.js
│   │   ├── Chat.js
│   │   └── Review.js
│   ├��─ routes/
│   │   ├── auth.routes.js
│   │   ├── book.routes.js
│   │   ├── request.routes.js
│   │   ├── coin.routes.js
│   │   ├── chat.routes.js
│   │   ├── notification.routes.js
│   │   ├── review.routes.js
│   │   └── admin.routes.js
│   ├── socket/
│   │   └── chatSocket.js
│   ├── utils/
│   │   ├── coinService.js
│   │   ├── generateOTP.js
│   │   └── sendEmail.js
│   ├── index.js
│   ├── package.json
│   └── .env.example
│
└── README.md
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd BookNest
```

### 2. Setup Backend
```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration
# - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
# - JWT_SECRET
# - CLOUDINARY credentials
# - EMAIL credentials
```

### 3. Setup Frontend
```bash
cd ../frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration
# - VITE_API_URL=http://localhost:5000/api
# - VITE_SOCKET_URL=http://localhost:5000
```

### 4. Create Database
```sql
CREATE DATABASE booknest;
```

### 5. Run the Application

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

---

## ⚙️ Environment Variables

### Backend (.env)
```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=booknest
DB_USER=root
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Coin System
INITIAL_COIN_AMOUNT=50
DONATE_REWARD_COIN=20
EXCHANGE_REWARD_COIN=15
ADOPT_DEPOSIT_COIN=30
SELL_REWARD_COIN=0
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 🔐 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | User registration | No |
| POST | `/login` | User login | No |
| POST | `/forgot-password` | Request password reset | No |
| POST | `/reset-password` | Reset password with OTP | No |
| GET | `/me` | Get current user | Yes |

**Register Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "01XXXXXXXXX"
}
```

**Login Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Register/Login Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "coin_balance": 50
  }
}
```

---

### Books (`/api/books`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List all books | No |
| GET | `/:id` | Get book details | No |
| GET | `/my` | Get user's books | Yes |
| POST | `/` | Create new book | Yes |
| PUT | `/:id` | Update book | Yes |
| DELETE | `/:id` | Delete book | Yes |

**Create Book Request (multipart/form-data):**
```
listing_type: donate|exchange|adopt|sell
title: Book Title
author: Author Name
genre: fiction|non-fiction|academic|children|technology|science|history|religion|other
condition: new|good|fair|poor
description: Book description
cover_image: (file)
pickup_location: Location
price: (number, for sell)
coin_required: (number, for adopt/sell)
return_days: (number, for adopt)
```

**Book List Response:**
```json
{
  "success": true,
  "books": [...],
  "total": 100,
  "page": 1,
  "totalPages": 10,
  "limit": 12
}
```

---

### Requests (`/api/requests`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create request | Yes |
| GET | `/my` | Get user's requests | Yes |
| GET | `/book/:bookId` | Get requests for book | Yes |
| PUT | `/:requestId/approve` | Approve request | Yes |
| PUT | `/:requestId/reject` | Reject request | Yes |
| PUT | `/:requestId/complete` | Complete transaction | Yes |

**Create Request:**
```json
{
  "book_id": 1,
  "request_type": "donate|exchange|adopt|buy",
  "message": "I'm interested!",
  "offered_book_id": 2
}
```

---

### Coins (`/api/coins`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/balance` | Get coin balance | Yes |
| GET | `/ledger` | Get transaction history | Yes |

---

### Notifications (`/api/notifications`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Get notifications | Yes |
| PUT | `/:id/read` | Mark as read | Yes |
| PUT | `/read-all` | Mark all as read | Yes |

---

### Chat (`/api/chat`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/conversations` | Get conversations | Yes |
| GET | `/:userId` | Get messages | Yes |
| POST | `/` | Send message | Yes |

---

### Admin (`/api/admin`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/stats` | Dashboard stats | Admin |
| GET | `/users` | List users | Admin |
| PUT | `/users/:userId/block` | Toggle block | Admin |
| PUT | `/users/:userId/verify` | Verify user | Admin |
| GET | `/books` | List all books | Admin |
| DELETE | `/books/:bookId` | Delete book | Admin |
| POST | `/coins/award` | Award coins | Admin |

---

## 💾 Database Schema

### User Model
| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER | Primary Key |
| name | STRING(100) | User's name |
| email | STRING(150) | Unique email |
| password_hash | STRING(255) | Bcrypt hash |
| phone | STRING(20) | Phone number |
| role | ENUM | user, verified_user, moderator, admin |
| coin_balance | INTEGER | Current coins (default: 50) |
| is_verified | BOOLEAN | Verification status |
| is_active | BOOLEAN | Account status |
| national_id_url | STRING(500) | ID document URL |
| profile_image_url | STRING(500) | Profile image |

### Book Model
| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER | Primary Key |
| user_id | INTEGER | Owner FK |
| title | STRING(200) | Book title |
| author | STRING(150) | Author name |
| genre | STRING(100) | Book genre |
| condition | ENUM | new, good, fair, poor |
| description | TEXT | Book description |
| cover_image_url | STRING(500) | Cover image |
| listing_type | ENUM | donate, exchange, adopt, sell |
| price | DECIMAL | Price for sell |
| coin_required | INTEGER | Required coins |
| pickup_location | STRING(300) | Meeting location |
| status | ENUM | available, pending, completed, closed |

### BookRequest Model
| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER | Primary Key |
| book_id | INTEGER | Book FK |
| requester_id | INTEGER | Requester FK |
| request_type | ENUM | donate, exchange, adopt, buy |
| status | ENUM | pending, approved, rejected, completed |
| offered_book_id | INTEGER | For exchange |
| id_document_url | STRING(500) | For adopt |

### Transaction Model
| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER | Primary Key |
| book_id | INTEGER | Book FK |
| giver_id | INTEGER | Owner FK |
| receiver_id | INTEGER | Recipient FK |
| request_id | INTEGER | Request FK |
| transaction_type | ENUM | donate, exchange, adopt, sell |
| coin_amount | INTEGER | Coins transferred |
| status | ENUM | ongoing, completed, overdue |

### CoinLedger Model
| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER | Primary Key |
| user_id | INTEGER | User FK |
| amount | INTEGER | Amount |
| type | ENUM | credit, debit |
| reason | ENUM | register_bonus, donate_reward, etc. |

### Notification Model
| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER | Primary Key |
| user_id | INTEGER | User FK |
| type | ENUM | request, approved, rejected, etc. |
| title | STRING | Title |
| message | TEXT | Message |
| is_read | BOOLEAN | Read status |

---

## 💰 Coin System

### Coin Rewards
| Action | Reward |
|--------|--------|
| Registration | +50 Coins |
| Donate Book | +20 Coins |
| Exchange Book | +15 Coins (both parties) |
| Review | +2 Coins |
| Admin Award | Variable |

### Coin Reasons
- `register_bonus` - Initial bonus
- `donate_reward` - Book donation
- `exchange_reward` - Book exchange
- `sell_reward` - Book sale
- `purchase` - Book purchase
- `adopt_deposit` - Adoption deposit
- `adopt_refund` - Adoption refund
- `admin_award` - Admin awarded

---

## 🔑 Authentication & Authorization

### JWT Token
- **Algorithm:** HS256
- **Payload:** `{ id, email, role }`
- **Expiry:** 7 days (default)

### Roles
| Role | Permissions |
|------|-------------|
| user | Basic access |
| verified_user | ID verified |
| moderator | Content moderation |
| admin | Full access |

### Middleware
1. **verifyToken** - Required authentication
2. **optionalAuth** - Optional authentication
3. **requireRole(...roles)** - Role-based access

---

## 📡 Socket.io Events

### Client → Server

| Event | Data | Description |
|-------|------|-------------|
| `send_message` | `{ receiverId, message, bookId }` | Send message |
| `typing` | `{ receiverId, isTyping }` | Typing indicator |
| `mark_read` | `{ senderId }` | Mark messages read |

### Server → Client

| Event | Data | Description |
|-------|------|-------------|
| `receive_message` | Message object | New message |
| `message_sent` | Message with ID | Confirmation |
| `user_typing` | `{ senderId, isTyping }` | Typing status |
| `messages_read` | `{ readBy, timestamp }` | Read confirmation |
| `coin_updated` | - | Coin balance changed |

---

## 🎨 Features

### Book Listing Types
1. **Donate** - Free donation (+20 Coin reward)
2. **Exchange** - Swap books (+15 Coin each)
3. **Adopt** - Temporary borrow (deposit refundable)
4. **Sell** - Sale for coins

### User Features
- Browse books with filters
- Request books
- Real-time chat
- Coin wallet
- Transaction history
- Notifications
- User reviews

### Admin Features
- Dashboard with stats
- User management
- Book management
- Request management
- Coin awards

---

## 📱 Pages

### Public Pages
- `/` - Home
- `/books` - Browse books
- `/books/:id` - Book details
- `/login` - Login
- `/register` - Register

### Protected Pages
- `/add-book` - Add new book
- `/my-books` - My books
- `/my-requests` - My requests
- `/profile` - Profile
- `/wallet` - Coin wallet
- `/chat` - Chat
- `/chat/:userId` - Direct chat
- `/notifications` - Notifications

### Admin Pages
- `/admin` - Dashboard
- `/admin/users` - Manage users
- `/admin/books` - Manage books
- `/admin/requests` - Manage requests
- `/admin/coins` - Coin management

---

## 🧪 Testing

### API Testing with curl

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","password":"123456","phone":"01XXXXXXXXX"}'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"123456"}'
```

**Get Books:**
```bash
curl http://localhost:5000/api/books
```

---

## 📄 License

ISC

---

## 👥 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📞 Support

For issues, please create an issue on GitHub.

## Security migration

Before starting the updated backend against an existing database, apply `backend/sql/add-password-reset-token.sql` to add the reset-token digest column. The backend intentionally does not use Sequelize `alter` sync to change production schemas automatically. Existing bcrypt password hashes remain supported; newly created and changed passwords use bcrypt cost 12 with SHA-256 prehashing to avoid bcrypt's 72-byte input limit.

Set `NODE_ENV=production` only behind a trusted HTTPS reverse proxy and configure that proxy to forward the original HTTPS protocol. Production API requests over HTTP are rejected. Login throttling currently uses process memory, so deployments with multiple backend instances should use a shared rate-limit store.

---

Built with ❤️ for book lovers in Bangladesh

