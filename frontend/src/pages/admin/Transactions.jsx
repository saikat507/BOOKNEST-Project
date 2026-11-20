import { useEffect, useState } from 'react';
import { Badge, Card, Container, Form, Spinner, Table } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const variants = { ongoing: 'primary', completed: 'success', overdue: 'danger', cancelled: 'secondary' };

export default function AdminTransactions() {
  const [searchParams] = useSearchParams();
  const requestedStatus = searchParams.get('status') || '';
  const requestedType = searchParams.get('type') || '';
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [status, setStatus] = useState(requestedStatus);
  const [type, setType] = useState(requestedType);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (type) params.set('type', type);
      const query = params.toString();
      const data = await api.get(`/admin/transactions${query ? `?${query}` : ''}`);
      setTransactions(data.transactions || []);
    } catch (err) {
      toast.error('Could not load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setStatus(requestedStatus);
    setType(requestedType);
  }, [requestedStatus, requestedType]);

  useEffect(() => {
    fetchTransactions();
  }, [status, type]);

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Transaction Monitoring</h2>
        <div className="d-flex gap-2 flex-wrap">
          <Form.Select style={{ width: 180 }} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All Types</option>
            <option value="donate">Donations</option>
            <option value="exchange">Exchanges</option>
            <option value="adopt">Adoptions / Returns</option>
            <option value="sell">Sales</option>
          </Form.Select>
          <Form.Select style={{ width: 180 }} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="ongoing">Active</option>
            <option value="completed">Returned/Completed</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </Form.Select>
        </div>
      </div>
      <Card>
        <Card.Body className="p-0">
          {loading ? <div className="text-center py-5"><Spinner animation="border" /></div> : (
            <Table responsive hover className="mb-0">
              <thead><tr><th>ID</th><th>Book</th><th>Type</th><th>Giver</th><th>Receiver</th><th>Due</th><th>Status</th><th>Reports</th></tr></thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>#{tx.id}</td>
                    <td>{tx.book?.title || 'N/A'}</td>
                    <td><Badge bg="info">{tx.transaction_type}</Badge></td>
                    <td>{tx.giver?.name}</td>
                    <td>{tx.receiver?.name}</td>
                    <td>{tx.due_date || tx.return_date || 'N/A'}</td>
                    <td><Badge bg={variants[tx.status] || 'secondary'}>{tx.status}</Badge></td>
                    <td>{tx.reports?.length || 0}</td>
                  </tr>
                ))}
                {transactions.length === 0 && <tr><td colSpan={8} className="text-center py-4 text-muted">No transactions found</td></tr>}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}
