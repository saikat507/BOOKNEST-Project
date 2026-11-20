import { Navbar as BSNavbar, Nav, Container, Button, Dropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaBook, FaHandshake, FaWallet, FaUser, FaSignOutAlt, FaCog, FaHistory, FaListAlt, FaUndo } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import CoinBadge from './CoinBadge';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <BSNavbar bg="dark" variant="dark" expand="lg" className="navbar-dark sticky-top">
      <Container>
        <BSNavbar.Brand as={Link} to="/" className="d-flex align-items-center gap-2 fw-bold">
          <span style={{ fontSize: '1.8rem' }}>📚</span>
          <span className="brand-text">BookNest</span>
        </BSNavbar.Brand>
        <BSNavbar.Toggle aria-controls="navbar-nav" />
        <BSNavbar.Collapse id="navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/" className="nav-link-custom">
              Home
            </Nav.Link>
            <Nav.Link as={Link} to="/books" className="nav-link-custom">
              Browse Books
            </Nav.Link>
          </Nav>
          {isAuthenticated ? (
            <Nav className="align-items-center">
              <Nav.Item className="me-3">
                <CoinBadge />
              </Nav.Item>
              <Nav.Item className="me-3">
                <NotificationBell />
              </Nav.Item>
              {user?.role === 'admin' && (
                <Dropdown align="end" className="me-3">
                  <Dropdown.Toggle variant="outline-warning" id="admin-dropdown" className="admin-btn">
                    <FaCog className="me-2" />Admin
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="admin-menu">
                    <Dropdown.Item as={Link} to="/admin/dashboard" className="menu-item">
                      Dashboard
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/admin/users" className="menu-item">
                      Manage Users
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/admin/verifications" className="menu-item">
                      ID Verifications
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/admin/books" className="menu-item">
                      Manage Books
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/admin/requests" className="menu-item">
                      Manage Requests
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/admin/transactions" className="menu-item">
                      Transactions
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/admin/reports" className="menu-item">
                      Reports
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/admin/coins" className="menu-item">
                      Coin Management
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              )}
              <Dropdown align="end">
                <Dropdown.Toggle variant="outline-light" id="user-dropdown" className="user-btn">
                  {user?.name?.split(' ')[0]}
                </Dropdown.Toggle>
                <Dropdown.Menu className="user-menu">
                  <Dropdown.Item as={Link} to="/my-books" className="menu-item">
                    <FaBook className="me-2" /> My Books
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/history" className="menu-item">
                    <FaHistory className="me-2" /> History
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/my-listed-books" className="menu-item">
                    <FaListAlt className="me-2" /> My Listed Books
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/my-borrowed-books" className="menu-item">
                    <FaUndo className="me-2" /> My Borrowed Books
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/my-requests" className="menu-item">
                    <FaHandshake className="me-2" /> My Requests
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/wallet" className="menu-item">
                    <FaWallet className="me-2" /> Wallet
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/profile" className="menu-item">
                    <FaUser className="me-2" /> Profile
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout} className="menu-item text-danger">
                    <FaSignOutAlt className="me-2" /> Logout
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Nav>
          ) : (
            <Nav>
              <Button variant="outline-light" as={Link} to="/login" className="me-2 login-btn">
                Login
              </Button>
              <Button variant="success" as={Link} to="/register" className="register-btn">
                Register
              </Button>
            </Nav>
          )}
        </BSNavbar.Collapse>
      </Container>
      <style>{`
        .brand-text {
          background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 50%, #CDDC39 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .nav-link-custom {
          position: relative;
          transition: all 0.3s ease;
        }
        .nav-link-custom::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 50%;
          width: 0;
          height: 2px;
          background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%);
          transition: all 0.3s ease;
          transform: translateX(-50%);
        }
        .nav-link-custom:hover::after,
        .nav-link-custom.active::after {
          width: 100%;
        }
        .admin-btn, .user-btn {
          border-radius: 50px;
          transition: all 0.3s ease;
        }
        .admin-btn:hover {
          background: linear-gradient(135deg, #F57F17 0%, #FFB300 100%);
          border-color: transparent;
          color: white;
        }
        .user-btn:hover {
          background: linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%);
          border-color: transparent;
          color: white;
        }
        .login-btn {
          border-radius: 50px;
          transition: all 0.3s ease;
        }
        .login-btn:hover {
          background: transparent;
          border-color: #4CAF50;
          color: #4CAF50;
        }
        .register-btn {
          border-radius: 50px;
          background: linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%);
          border: none;
          transition: all 0.3s ease;
        }
        .register-btn:hover {
          background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);
        }
        .menu-item {
          transition: all 0.2s ease;
          border-radius: 8px;
          margin: 2px 8px;
        }
        .menu-item:hover {
          background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(139, 195, 74, 0.1) 100%);
        }
        .dropdown-menu {
          border-radius: 16px;
          border: none;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
          padding: 8px;
        }
      `}</style>
    </BSNavbar>
  );
}
