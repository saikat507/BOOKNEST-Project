import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Form, Spinner, Modal } from 'react-bootstrap';
import { FaCheck, FaTimes, FaClock } from 'react-icons/fa';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';

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

export default function ManageRequests() {
  const [searchParams] = useSearchParams();
  const requestedType = searchParams.get('type') || 'all';
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState(requestedType);
  const [actionModal, setActionModal] = useState({ show: false, request: null, action: null });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    setTypeFilter(requestedType);
    fetchRequests();
  }, [requestedType]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const allRequests = [];
      const booksData = await api.get('/admin/books');
      for (const book of booksData.books || []) {
        try {
          const data = await api.get(`/requests/book/${book.id}`);
          const bookRequests = (data.requests || []).map((r) => ({
            ...r,
            book,
          }));
          allRequests.push(...bookRequests);
        } catch (err) {
          console.error(err);
        }
      }
      setRequests(allRequests);
    } catch (err) {
      toast.error('There was a problem loading requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    setProcessing(true);
    try {
      await api.patch(`/requests/${requestId}/approve`);
      toast.success('Request approved');
      setActionModal({ show: false, request: null, action: null });
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'There was a problem approving');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (requestId) => {
    setProcessing(true);
    try {
      await api.patch(`/requests/${requestId}/reject`);
      toast.success('Request rejected');
      setActionModal({ show: false, request: null, action: null });
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'There was a problem rejecting');
    } finally {
      setProcessing(false);
    }
  };

  const confirmAction = (request, action) => {
    setActionModal({ show: true, request, action });
  };

  const filteredRequests = requests.filter((request) => {
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesType = typeFilter === 'all' || request.request_type === typeFilter;
    return matchesStatus && matchesType;
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
      <h2 className="mb-4">Request Management</h2>

      <Card className="mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </Form.Select>
            </Col>
            <Col md={6}>
              <Form.Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="all">All Types</option>
                <option value="donate">Donate</option>
                <option value="exchange">Exchange</option>
                <option value="adopt">Adopt</option>
                <option value="buy">Buy</option>
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
                <th>Book</th>
                <th>Requester</th>
                <th>Type</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4">
                    No requests found
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => {
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
                              alt={request.book?.title}
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
                        <div>{request.requester?.name || 'N/A'}</div>
                        <div className="text-muted small">{request.requester?.email}</div>
                      </td>
                      <td>
                        <Badge bg={requestType.bg}>{requestType.label}</Badge>
                      </td>
                      <td>
                        <Badge bg={status.bg} className="d-flex align-items-center gap-1 w-fit">
                          <StatusIcon size={12} />
                          {status.label}
                        </Badge>
                      </td>
                      <td className="text-muted small">
                        {new Date(request.createdAt).toLocaleDateString('bn-BD')}
                      </td>
                      <td>
                        {request.status === 'pending' && (
                          <div className="d-flex gap-2">
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => confirmAction(request, 'approve')}
                              title="Approve"
                            >
                              <FaCheck />
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => confirmAction(request, 'reject')}
                              title="Reject"
                            >
                              <FaTimes />
                            </Button>
                          </div>
                        )}
                        {request.status !== 'pending' && (
                          <span className="text-muted small">{request.status}</span>
                        )}
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
        Total Requests: {filteredRequests.length}
      </div>

      <Modal show={actionModal.show} onHide={() => setActionModal({ show: false, request: null, action: null })} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {actionModal.action === 'approve' ? 'Approve Request' : 'Reject Request'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Do you want to{' '}
            the request from {actionModal.request?.requester?.name} for "{actionModal.request?.book?.title}"?{' '}
            {actionModal.action === 'approve' ? 'Approve' : 'Reject'}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setActionModal({ show: false, request: null, action: null })}>
            Cancel
          </Button>
          <Button
            variant={actionModal.action === 'approve' ? 'success' : 'danger'}
            onClick={() =>
              actionModal.action === 'approve'
                ? handleApprove(actionModal.request?.id)
                : handleReject(actionModal.request?.id)
            }
            disabled={processing}
          >
            {processing ? 'Processing...' : actionModal.action === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
