import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Form, InputGroup, Spinner, Alert } from 'react-bootstrap';
import { FaSearch, FaUser, FaCheck, FaTimes, FaBan, FaShieldAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { Link } from 'react-router-dom';

const roleConfig = {
  admin: { label: 'Admin', bg: 'danger' },
  moderator: { label: 'Moderator', bg: 'warning' },
  verified_user: { label: 'Verified', bg: 'success' },
  user: { label: 'User', bg: 'secondary' },
};

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.get('/admin/users');
      setUsers(data.users || []);
    } catch (err) {
      toast.error('There was a problem loading users');
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async (userId) => {
    setActionLoading(userId);
    try {
      await api.put(`/admin/users/${userId}/block`);
      toast.success('User status updated');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'There was a problem blocking');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBan = async (userId) => {
    const reason = prompt('Ban reason');
    if (!reason) return;
    setActionLoading(userId);
    try {
      await api.post(`/admin/users/${userId}/ban`, { reason });
      toast.success('User banned');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'There was a problem banning');
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerify = async (userId) => {
    setActionLoading(userId);
    try {
      await api.put(`/admin/users/${userId}/verify`);
      toast.success('User verified');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'There was a problem verifying');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'verified' && user.is_verified) ||
      (filter === 'unverified' && !user.is_verified) ||
      (filter === 'blocked' && !user.is_active) ||
      (filter === 'banned' && user.ban_status === 'banned') ||
      (filter === 'active' && user.is_active);
    const matchesVerification =
      verificationFilter === 'all' || user.verification_status === verificationFilter;
    return matchesSearch && matchesFilter && matchesVerification;
  });

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h2 className="mb-4">User Management</h2>

      <Card className="mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={3}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="verified">Verified</option>
                <option value="unverified">Not Verified</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
                <option value="banned">Banned</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select value={verificationFilter} onChange={(e) => setVerificationFilter(e.target.value)}>
                <option value="all">All Verification</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="unsubmitted">Unsubmitted</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Coins</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const role = roleConfig[user.role] || roleConfig.user;
                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          {user.profile_image_url ? (
                            <img
                              src={user.profile_image_url}
                              alt={user.name}
                              style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              className="bg-light rounded-circle d-flex align-items-center justify-content-center"
                              style={{ width: 40, height: 40 }}
                            >
                              <FaUser className="text-muted" />
                            </div>
                          )}
                          <span className="fw-bold">{user.name}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>{user.phone || 'N/A'}</td>
                      <td>
                        <Badge bg={role.bg}>{role.label}</Badge>
                      </td>
                      <td>{user.coin_balance}</td>
                      <td>
                        {user.is_active ? (
                          <Badge bg="success">Active</Badge>
                        ) : (
                          <Badge bg="danger">{user.ban_status === 'banned' ? 'Banned' : 'Blocked'}</Badge>
                        )}
                        <Badge bg={user.verification_status === 'approved' ? 'success' : user.verification_status === 'pending' ? 'warning' : user.verification_status === 'rejected' ? 'danger' : 'secondary'} className="ms-2">
                          {user.verification_status || 'unsubmitted'}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          {!user.is_verified && (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleVerify(user.id)}
                              disabled={actionLoading === user.id}
                              title="Verify User"
                            >
                              <FaCheck />
                            </Button>
                          )}
                          <Button
                            variant={user.is_active ? 'danger' : 'warning'}
                            size="sm"
                            onClick={() => handleBlock(user.id)}
                            disabled={actionLoading === user.id}
                            title={user.is_active ? 'Block User' : 'Unblock User'}
                          >
                            <FaBan />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleBan(user.id)}
                            disabled={actionLoading === user.id}
                            title="Ban User"
                          >
                            <FaTimes />
                          </Button>
                          <Button
                            as={Link}
                            to={`/admin/users/${user.id}`}
                            variant="outline-primary"
                            size="sm"
                            title="View Details"
                          >
                            <FaShieldAlt />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <div className="text-muted mt-3">
        Total Users: {filteredUsers.length}
      </div>
    </Container>
  );
}
