import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, Badge, Button, Card, Col, Nav, Row, Spinner, Table } from 'react-bootstrap';
import {
  FaBell,
  FaBook,
  FaChartLine,
  FaCog,
  FaExchangeAlt,
  FaExclamationTriangle,
  FaGift,
  FaHandHoldingHeart,
  FaHeart,
  FaList,
  FaMoneyBillWave,
  FaShoppingCart,
  FaSignOutAlt,
  FaUndo,
  FaUserCircle,
  FaUsers,
  FaWallet
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const sidebarItems = [
  { label: 'Dashboard', icon: FaChartLine, to: '/admin/dashboard' },
  { label: 'Users', icon: FaUsers, to: '/admin/users' },
  { label: 'Books', icon: FaBook, to: '/admin/books' },
  { label: 'Donations', icon: FaGift, to: '/admin/transactions?type=donate' },
  { label: 'Exchange Requests', icon: FaExchangeAlt, to: '/admin/requests?type=exchange' },
  { label: 'Adoption Requests', icon: FaHandHoldingHeart, to: '/admin/requests?type=adopt' },
  { label: 'Selling Books', icon: FaShoppingCart, to: '/admin/books?listing_type=sell' },
  { label: 'Book Returns', icon: FaUndo, to: '/admin/transactions?type=adopt' },
  { label: 'Reports', icon: FaExclamationTriangle, to: '/admin/reports' },
  { label: 'Wishlist', icon: FaHeart, to: '/admin/books' },
  { label: 'Transactions', icon: FaWallet, to: '/admin/transactions' },
  { label: 'Site Settings', icon: FaCog, to: '/admin/coins' }
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.get('/admin/stats');
      setStats(data.stats || {});
      setPendingVerifications(data.pendingVerifications || []);
      setRecentTransactions(data.recentTransactions || []);
    } catch (err) {
      toast.error('There was a problem loading admin dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const booksByType = useMemo(() => {
    const counts = { donate: 0, exchange: 0, adopt: 0, sell: 0 };
    (stats.booksByType || []).forEach((item) => {
      counts[item.listing_type] = Number(item.count) || 0;
    });
    return counts;
  }, [stats.booksByType]);

  const cards = [
    { label: 'Total Users', value: stats.totalUsers || 0, icon: FaUsers, tone: 'primary' },
    { label: 'Total Books', value: stats.totalBooks || 0, icon: FaBook, tone: 'success' },
    { label: 'Total Donations', value: booksByType.donate, icon: FaGift, tone: 'info' },
    { label: 'Total Exchanges', value: booksByType.exchange, icon: FaExchangeAlt, tone: 'warning' },
    { label: 'Total Adoptions', value: booksByType.adopt, icon: FaHandHoldingHeart, tone: 'secondary' },
    { label: 'Books for Sale', value: booksByType.sell, icon: FaShoppingCart, tone: 'dark' },
    { label: 'Coin Transactions', value: stats.coinCirculation?.issued || 0, icon: FaMoneyBillWave, tone: 'success' },
    { label: 'Pending Reports', value: stats.activeReports || 0, icon: FaExclamationTriangle, tone: 'danger' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const getStatusBadge = (status) => {
    const colors = {
      completed: 'success',
      ongoing: 'primary',
      pending: 'warning',
      overdue: 'danger',
      cancelled: 'secondary'
    };
    return <Badge bg={colors[status] || 'secondary'}>{status || 'unknown'}</Badge>;
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-logo">BN</span>
          <div>
            <strong>BookNest</strong>
            <small>Admin Console</small>
          </div>
        </div>
        <Nav className="admin-nav">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <Nav.Link as={Link} to={item.to} key={item.label}>
                <Icon />
                <span>{item.label}</span>
              </Nav.Link>
            );
          })}
          <button type="button" className="admin-logout" onClick={handleLogout}>
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </Nav>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-kicker">Dashboard</p>
            <h1>Admin Dashboard</h1>
          </div>
          <div className="admin-actions">
            <Button variant="light" className="icon-action" title="Notifications">
              <FaBell />
            </Button>
            <Button variant="light" className="admin-profile" onClick={() => navigate('/profile')}>
              <FaUserCircle />
              <span>{user?.name || 'Admin'}</span>
            </Button>
            <Button variant="outline-danger" onClick={handleLogout}>
              <FaSignOutAlt className="me-2" />
              Logout
            </Button>
          </div>
        </header>

        {loading ? (
          <div className="admin-loading">
            <Spinner animation="border" />
          </div>
        ) : (
          <div className="admin-content">
            <Row className="g-3">
              {cards.map((card) => {
                const Icon = card.icon;
                return (
                  <Col xxl={3} lg={4} sm={6} key={card.label}>
                    <Card className="metric-card">
                      <Card.Body>
                        <div className={`metric-icon text-${card.tone}`}>
                          <Icon />
                        </div>
                        <div>
                          <p>{card.label}</p>
                          <strong>{card.value}</strong>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>

            <Row className="g-4 mt-1">
              <Col xl={7}>
                <Card className="admin-panel">
                  <Card.Header>
                    <div>
                      <h2>Recent Activity</h2>
                      <span>Latest transactions across donations, exchanges, adoptions, and sales</span>
                    </div>
                    <Link to="/admin/transactions" className="btn btn-sm btn-outline-primary">
                      View all
                    </Link>
                  </Card.Header>
                  <Card.Body>
                    {recentTransactions.length === 0 ? (
                      <Alert variant="info">No recent activity found.</Alert>
                    ) : (
                      <Table responsive hover className="align-middle mb-0">
                        <thead>
                          <tr>
                            <th>Book</th>
                            <th>Type</th>
                            <th>Users</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentTransactions.slice(0, 8).map((tx) => (
                            <tr key={tx.id}>
                              <td>{tx.book?.title || 'Untitled book'}</td>
                              <td><Badge bg="light" text="dark">{tx.transaction_type}</Badge></td>
                              <td>{tx.giver?.name || 'N/A'} to {tx.receiver?.name || 'N/A'}</td>
                              <td>{getStatusBadge(tx.status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                  </Card.Body>
                </Card>
              </Col>

              <Col xl={5}>
                <Card className="admin-panel">
                  <Card.Header>
                    <div>
                      <h2>Pending Verification</h2>
                      <span>Users waiting for ID review</span>
                    </div>
                    <Link to="/admin/verifications" className="btn btn-sm btn-outline-primary">
                      Review
                    </Link>
                  </Card.Header>
                  <Card.Body>
                    {pendingVerifications.length === 0 ? (
                      <Alert variant="success">No pending verifications.</Alert>
                    ) : (
                      <div className="verification-list">
                        {pendingVerifications.slice(0, 6).map((item) => (
                          <div className="verification-row" key={item.verification_id || item.id}>
                            <div>
                              <strong>{item.name}</strong>
                              <span>{item.email}</span>
                            </div>
                            <Badge bg="warning" text="dark">Pending</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </main>

      <style>{`
        .admin-shell {
          min-height: 100vh;
          background: #f4f6f8;
          color: #17202a;
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr);
        }
        .admin-sidebar {
          background: #111827;
          color: #f9fafb;
          padding: 22px 16px;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
        }
        .admin-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 6px 8px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
          margin-bottom: 16px;
        }
        .admin-logo {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          background: #16a34a;
          color: white;
          font-weight: 800;
        }
        .admin-brand strong,
        .admin-brand small {
          display: block;
        }
        .admin-brand small {
          color: #9ca3af;
          font-size: 0.78rem;
        }
        .admin-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .admin-nav a,
        .admin-logout {
          width: 100%;
          min-height: 42px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #d1d5db;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          text-align: left;
          text-decoration: none;
        }
        .admin-nav a:hover,
        .admin-logout:hover {
          background: rgba(255, 255, 255, 0.08);
          color: white;
        }
        .admin-logout {
          margin-top: 12px;
          color: #fecaca;
        }
        .admin-main {
          min-width: 0;
        }
        .admin-topbar {
          min-height: 84px;
          background: white;
          border-bottom: 1px solid #e5e7eb;
          padding: 18px 28px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }
        .admin-kicker {
          margin: 0;
          color: #16a34a;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.76rem;
        }
        .admin-topbar h1 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 800;
        }
        .admin-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .icon-action,
        .admin-profile {
          border: 1px solid #e5e7eb;
        }
        .admin-profile {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .admin-content {
          padding: 24px 28px;
        }
        .admin-loading {
          min-height: 60vh;
          display: grid;
          place-items: center;
        }
        .metric-card,
        .admin-panel {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
        }
        .metric-card .card-body {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .metric-icon {
          width: 46px;
          height: 46px;
          border-radius: 8px;
          background: #f3f4f6;
          display: grid;
          place-items: center;
          font-size: 1.25rem;
          flex: 0 0 auto;
        }
        .metric-card p {
          margin: 0;
          color: #6b7280;
          font-size: 0.9rem;
        }
        .metric-card strong {
          font-size: 1.55rem;
          line-height: 1.1;
        }
        .admin-panel .card-header {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }
        .admin-panel h2 {
          font-size: 1rem;
          margin: 0;
          font-weight: 800;
        }
        .admin-panel span {
          color: #6b7280;
          font-size: 0.86rem;
        }
        .verification-list {
          display: grid;
          gap: 10px;
        }
        .verification-row {
          min-height: 54px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 10px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }
        .verification-row strong,
        .verification-row span {
          display: block;
        }
        @media (max-width: 991px) {
          .admin-shell {
            grid-template-columns: 1fr;
          }
          .admin-sidebar {
            position: static;
            height: auto;
          }
          .admin-nav {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .admin-topbar {
            align-items: flex-start;
            flex-direction: column;
          }
        }
        @media (max-width: 575px) {
          .admin-nav {
            grid-template-columns: 1fr;
          }
          .admin-content,
          .admin-topbar {
            padding-left: 16px;
            padding-right: 16px;
          }
        }
      `}</style>
    </div>
  );
}
