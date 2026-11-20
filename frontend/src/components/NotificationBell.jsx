import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge, Popover, Button, Overlay } from 'react-bootstrap';
import { FaBell, FaHandshake, FaCoins, FaCheck, FaExclamation } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const notificationIcons = {
  request: FaHandshake,
  approved: FaCheck,
  rejected: FaExclamation,
  coin_update: FaCoins,
  pickup_reminder: FaBell,
  message: FaBell,
  system: FaExclamation,
};

const formatTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
};

export default function NotificationBell() {
  const { user } = useAuth();
  const target = useRef(null);
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [show, setShow] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const data = await api.get('/notifications?limit=5');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.is_read) {
        await api.patch(`/notifications/${notification.id}/read`);
      }
      setShow(false);
      fetchNotifications();

      // Navigate based on notification type
      if (notification.type === 'request' || notification.type === 'approved' || notification.type === 'rejected') {
        navigate('/my-requests');
      } else if (notification.type === 'coin_update') {
        navigate('/wallet');
      } else {
        navigate('/notifications');
      }
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  return (
    <>
      <Button
        ref={target}
        variant="link"
        className="position-relative p-0 text-light"
        onClick={() => setShow(!show)}
      >
        <FaBell size={20} />
        {unreadCount > 0 && (
          <Badge
            bg="danger"
            pill
            className="position-absolute top-0 start-100 translate-middle"
            style={{ fontSize: '0.65rem' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>
      <Overlay
        show={show}
        target={target.current}
        placement="bottom-end"
        rootClose
        onHide={() => setShow(false)}
      >
        <Popover id="notifications-popover" style={{ maxWidth: 350, width: 350 }}>
          <Popover.Header className="d-flex justify-content-between align-items-center">
            <strong>Notifications</strong>
            {unreadCount > 0 && (
              <Button
                variant="link"
                size="sm"
                className="p-0"
                onClick={handleMarkAllRead}
              >
                All read
              </Button>
            )}
          </Popover.Header>
          <Popover.Body className="p-0" style={{ maxHeight: 400, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div className="text-center text-muted p-3">No notifications</div>
            ) : (
              notifications.map((notification) => {
                const IconComponent = notificationIcons[notification.type] || FaBell;
                return (
                  <div
                    key={notification.id}
                    className={`p-3 border-bottom notification-item ${
                      !notification.is_read ? 'bg-light' : ''
                    }`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="d-flex gap-2">
                      <IconComponent
                        size={16}
                        className={`mt-1 ${
                          notification.type === 'system'
                            ? 'text-warning'
                            : 'text-primary'
                        }`}
                      />
                      <div className="flex-grow-1 overflow-hidden">
                        <div className="fw-bold small">{notification.title}</div>
                        <div className="text-muted small text-truncate">
                          {notification.message}
                        </div>
                        <small className="text-muted">
                          {formatTimeAgo(notification.createdAt)}
                        </small>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div className="text-center p-2 border-top">
              <Link to="/notifications" onClick={() => setShow(false)}>
                View all
              </Link>
            </div>
          </Popover.Body>
        </Popover>
      </Overlay>
    </>
  );
}
