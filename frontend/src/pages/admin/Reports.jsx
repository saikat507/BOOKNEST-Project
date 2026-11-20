import { useEffect, useState } from 'react';
import { Badge, Button, Card, Container, Form, Modal, Spinner, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../../api/axios';

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pending');
  const [modal, setModal] = useState({ show: false, report: null, action: 'dismiss', note: '', refund: '' });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/admin/reports${status ? `?status=${status}` : ''}`);
      setReports(data.reports || []);
    } catch (err) {
      toast.error('Could not load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [status]);

  const resolve = async () => {
    try {
      await api.post(`/admin/reports/${modal.report.id}/resolve`, {
        action: modal.action,
        note: modal.note,
        coin_refund_amount: modal.refund
      });
      toast.success('Report resolved');
      setModal({ show: false, report: null, action: 'dismiss', note: '', refund: '' });
      fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not resolve report');
    }
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Reports & Complaints</h2>
        <Form.Select style={{ width: 180 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
          <option value="">All</option>
        </Form.Select>
      </div>
      <Card>
        <Card.Body className="p-0">
          {loading ? <div className="text-center py-5"><Spinner animation="border" /></div> : (
            <Table responsive hover className="mb-0">
              <thead><tr><th>Reporter</th><th>Reported User</th><th>Related</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td>{report.reporter?.name}</td>
                    <td>{report.reported_user?.name}</td>
                    <td>{report.book?.title || (report.transaction_id ? `Transaction #${report.transaction_id}` : 'N/A')}</td>
                    <td>{report.reason}</td>
                    <td><Badge bg={report.status === 'pending' ? 'warning' : 'secondary'}>{report.status}</Badge></td>
                    <td>
                      <Button size="sm" variant="outline-primary" onClick={() => setModal({ show: true, report, action: 'dismiss', note: '', refund: '' })}>Review</Button>
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && <tr><td colSpan={6} className="text-center py-4 text-muted">No reports found</td></tr>}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={modal.show} onHide={() => setModal({ show: false, report: null, action: 'dismiss', note: '', refund: '' })} centered>
        <Modal.Header closeButton><Modal.Title>Resolve Report</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Action</Form.Label>
            <Form.Select value={modal.action} onChange={(e) => setModal((prev) => ({ ...prev, action: e.target.value }))}>
              <option value="dismiss">Dismiss</option>
              <option value="warn">Warn user</option>
              <option value="ban">Ban user</option>
              <option value="refund">Refund coins</option>
            </Form.Select>
          </Form.Group>
          {modal.action === 'refund' && (
            <Form.Group className="mb-3">
              <Form.Label>Refund amount</Form.Label>
              <Form.Control type="number" min="1" value={modal.refund} onChange={(e) => setModal((prev) => ({ ...prev, refund: e.target.value }))} />
            </Form.Group>
          )}
          <Form.Control as="textarea" rows={3} placeholder="Resolution note" value={modal.note} onChange={(e) => setModal((prev) => ({ ...prev, note: e.target.value }))} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModal({ show: false, report: null, action: 'dismiss', note: '', refund: '' })}>Cancel</Button>
          <Button variant="primary" onClick={resolve}>Resolve</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
