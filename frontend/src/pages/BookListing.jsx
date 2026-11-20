import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Container, Row, Col, Form, InputGroup, Button, Nav, Spinner, Alert } from 'react-bootstrap';
import { FaSearch, FaChevronLeft, FaChevronRight, FaBookOpen } from 'react-icons/fa';
import api from '../api/axios';
import BookCard from '../components/BookCard';

const listingTypes = [
  { value: '', label: 'All' },
  { value: 'donate', label: 'Donate' },
  { value: 'exchange', label: 'Exchange' },
  { value: 'adopt', label: 'Adopt' },
  { value: 'sell', label: 'Sell' },
];

const conditions = [
  { value: '', label: 'All Conditions' },
  { value: 'new', label: 'New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];
const genres = [
  { value: 'fiction', label: 'Fiction' },
  { value: 'other', label: 'Engineering'},
  { value: 'academic', label: 'Academic' },
  { value: 'children', label: 'Children' },
  { value: 'technology', label: 'Technology' },
  { value: 'science', label: 'Science' },
  { value: 'history', label: 'History' },
  { value: 'religion', label: 'Religion' },
  { value: 'other', label: 'Medical'},
  { value: 'other', label: 'Other' },
];
export default function BookListing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [listingType, setListingType] = useState(searchParams.get('type') || '');
  const [condition, setCondition] = useState(searchParams.get('condition') || '');
  const [genre, setGenre] = useState(searchParams.get('genre') || '');

  useEffect(() => {
    fetchBooks();
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (listingType) params.set('type', listingType);
    if (condition) params.set('condition', condition);
    if (genre) params.set('genre', genre);
    params.set('page', page);
    setSearchParams(params);
  }, [search, listingType, condition, genre, page]);

  const fetchBooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams(searchParams);
      queryParams.set('limit', '12');
      const data = await api.get(`/books?${queryParams.toString()}`);
      setBooks(data.books || []);
      setTotalPages(data.totalPages || 1);
      setPage(data.page || 1);
    } catch (err) {
      setError('There was a problem loading books');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (type) => {
    setListingType(type);
    setPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const renderSkeletons = () =>
    Array(6)
      .fill(0)
      .map((_, i) => (
        <Col key={i} md={4} sm={6}>
          <div className="skeleton-card">
            <div className="skeleton-image"></div>
            <div className="skeleton-text"></div>
            <div className="skeleton-text short"></div>
          </div>
        </Col>
      ));

  return (
    <Container className="py-4">
      <h2 className="mb-4">Book List</h2>

      <div className="filter-bar mb-4">
        <Nav variant="tabs" className="mb-3">
          {listingTypes.map((type) => (
            <Nav.Item key={type.value}>
              <Nav.Link
                active={listingType === type.value}
                onClick={() => handleTypeChange(type.value)}
                style={{ cursor: 'pointer' }}
              >
                {type.label}
              </Nav.Link>
            </Nav.Item>
          ))}
        </Nav>

        <Row className="g-3">
          <Col md={4}>
            <Form onSubmit={handleSearch}>
              <InputGroup>
                <Form.Control
                  placeholder="Search by book name or author"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Button variant="outline-secondary" type="submit">
                  <FaSearch />
                </Button>
              </InputGroup>
            </Form>
          </Col>
          <Col md={3}>
            <Form.Select
              value={genre}
              onChange={(e) => {
                setGenre(e.target.value);
                setPage(1);
              }}
            >
              {genres.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col md={3}>
            <Form.Select
              value={condition}
              onChange={(e) => {
                setCondition(e.target.value);
                setPage(1);
              }}
            >
              {conditions.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Form.Select>
          </Col>
        </Row>
      </div>

      {loading ? (
        <Row className="g-4">{renderSkeletons()}</Row>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : books.length === 0 ? (
        <div className="text-center py-5">
          <FaBookOpen size={64} className="text-muted mb-3" />
          <h4>No books found</h4>
          <p className="text-muted">Change your search and try again</p>
        </div>
      ) : (
        <>
          <Row className="g-4">
            {books.map((book) => (
              <Col key={book.id} md={4} sm={6}>
                <BookCard book={book} />
              </Col>
            ))}
          </Row>

          {totalPages > 1 && (
            <div className="d-flex justify-content-center align-items-center gap-3 mt-4">
              <Button
                variant="outline-secondary"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <FaChevronLeft />
              </Button>
              <span>
                Page {page} / {totalPages}
              </span>
              <Button
                variant="outline-secondary"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                <FaChevronRight />
              </Button>
            </div>
          )}
        </>
      )}
    </Container>
  );
}
