import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from './context/AuthContext';
import { CoinProvider } from './context/CoinContext';

import Home from './pages/Home';
import Login from './pages/Login';
import AdminLogin from './pages/admin/Login';
import Register from './pages/Register';
import PasswordReset from './pages/PasswordReset';
import BookListing from './pages/BookListing';
import BookDetail from './pages/BookDetail';
import AddBook from './pages/AddBook';
import MyBooks from './pages/MyBooks';
import History from './pages/History';
import MyListedBooks from './pages/MyListedBooks';
import MyBorrowedBooks from './pages/MyBorrowedBooks';
import MyRequests from './pages/MyRequests';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import Wallet from './pages/Wallet';
import Notifications from './pages/Notifications';
import AdminDashboard from './pages/admin/Dashboard';
import ManageUsers from './pages/ManageUsers';
import ManageBooks from './pages/ManageBooks';
import ManageRequests from './pages/ManageRequests';
import CoinManagement from './pages/CoinManagement';
import AdminVerifications from './pages/admin/Verifications';
import AdminTransactions from './pages/admin/Transactions';
import AdminReports from './pages/admin/Reports';
import AdminUserDetail from './pages/admin/UserDetail';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

function AppRoutes() {
  const location = useLocation();
  const isAdminArea = location.pathname.startsWith('/admin') && location.pathname !== '/admin/login';

  return (
    <>
      {!isAdminArea && <Navbar />}
      <Container fluid={isAdminArea} className={isAdminArea ? 'p-0' : 'mt-4'}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/books" element={<BookListing />} />
          <Route path="/books/:id" element={<BookDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<PasswordReset />} />

          <Route
            path="/add-book"
            element={
              <ProtectedRoute>
                <AddBook />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-books"
            element={
              <ProtectedRoute>
                <MyBooks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-listed-books"
            element={
              <ProtectedRoute>
                <MyListedBooks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-borrowed-books"
            element={
              <ProtectedRoute>
                <MyBorrowedBooks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-requests"
            element={
              <ProtectedRoute>
                <MyRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users/:id"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                <Wallet />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />

          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <ManageUsers />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users/:userId"
            element={
              <AdminRoute>
                <AdminUserDetail />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/verifications"
            element={
              <AdminRoute>
                <AdminVerifications />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/books"
            element={
              <AdminRoute>
                <ManageBooks />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/requests"
            element={
              <AdminRoute>
                <ManageRequests />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/transactions"
            element={
              <AdminRoute>
                <AdminTransactions />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <AdminRoute>
                <AdminReports />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/coins"
            element={
              <AdminRoute>
                <CoinManagement />
              </AdminRoute>
            }
          />
        </Routes>
      </Container>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <CoinProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <ToastContainer position="top-right" autoClose={3000} />
      </CoinProvider>
    </AuthProvider>
  );
}

export default App;
