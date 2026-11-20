import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { FaBell, FaCheck, FaCheckDouble } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api/axios';

const notificationTypeConfig = {
  request: { label: 'Request', bg: 'primary' },
  approved: { label: 'Approved', bg: 'success' },
  rejected: { label: 'Rejected', bg: 'danger' },
  coin_update: { label: 'Coin', bg: 'warning' },
  system: { label: 'System', bg: 'secondary' },
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(`/notifications?page=${page}&limit=20`);
      setNotifications(data.notifications || []);
      setTotalPages(data.totalPages || 1);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      setError('There was a problem loading notifications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    setActionLoading(id);
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      toast.error('There was a problem marking as read');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    setActionLoading('all');
    try {
      await api.patch('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('There was a problem marking all as read');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && page === 1) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Notifications</h2>
        {unreadCount > 0 && (
          <Button
            variant="outline-primary"
            onClick={handleMarkAllAsRead}
            disabled={actionLoading === 'all'}
          >
            <FaCheckDouble className="me-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {error ? (
        <Alert variant="danger">{error}</Alert>
      ) : notifications.length === 0 ? (
        <Card className="text-center p-5">
          <FaBell size={64} className="text-muted mb-3" />
          <h4>No notifications</h4>
          <p className="text-muted mb-0">You have no notifications</p>
        </Card>
      ) : (
        <>
          <Card className="mb-4">
            <Card.Body className="p-0">
              {notifications.map((notification) => {
                const type = notificationTypeConfig[notification.type] || notificationTypeConfig.system;
                return (
                  <div
                    key={notification.id}
                    className={`p-3 border-bottom ${
                      !notification.is_read ? 'bg-light' : ''
                    }`}
                    style={{ cursor: notification.is_read ? 'default' : 'pointer' }}
                    onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          {!notification.is_read && (
                            <span
                              className="bg-primary rounded-circle"
                              style={{ width: 8, height: 8 }}
                            />
                          )}
                          <span className="fw-bold">{notification.title}</span>
                          <Badge bg={type.bg} pill>
                            {type.label}
                          </Badge>
                        </div>
                        <p className="mb-1 text-muted">{notification.message}</p>
                        <small className="text-muted">
                          {new Date(notification.createdAt).toLocaleString('bn-BD')}
                        </small>
                      </div>
                      {!notification.is_read && (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                          disabled={actionLoading === notification.id}
                        >
                          <FaCheck />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </Card.Body>
          </Card>

          {totalPages > 1 && (
            <div className="d-flex justify-content-center gap-2">
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="d-flex align-items-center px-3">
                Page {page} / {totalPages}
              </span>
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </Container>
  );
}