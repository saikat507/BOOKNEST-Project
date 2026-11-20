import { useEffect, useState } from 'react';
import { Badge, Card, Col, Container, Row, Spinner, Table } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/axios';

export default function AdminUserDetail() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const data = await api.get(`/admin/users/${userId}`);
        setUser(data.user);
      } catch (err) {
        toast.error('Could not load user details');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  if (loading) return <Container className="py-5 text-center"><Spinner animation="border" /></Container>;
  if (!user) return <Container className="py-4">User not found</Container>;

  return (
    <Container className="py-4">
      <h2 className="mb-4">{user.name}</h2>
      <Row className="g-4">
        <Col lg={4}>
          <Card><Card.Body>
            <h5>Profile</h5>
            <div className="mb-2">{user.email}</div>
            <div className="mb-2">{user.phone || 'No phone'}</div>
            <div className="mb-2">{user.institute || 'No institute'}</div>
            <div className="mb-2">{user.profession || 'No profession'}</div>
            <Badge bg={user.is_verified ? 'success' : user.verification_status === 'pending' ? 'warning' : 'secondary'}>{user.verification_status}</Badge>
            <Badge bg={user.is_active ? 'success' : 'danger'} className="ms-2">{user.is_active ? 'active' : user.ban_status}</Badge>
          </Card.Body></Card>
        </Col>
        <Col lg={8}>
          <Card className="mb-4"><Card.Body>
            <h5>Coin Transactions</h5>
            <Table responsive size="sm">
              <thead><tr><th>Date</th><th>Amount</th><th>Type</th><th>Reason</th></tr></thead>
              <tbody>{(user.coinEntries || []).map((entry) => <tr key={entry.id}><td>{new Date(entry.createdAt).toLocaleDateString()}</td><td>{entry.amount}</td><td>{entry.type}</td><td>{entry.reason}</td></tr>)}</tbody>
            </Table>
          </Card.Body></Card>
          <Card className="mb-4"><Card.Body>
            <h5>Listed Books</h5>
            <Table responsive size="sm">
              <thead><tr><th>Title</th><th>Type</th><th>Status</th></tr></thead>
              <tbody>{(user.books || []).map((book) => <tr key={book.id}><td>{book.title}</td><td>{book.listing_type}</td><td>{book.status}</td></tr>)}</tbody>
            </Table>
          </Card.Body></Card>
          <Card><Card.Body>
            <h5>Ban & Warning History</h5>
            <Table responsive size="sm">
              <thead><tr><th>Date</th><th>Action</th><th>Reason</th><th>Admin</th></tr></thead>
              <tbody>{(user.banHistory || []).map((item) => <tr key={item.id}><td>{new Date(item.createdAt).toLocaleDateString()}</td><td>{item.action}</td><td>{item.reason}</td><td>{item.admin?.name || 'N/A'}</td></tr>)}</tbody>
            </Table>
          </Card.Body></Card>
        </Col>
      </Row>
    </Container>
  );
}
