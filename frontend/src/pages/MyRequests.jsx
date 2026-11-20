import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, Table, Nav } from 'react-bootstrap';
import { FaCheck, FaTimes, FaClock, FaBook, FaHandshake, FaCheckDouble, FaUserCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useCoin } from '../context/CoinContext';

const requestTypeConfig = {
  donate: { label: 'Donate', bg: 'success' },
  exchange: { label: 'Exchange', bg: 'primary' },
  adopt: { label: 'Adopt', bg: 'warning' },
  buy: { label: 'Buy', bg: 'danger' },
};

const statusConfig = {
  pending: { label: 'Pending', bg: 'warning', icon: FaClock },
  approved: { label: 'Approved', bg: 'success', icon: FaCheck },
  rejected: { label: 'Rejected', bg: 'danger', icon: FaTimes },
  completed: { label: 'Completed', bg: 'info', icon: FaCheck },
};

export default function MyRequests() {
  const { refreshBalance } = useCoin();
  const [activeTab, setActiveTab] = useState('my');
  const [myRequests, setMyRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [myBooks, setMyBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'received' && myBooks.length > 0) {
      fetchReceivedRequestsForBooks(myBooks);
    }
  }, [activeTab, myBooks]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchMyRequests(),
        fetchMyBooks(),
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const data = await api.get('/requests/my');
      setMyRequests(data.requests || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyBooks = async () => {
    try {
      const data = await api.get('/books/my-owned');
      setMyBooks(data.books || []);
      await fetchReceivedRequestsForBooks(data.books || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReceivedRequestsForBooks = async (books) => {
    const requests = [];
    for (const book of books) {
      try {
        const data = await api.get(`/requests/book/${book.id}`);
        requests.push(...(data.requests || []).map(r => ({ ...r, book })));
      } catch (err) {
        console.error(err);
      }
    }
    setReceivedRequests(requests);
  };

  const handleApprove = async (requestId) => {
    setActionLoading(requestId);
    try {
      await api.patch(`/requests/${requestId}/approve`);
      toast.success('Request approved');
      refreshBalance();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'There was a problem approving');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId) => {
    setActionLoading(requestId);
    try {
      await api.patch(`/requests/${requestId}/reject`);
      toast.success('Request rejected');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'There was a problem rejecting');
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (requestId) => {
    setActionLoading(requestId);
    try {
      await api.patch(`/requests/${requestId}/complete`);
      toast.success('Transaction completed! Coins have been awarded.');
      refreshBalance();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'There was a problem completing');
    } finally {
      setActionLoading(null);
    }
  };

  const renderMyRequests = () => {
    if (myRequests.length === 0) {
      return (
        <Card className="text-center p-5">
          <FaHandshake size={64} className="text-muted mb-3" />
          <h4>No requests</h4>
          <p className="text-muted mb-0">You have not requested any books</p>
        </Card>
      );
    }

    return (
      <Card>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead>
              <tr>
                <th>Book</th>
                <th>Type</th>
                <th>Status</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {myRequests.map((request) => {
                const requestType = requestTypeConfig[request.request_type] || requestTypeConfig.donate;
                const status = statusConfig[request.status] || statusConfig.pending;
                const StatusIcon = status.icon;
                return (
                  <tr key={request.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        {request.book?.cover_image_url && (
                          <img
                            src={request.book.cover_image_url}
                            alt={request.book.title}
                            style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
                          />
                        )}
                        <div>
                          <div className="fw-bold">{request.book?.title}</div>
                          <div className="text-muted small">{request.book?.author}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge bg={requestType.bg}>{requestType.label}</Badge>
                    </td>
                    <td>
                      <Badge bg={status.bg} className="d-flex align-items-center gap-1">
                        <StatusIcon size={12} />
                        {status.label}
                      </Badge>
                    </td>
                    <td className="text-muted small">
                      {new Date(request.createdAt).toLocaleDateString('bn-BD')}
                    </td>
                    <td>
                      {request.status === 'pending' && (
                        <span className="text-muted small">Please wait</span>
                      )}
                      {request.status === 'approved' && (
                        <Badge bg="success">You have been selected</Badge>
                      )}
                      {request.status === 'rejected' && (
                        <Badge bg="danger">Rejected</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    );
  };

  const renderReceivedRequests = () => {
    if (receivedRequests.length === 0) {
      return (
        <Card className="text-center p-5">
          <FaBook size={64} className="text-muted mb-3" />
          <h4>No requests</h4>
          <p className="text-muted mb-0">No one has requested your books</p>
        </Card>
      );
    }

    return (
      <Card>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead>
              <tr>
                <th>Book</th>
                <th>Requester</th>
                <th>Type</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {receivedRequests.map((request) => {
                const requestType = requestTypeConfig[request.request_type] || requestTypeConfig.donate;
                const status = statusConfig[request.status] || statusConfig.pending;
                const StatusIcon = status.icon;
                return (
                  <tr key={request.id}>
                    <td>
                      <div className="fw-bold">{request.book?.title}</div>
                      <div className="text-muted small">{request.book?.author}</div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        {request.requester?.profile_image_url ? (
                          <img
                            src={request.requester.profile_image_url}
                            alt={request.requester.name}
                            style={{ width: 34, height: 34, objectFit: 'cover', borderRadius: '50%' }}
                          />
                        ) : (
                          <FaUserCircle size={34} className="text-muted" />
                        )}
                        <div>
                          {request.requester?.id ? (
                            <Link
                              to={`/users/${request.requester.id}`}
                              className="fw-bold text-primary text-decoration-none"
                            >
                              {request.requester?.name}
                            </Link>
                          ) : (
                            <div className="fw-bold">{request.requester?.name || 'Unknown'}</div>
                          )}
                          <div className="text-muted small">{request.requester?.email}</div>
                          {request.requester?.id && (
                            <Link
                              to={`/users/${request.requester.id}`}
                              className="small text-decoration-none"
                            >
                              View profile
                            </Link>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge bg={requestType.bg}>{requestType.label}</Badge>
                    </td>
                    <td>
                      <Badge bg={status.bg} className="d-flex align-items-center gap-1">
                        <StatusIcon size={12} />
                        {status.label}
                      </Badge>
                    </td>
                    <td className="text-muted small">
                      {new Date(request.createdAt).toLocaleDateString('bn-BD')}
                    </td>
                    <td>
                      {request.status === 'approved' && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleComplete(request.id)}
                          disabled={actionLoading === request.id}
                          className="d-flex align-items-center gap-1"
                        >
                          <FaCheckDouble size={12} />
                          {actionLoading === request.id ? 'Completing...' : 'Complete'}
                        </Button>
                      )}
                      {request.status === 'pending' && (
                        <div className="d-flex gap-2">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleApprove(request.id)}
                            disabled={actionLoading === request.id}
                          >
                            <FaCheck />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleReject(request.id)}
                            disabled={actionLoading === request.id}
                          >
                            <FaTimes />
                          </Button>
                        </div>
                      )}
                      {request.status === 'completed' && (
                        <Badge bg="info">Completed</Badge>
                      )}
                      {request.status === 'rejected' && (
                        <span className="text-muted small">Rejected</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    );
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h2 className="mb-4">My Requests</h2>

      <Nav variant="tabs" className="mb-4">
        <Nav.Item>
          <Nav.Link
            active={activeTab === 'my'}
            onClick={() => setActiveTab('my')}
          >
            My Requests ({myRequests.length})
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            active={activeTab === 'received'}
            onClick={() => setActiveTab('received')}
          >
            Received Request ({receivedRequests.length})
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {activeTab === 'my' && renderMyRequests()}
      {activeTab === 'received' && renderReceivedRequests()}
    </Container>
  );
}
