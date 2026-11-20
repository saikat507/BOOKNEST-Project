import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Spinner, Alert } from 'react-bootstrap';
import { FaSearch, FaCoins, FaPlus, FaMinus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api/axios';

export default function CoinManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [awardModal, setAwardModal] = useState({ show: false, user: null });
  const [awardData, setAwardData] = useState({ amount: '', reason: '' });
  const [settings, setSettings] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchSettings();
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

  const fetchSettings = async () => {
    try {
      const data = await api.get('/admin/settings');
      const nextSettings = {};
      (data.settings || []).forEach((setting) => {
        nextSettings[setting.key] = setting.value;
      });
      setSettings(nextSettings);
    } catch (err) {
      toast.error('There was a problem loading coin settings');
    }
  };

  const saveSettings = async () => {
    setSubmitting(true);
    try {
      await api.put('/admin/settings', { settings });
      toast.success('Coin settings updated');
      fetchSettings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'There was a problem saving settings');
    } finally {
      setSubmitting(false);
    }
  };

  const openAwardModal = (user) => {
    setAwardModal({ show: true, user });
    setAwardData({ amount: '', reason: '' });
  };

  const handleAward = async () => {
    const amount = parseInt(awardData.amount);
    if (!amount) {
      toast.error('Enter a non-zero amount');
      return;
    }

    if (!awardData.reason.trim()) {
      toast.error('Enter a reason');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/admin/coins/adjust', {
        user_id: awardModal.user.id,
        amount: amount,
        reason: awardData.reason,
      });
      toast.success('Coin balance adjusted');
      setAwardModal({ show: false, user: null });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'There was a problem awarding coins');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h2 className="mb-4">Coin Management</h2>

      <Card className="mb-4">
        <Card.Body>
          <h5 className="mb-3">Coin Settings</h5>
          <Row className="g-3 align-items-end">
            {[
              ['signup_bonus', 'Signup bonus'],
              ['donation_reward', 'Donation reward'],
              ['adopt_reward', 'Adoption reward'],
              ['exchange_reward', 'Exchange reward']
            ].map(([key, label]) => (
              <Col md={3} key={key}>
                <Form.Label>{label}</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  value={settings[key] || ''}
                  onChange={(e) => setSettings((prev) => ({ ...prev, [key]: e.target.value }))}
                />
              </Col>
            ))}
            <Col md="auto">
              <Button variant="success" onClick={saveSettings} disabled={submitting}>Save Settings</Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Body>
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
        </Card.Body>
      </Card>

      <Card>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Current Balance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-4">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="fw-bold">{user.name}</div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className="d-flex align-items-center gap-1 text-warning fw-bold">
                        <FaCoins />
                        {user.coin_balance}
                      </span>
                    </td>
                    <td>
                      <Button
                        variant="warning"
                        size="sm"
                        onClick={() => openAwardModal(user)}
                      >
                        <FaPlus className="me-1" /> Adjust
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <div className="text-muted mt-3">
        Total Users: {filteredUsers.length}
      </div>

      {awardModal.show && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setAwardModal({ show: false, user: null })}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="modal-content">
              <Card.Header>
                <h4 className="mb-0">
                  <FaCoins className="me-2 text-warning" />
                  Coin Adjustment
                </h4>
              </Card.Header>
              <Card.Body>
                <Alert variant="info">
                  <div className="fw-bold">{awardModal.user?.name}</div>
                  <div className="text-muted">{awardModal.user?.email}</div>
                  <div className="mt-2">
                    Current Balance:{' '}
                    <span className="text-warning fw-bold">
                      {awardModal.user?.coin_balance} Coin
                    </span>
                  </div>
                </Alert>

                <Form.Group className="mb-3">
                  <Form.Label>Amount (Coin)</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <FaCoins />
                    </InputGroup.Text>
                    <Form.Control
                      type="number"
                      value={awardData.amount}
                      onChange={(e) =>
                        setAwardData((prev) => ({ ...prev, amount: e.target.value }))
                      }
                      placeholder="Use positive to add, negative to deduct"
                    />
                  </InputGroup>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Reason</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={awardData.reason}
                    onChange={(e) =>
                      setAwardData((prev) => ({ ...prev, reason: e.target.value }))
                    }
                    placeholder="Why are you awarding coins?"
                  />
                </Form.Group>
              </Card.Body>
              <Card.Footer>
                <Button
                  variant="secondary"
                  onClick={() => setAwardModal({ show: false, user: null })}
                >
                  Cancel
                </Button>
                <Button
                  variant="warning"
                  onClick={handleAward}
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Adjust'}
                </Button>
              </Card.Footer>
            </Card>
          </div>
        </div>
      )}
    </Container>
  );
}
