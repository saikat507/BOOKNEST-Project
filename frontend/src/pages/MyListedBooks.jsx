import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, Modal } from 'react-bootstrap';
import { FaPlus, FaTrash, FaBookOpen, FaMapMarkerAlt, FaExchangeAlt, FaHandHoldingHeart, FaShoppingCart } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api/axios';

const listingTypeConfig = {
  donate: { label: 'Donate', bg: 'success', icon: FaHandHoldingHeart },
  exchange: { label: 'Exchange', bg: 'primary', icon: FaExchangeAlt },
  adopt: { label: 'Adopt', bg: 'warning', icon: FaBookOpen },
  sell: { label: 'Sell', bg: 'danger', icon: FaShoppingCart },
};

export default function MyListedBooks() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, book: null });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/books/my-listed');
      setBooks(data.books || []);
    } catch (err) {
      setError('There was a problem loading books');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.book) return;
    setDeleting(true);
    try {
      await api.delete(`/books/${deleteModal.book.id}`);
      toast.success('The book has been deleted');
      setDeleteModal({ show: false, book: null });
      fetchBooks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'There was a problem deleting');
    } finally {
      setDeleting(false);
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">My Listed Books</h2>
          <p className="text-muted mb-0">Books that no one has taken yet</p>
        </div>
        <Button variant="primary" as={Link} to="/add-book">
          <FaPlus className="me-2" />
          Add New Book
        </Button>
      </div>

      {books.length === 0 ? (
        <Card className="text-center p-5">
          <FaBookOpen size={64} className="text-muted mb-3" />
          <h4>No books listed</h4>
          <p className="text-muted mb-3">Add a new book to post your book</p>
          <Button variant="primary" as={Link} to="/add-book">
            <FaPlus className="me-2" />
            Add Book
          </Button>
        </Card>
      ) : (
        <Row className="g-4">
          {books.map((book) => {
            const listingType = listingTypeConfig[book.listing_type] || listingTypeConfig.sell;
            const TypeIcon = listingType.icon;
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
                      <Badge bg={listingType.bg} className="d-flex align-items-center gap-1">
                        <TypeIcon size={12} />
                        {listingType.label}
                      </Badge>
                      {book.requestCount > 0 && (
                        <Badge bg="info">{book.requestCount} Request</Badge>
                      )}
                    </div>
                    <Card.Title className="h6 mb-1">{book.title}</Card.Title>
                    <Card.Subtitle className="text-muted small mb-2">{book.author}</Card.Subtitle>
                    {book.pickup_location && (
                      <div className="text-muted small d-flex align-items-center gap-1 mb-2">
                        <FaMapMarkerAlt size={12} />
                        {book.pickup_location}
                      </div>
                    )}
                    <div className="d-flex gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        as={Link}
                        to={`/books/${book.id}`}
                      >
                        View Book
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => setDeleteModal({ show: true, book })}
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      <Modal show={deleteModal.show} onHide={() => setDeleteModal({ show: false, book: null })} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Book</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Do you want to delete "{deleteModal.book?.title}"?</p>
          <p className="text-muted small mb-0">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteModal({ show: false, book: null })}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
