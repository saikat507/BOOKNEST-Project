import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Badge, Button, Card, Col, Container, Row, Spinner, Table, Tabs, Tab } from 'react-bootstrap';
import { FaBookOpen, FaCalendarAlt, FaCoins, FaUndo, FaUser } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useCoin } from '../context/CoinContext';

const statusConfig = {
  borrowed: { label: 'Borrowed', bg: 'primary' },
  returned: { label: 'Returned', bg: 'success' },
  late: { label: 'Late', bg: 'danger' }
};

const formatDate = (date) => {
  if (!date) return 'Not returned';
  return new Date(date).toLocaleDateString();
};

const getBook = (item) => item.transaction?.book || {};
const getOwner = (item) => item.transaction?.giver || {};
const getBorrower = (item) => item.transaction?.receiver || {};

export default function MyBorrowedBooks() {
  const { refreshBalance } = useCoin();
  const [borrowed, setBorrowed] = useState([]);
  const [lentOut, setLentOut] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [returningId, setReturningId] = useState(null);

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    setLoading(true);
    setError(null);
    try {
      const [myData, ownerData] = await Promise.all([
        api.get('/bookreturns/my'),
        api.get('/bookreturns/owner/pending')
      ]);
      setBorrowed(myData.returns || []);
      setLentOut(ownerData.returns || []);
    } catch (err) {
      setError('There was a problem loading borrowed books');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (returnId) => {
    if (!confirm('Do you want to return this book now?')) return;

    setReturningId(returnId);
    try {
      const data = await api.put(`/bookreturns/${returnId}/return`);
      toast.success(data.message || 'Book returned successfully');
      refreshBalance();
      fetchReturns();
    } catch (err) {
      toast.error(err.response?.data?.message || 'There was a problem returning this book');
    } finally {
      setReturningId(null);
    }
  };

  const renderStatus = (status) => {
    const config = statusConfig[status] || statusConfig.borrowed;
    return <Badge bg={config.bg}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h2 className="mb-1">My Borrowed Books</h2>
        <p className="text-muted mb-0">Track adoption due dates, returns, and fines</p>
      </div>

      <Tabs defaultActiveKey="borrowed" className="mb-4">
        <Tab eventKey="borrowed" title="Borrowed by Me">
          {borrowed.length === 0 ? (
            <Card className="text-center p-5">
              <FaBookOpen size={64} className="text-muted mb-3" />
              <h4>No borrowed books</h4>
              <p className="text-muted mb-3">Approved adoption books will show up here.</p>
              <Link to="/books?type=adopt" className="btn btn-primary">
                Browse Adopt Books
              </Link>
            </Card>
          ) : (
            <Row className="g-4">
              {borrowed.map((item) => {
                const book = getBook(item);
                const owner = getOwner(item);
                const canReturn = item.status === 'borrowed' || item.status === 'late';

                return (
                  <Col key={item.id} md={6} lg={4}>
                    <Card className="h-100 book-card shadow-sm">
                      {book.cover_image_url ? (
                        <Card.Img
                          variant="top"
                          src={book.cover_image_url}
                          alt={book.title}
                          style={{ height: '180px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="bg-light d-flex align-items-center justify-content-center" style={{ height: '180px' }}>
                          <FaBookOpen size={42} className="text-muted" />
                        </div>
                      )}
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          {renderStatus(item.status)}
                          <span className="small text-muted">
                            <FaCoins className="me-1" />
                            Fine: {Number(item.fine_amount || 0)}
                          </span>
                        </div>
                        <Card.Title className="h6 mb-1">{book.title}</Card.Title>
                        <Card.Subtitle className="text-muted small mb-3">{book.author}</Card.Subtitle>

                        <div className="small text-muted d-flex align-items-center gap-2 mb-2">
                          <FaUser />
                          <span>Owner: <strong>{owner.name}</strong></span>
                        </div>
                        <div className="small text-muted d-flex align-items-center gap-2 mb-2">
                          <FaCalendarAlt />
                          <span>Borrow date: {formatDate(item.created_at || item.createdAt)}</span>
                        </div>
                        <div className="small text-muted d-flex align-items-center gap-2 mb-2">
                          <FaCalendarAlt />
                          <span>Due date: {formatDate(item.due_date)}</span>
                        </div>
                        <div className={item.status === 'late' ? 'small text-danger mb-3' : 'small text-success mb-3'}>
                          {item.status === 'late'
                            ? `Late by ${item.lateDays || 0} days`
                            : item.status === 'returned'
                              ? `Returned on ${formatDate(item.actual_return_date)}`
                              : `${item.daysRemaining || 0} days remaining`}
                        </div>

                        <div className="d-grid gap-2">
                          {canReturn && (
                            <Button
                              variant={item.status === 'late' ? 'danger' : 'primary'}
                              size="sm"
                              onClick={() => handleReturn(item.id)}
                              disabled={returningId === item.id}
                            >
                              <FaUndo className="me-2" />
                              {returningId === item.id ? 'Returning...' : 'Return Book'}
                            </Button>
                          )}
                          <Button as={Link} to={`/books/${book.id}`} variant="outline-primary" size="sm">
                            View Book
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}
        </Tab>

        <Tab eventKey="owner" title="Owner Dashboard">
          {lentOut.length === 0 ? (
            <Alert variant="info">No borrowed adopt books are pending return.</Alert>
          ) : (
            <Card>
              <Table responsive hover className="mb-0 align-middle">
                <thead>
                  <tr>
                    <th>Borrower</th>
                    <th>Book</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Fine</th>
                    <th>Return Date</th>
                  </tr>
                </thead>
                <tbody>
                  {lentOut.map((item) => {
                    const book = getBook(item);
                    const borrower = getBorrower(item);
                    return (
                      <tr key={item.id}>
                        <td>{borrower.name}</td>
                        <td>
                          <Link to={`/books/${book.id}`} className="text-decoration-none">
                            {book.title}
                          </Link>
                        </td>
                        <td>{formatDate(item.due_date)}</td>
                        <td>{renderStatus(item.status)}</td>
                        <td>{Number(item.fine_amount || 0)} Coin</td>
                        <td>{formatDate(item.actual_return_date)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Card>
          )}
        </Tab>
      </Tabs>
    </Container>
  );
}
