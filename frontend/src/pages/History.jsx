import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Spinner, Alert, Button, ButtonGroup } from 'react-bootstrap';
import { FaBookOpen, FaMapMarkerAlt, FaUser, FaExchangeAlt, FaHandHoldingHeart, FaHistory, FaStar, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api/axios';

const processConfig = {
  donate: { label: 'Donate', bg: 'success', icon: FaHandHoldingHeart },
  exchange: { label: 'Exchange', bg: 'primary', icon: FaExchangeAlt },
  adopt: { label: 'Adopt', bg: 'warning', icon: FaBookOpen },
  buy: { label: 'Purchase', bg: 'danger', icon: FaHistory },
  sell: { label: 'Sell', bg: 'danger', icon: FaHistory },
};

export default function History() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/books/my-history');
      setBooks(data.books || []);
    } catch (err) {
      setError('There was a problem loading books');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (book) => {
    const rating = Number(prompt(`Rate ${book.to_user?.name || 'this user'} from 1 to 5`));
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return;
    const comment = prompt('Write a short review') || '';

    try {
      await api.post('/reviews', {
        reviewed_user_id: book.to_user.id,
        rating,
        comment,
        book_id: book.id
      });
      toast.success('Review submitted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit review');
    }
  };

  const handleReport = async (book) => {
    const reason = prompt(`Why are you reporting ${book.to_user?.name || 'this user'}?`);
    if (!reason) return;
    const description = prompt('Add details for admin review') || '';

    try {
      await api.post('/reports', {
        reported_user_id: book.to_user.id,
        book_id: book.id,
        transaction_id: book.transaction_id,
        reason,
        description
      });
      toast.success('Report submitted to admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit report');
    }
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
        <h2 className="mb-1">History</h2>
        <p className="text-muted">Books you have given to others</p>
      </div>

      {books.length === 0 ? (
        <Card className="text-center p-5">
          <FaHistory size={64} className="text-muted mb-3" />
          <h4>No history</h4>
          <p className="text-muted mb-3">You have not given any books to others yet</p>
          <Link to="/books" className="btn btn-primary">
            Browse Books
          </Link>
        </Card>
      ) : (
        <Row className="g-4">
          {books.map((book) => {
            const process = processConfig[book.process] || processConfig.donate;
            const ProcessIcon = process.icon;
            return (
              <Col key={book.id} md={6} lg={4}>
                <Card className="h-100 book-card shadow-sm">
                  {book.cover_image_url && (
                    <Card.Img
                      variant="top"
                      src={book.cover_image_url}
                      alt={book.title}
                      style={{ height: '180px', objectFit: 'cover' }}
                    />
                  )}
                  <Card.Body>
                    <div className="d-flex gap-2 mb-2">
                      <Badge bg={process.bg} className="d-flex align-items-center gap-1">
                        <ProcessIcon size={12} />
                        {process.label}
                      </Badge>
                    </div>
                    <Card.Title className="h6 mb-1">{book.title}</Card.Title>
                    <Card.Subtitle className="text-muted small mb-2">{book.author}</Card.Subtitle>

                    {book.to_user && (
                      <div className="d-flex align-items-center gap-2 mb-2 p-2 bg-light rounded">
                        <FaUser size={14} className="text-muted" />
                        <span className="small">
                          <span className="text-muted">Given to:</span>{' '}
                          <strong>{book.to_user.name}</strong>
                        </span>
                      </div>
                    )}

                    {book.pickup_location && (
                      <div className="text-muted small d-flex align-items-center gap-1 mb-2">
                        <FaMapMarkerAlt size={12} />
                        {book.pickup_location}
                      </div>
                    )}

                    <div className="d-grid gap-2">
                      <Link to={`/books/${book.id}`} className="btn btn-outline-primary btn-sm">
                        View Book
                      </Link>
                      {book.to_user && (
                        <ButtonGroup size="sm">
                          <Button variant="outline-warning" onClick={() => handleReview(book)}>
                            <FaStar className="me-1" />
                            Review
                          </Button>
                          <Button variant="outline-danger" onClick={() => handleReport(book)}>
                            <FaExclamationTriangle className="me-1" />
                            Report
                          </Button>
                        </ButtonGroup>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </Container>
  );
}
