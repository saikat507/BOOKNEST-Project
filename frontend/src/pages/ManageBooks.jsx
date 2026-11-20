import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Form, InputGroup, Spinner, Modal } from 'react-bootstrap';
import { FaSearch, FaTrash, FaEye } from 'react-icons/fa';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';

const listingTypeConfig = {
  donate: { label: 'Donate', bg: 'success' },
  exchange: { label: 'Exchange', bg: 'primary' },
  adopt: { label: 'Adopt', bg: 'warning' },
  sell: { label: 'Sell', bg: 'danger' },
};

const statusConfig = {
  available: { label: 'Available', bg: 'success' },
  pending: { label: 'Pending', bg: 'warning' },
  completed: { label: 'Completed', bg: 'info' },
  closed: { label: 'Closed', bg: 'secondary' },
};

export default function ManageBooks() {
  const [searchParams] = useSearchParams();
  const requestedType = searchParams.get('listing_type') || 'all';
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(requestedType);
  const [deleteModal, setDeleteModal] = useState({ show: false, book: null });
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setTypeFilter(requestedType);
    fetchBooks();
  }, [requestedType]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const data = await api.get('/admin/books');
      setBooks(data.books || []);
    } catch (err) {
      toast.error('There was a problem loading books');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.book) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/books/${deleteModal.book.id}`, { data: { reason: deleteReason } });
      toast.success('The book has been unpublished');
      setDeleteModal({ show: false, book: null });
      setDeleteReason('');
      fetchBooks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'There was a problem deleting');
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = (book) => {
    setDeleteModal({ show: true, book });
    setDeleteReason('');
  };

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      book.author.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || book.listing_type === typeFilter;
    return matchesSearch && matchesType;
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
      <h2 className="mb-4">Book Management</h2>

      <Card className="mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search by title or author..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={6}>
              <Form.Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="all">All Types</option>
                <option value="donate">Donate</option>
                <option value="exchange">Exchange</option>
                <option value="adopt">Adopt</option>
                <option value="sell">Sell</option>
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
                <th>Owner</th>
                <th>Type</th>
                <th>Status</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBooks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4">
                    No books found
                  </td>
                </tr>
              ) : (
                filteredBooks.map((book) => {
                  const listingType = listingTypeConfig[book.listing_type] || listingTypeConfig.sell;
                  const status = statusConfig[book.status] || statusConfig.available;
                  return (
                    <tr key={book.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          {book.cover_image_url && (
                            <img
                              src={book.cover_image_url}
                              alt={book.title}
                              style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
                            />
                          )}
                          <div>
                            <div className="fw-bold">{book.title}</div>
                            <div className="text-muted small">{book.author}</div>
                          </div>
                        </div>
                      </td>
                      <td>{book.owner?.name || 'N/A'}</td>
                      <td>
                        <Badge bg={listingType.bg}>{listingType.label}</Badge>
                      </td>
                      <td>
                        <Badge bg={status.bg}>{status.label}</Badge>
                      </td>
                      <td>
                        {book.price ? `${book.price} Coin` : book.coin_required ? `${book.coin_required} Coin` : 'Free'}
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            as={Link}
                            to={`/books/${book.id}`}
                            title="View Book"
                          >
                            <FaEye />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => confirmDelete(book)}
                            title="Delete Book"
                          >
                            <FaTrash />
                          </Button>
                        </div>
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
        Total Books: {filteredBooks.length}
      </div>

      <Modal show={deleteModal.show} onHide={() => setDeleteModal({ show: false, book: null })} centered>
        <Modal.Header closeButton>
          <Modal.Title>Unpublish Book</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Do you want to unpublish "{deleteModal.book?.title}"?</p>
          <Form.Control
            as="textarea"
            rows={2}
            placeholder="Reason"
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteModal({ show: false, book: null })}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Saving...' : 'Unpublish'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
