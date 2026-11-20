import { useEffect, useState } from 'react';
import { Badge, Button, Card, Col, Container, Form, Image, Modal, Row, Spinner, Table } from 'react-bootstrap';
import { FaCheck, FaRedo, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../api/axios';

const statusVariant = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger'
};

export default function AdminVerifications() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pending');
  const [verifications, setVerifications] = useState([]);
  const [modal, setModal] = useState({ show: false, verification: null, action: null, reason: '' });

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/admin/verifications?status=${status}`);
      setVerifications(data.verifications || []);
    } catch (err) {
      toast.error('Could not load verification requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, [status]);

  const runAction = async () => {
    const { verification, action, reason } = modal;
    if (!verification) return;
    if ((action === 'reject' || action === 'request-reupload') && !reason.trim()) {
      toast.error('Enter a reason');
      return;
    }

    try {
      await api.post(`/admin/verifications/${verification.id}/${action}`, { reason });
      toast.success('Verification updated');
      setModal({ show: false, verification: null, action: null, reason: '' });
      fetchVerifications();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update verification');
    }
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">ID Verifications</h2>
        <Form.Select style={{ width: 180 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </Form.Select>
      </div>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" /></div>
      ) : (
        <Row className="g-3">
          {verifications.map((item) => (
            <Col lg={6} key={item.id}>
              <Card>
                <Card.Body>
                  <div className="d-flex justify-content-between mb-3">
                    <div>
                      <h5 className="mb-1">{item.user?.name}</h5>
                      <div className="text-muted small">{item.user?.email} | {item.user?.phone || 'No phone'}</div>
                    </div>
                    <Badge bg={statusVariant[item.status] || 'secondary'}>{item.status}</Badge>
                  </div>
                  <Row className="g-3">
                    <Col sm={5}>
                      <a href={item.nid_front_image} target="_blank" rel="noreferrer">
                        <Image src={item.nid_front_image} alt="NID document" thumbnail style={{ width: '100%', height: 180, objectFit: 'cover' }} />
                      </a>
                    </Col>
                    <Col sm={7}>
                      <Table size="sm" className="mb-3">
                        <tbody>
                          <tr><td>Institute</td><td>{item.user?.institute || 'N/A'}</td></tr>
                          <tr><td>Profession</td><td>{item.user?.profession || 'N/A'}</td></tr>
                          <tr><td>Address</td><td>{item.user?.address || 'N/A'}</td></tr>
                          <tr><td>Facebook</td><td>{item.user?.facebook_url || 'N/A'}</td></tr>
                        </tbody>
                      </Table>
                      {item.status === 'pending' && (
                        <div className="d-flex gap-2 flex-wrap">
                          <Button size="sm" variant="success" onClick={() => setModal({ show: true, verification: item, action: 'approve', reason: '' })}><FaCheck /> Approve</Button>
                          <Button size="sm" variant="danger" onClick={() => setModal({ show: true, verification: item, action: 'reject', reason: '' })}><FaTimes /> Reject</Button>
                          <Button size="sm" variant="outline-warning" onClick={() => setModal({ show: true, verification: item, action: 'request-reupload', reason: '' })}><FaRedo /> Re-upload</Button>
                        </div>
                      )}
                      {item.rejection_reason && <div className="small text-danger mt-2">{item.rejection_reason}</div>}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          ))}
          {verifications.length === 0 && <Col><Card><Card.Body className="text-center text-muted">No verification requests found</Card.Body></Card></Col>}
        </Row>
      )}

      <Modal show={modal.show} onHide={() => setModal({ show: false, verification: null, action: null, reason: '' })} centered>
        <Modal.Header closeButton><Modal.Title>Review Verification</Modal.Title></Modal.Header>
        <Modal.Body>
          <p className="mb-3">Update {modal.verification?.user?.name}'s verification request?</p>
          {modal.action !== 'approve' && (
            <Form.Control as="textarea" rows={3} placeholder="Reason" value={modal.reason} onChange={(e) => setModal((prev) => ({ ...prev, reason: e.target.value }))} />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModal({ show: false, verification: null, action: null, reason: '' })}>Cancel</Button>
          <Button variant={modal.action === 'approve' ? 'success' : 'danger'} onClick={runAction}>Submit</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
