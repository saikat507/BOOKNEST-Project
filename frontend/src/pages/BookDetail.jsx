import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Spinner, Alert, Button, Badge, Card } from 'react-bootstrap';
import { FaMapMarkerAlt, FaStar, FaUserCircle, FaFacebook, FaCalendarAlt, FaCoins, FaUndo } from 'react-icons/fa';
import { BsFillCheckCircleFill } from 'react-icons/bs';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCoin } from '../context/CoinContext';
import RequestModal from '../components/RequestModal';

const listingTypeConfig = {
  donate: { label: 'Donate', bg: 'success' },
  exchange: { label: 'Exchange', bg: 'primary' },
  adopt: { label: 'Adopt', bg: 'warning' },
  sell: { label: 'Sell', bg: 'danger' },
};

const conditionConfig = {
  new: 'New',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
};

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { coinBalance, refreshBalance } = useCoin();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [modalRequestType, setModalRequestType] = useState('donate');
  const [returnInfo, setReturnInfo] = useState(null);
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    fetchBook();
    if (isAuthenticated) {
      fetchReturnInfo();
    } else {
      setReturnInfo(null);
    }
  }, [id, isAuthenticated]);

  const fetchBook = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(`/books/${id}`);
      setBook(data.book || data);
    } catch (err) {
      setError('There was a problem loading book details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (coinBalance < book.price) {
      alert('You do not have enough coins');
      return;
    }
    if (confirm(`Are you sure you want to buy this book for ${book.price} Coins?`)) {
      try {
        await api.post(`/books/${id}/buy`);
        refreshBalance();
        alert('Book purchased successfully!');
        fetchBook();
      } catch (err) {
        alert(err.response?.data?.message || 'There was a problem buying the book');
      }
    }
  };

  const fetchReturnInfo = async () => {
    try {
      const data = await api.get('/bookreturns/my');
      const matchingReturn = (data.returns || []).find((item) => item.transaction?.book?.id === Number(id));
      setReturnInfo(matchingReturn || null);
    } catch (err) {
      console.error('Failed to load return info:', err);
    }
  };

  const handleReturnBook = async () => {
    if (!returnInfo) return;
    if (!confirm('Do you want to return this book now?')) return;

    setReturning(true);
    try {
      const data = await api.put(`/bookreturns/${returnInfo.id}/return`);
      toast.success(data.message || 'Book returned successfully');
      refreshBalance();
      fetchBook();
      fetchReturnInfo();
    } catch (err) {
      toast.error(err.response?.data?.message || 'There was a problem returning this book');
    } finally {
      setReturning(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="d-flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            size={16}
            color={star <= rating ? '#ffc107' : '#dee2e6'}
            fill={star <= rating ? '#ffc107' : '#dee2e6'}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (error || !book) {
    return (
      <Container className="py-4">
        <Alert variant="danger">{error || 'Book not found'}</Alert>
      </Container>
    );
  }

  const listingType = listingTypeConfig[book.listing_type] || listingTypeConfig.sell;
  const owner = book.owner || {};
  const canReturnBorrowedBook = returnInfo && (returnInfo.status === 'borrowed' || returnInfo.status === 'late');

  return (
    <Container className="py-4">
      <Row>
        <Col lg={8}>
          <Card className="mb-4">
            <Row className="g-0">
              <Col md={4}>
                {book.cover_image_url ? (
                  <img
                    src={book.cover_image_url}
                    alt={book.title}
                    className="img-fluid rounded-start"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    className="d-flex align-items-center justify-content-center bg-light rounded-start"
                    style={{ height: '300px' }}
                  >
                    <span className="text-muted">No Image</span>
                  </div>
                )}
              </Col>
              <Col md={8}>
                <Card.Body>
                  <div className="d-flex gap-2 mb-2">
                    <Badge bg={listingType.bg}>{listingType.label}</Badge>
                    <Badge bg="secondary">
                      {conditionConfig[book.condition] || book.condition}
                    </Badge>
                    {book.genre && <Badge bg="info">{book.genre}</Badge>}
                  </div>
                  <Card.Title className="h3 mb-2">{book.title}</Card.Title>
                  <Card.Subtitle className="text-muted mb-3">
                    {book.author}
                  </Card.Subtitle>
                  {book.description && (
                    <Card.Text className="mb-3">{book.description}</Card.Text>
                  )}
                  {book.pickup_location && (
                    <div className="d-flex align-items-center gap-2 text-muted mb-2">
                      <FaMapMarkerAlt />
                      <span>{book.pickup_location}</span>
                    </div>
                  )}
                  {book.listing_type === 'sell' ? (
                    <div className="h4 text-warning">{book.price} Coin</div>
                  ) : book.coin_required > 0 ? (
                    <div className="h5 text-muted">{book.coin_required} Coin</div>
                  ) : (
                    <div className="h5 text-success">Free</div>
                  )}
                </Card.Body>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="mb-4">
            <Card.Body>
              <h5>Owner</h5>
              <div className="d-flex align-items-center gap-3 mb-3">
                {owner.avatar ? (
                  <img
                    src={owner.avatar}
                    alt={owner.name}
                    style={{ width: 50, height: 50, borderRadius: '50%' }}
                  />
                ) : (
                  <FaUserCircle size={50} className="text-muted" />
                )}
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-bold">{owner.name}</span>
                    {owner.is_verified && (
                      <BsFillCheckCircleFill className="text-primary" size={16} />
                    )}
                  </div>
                  {owner.rating && (
                    <div className="d-flex align-items-center gap-1">
                      {renderStars(owner.rating)}
                      <span className="text-muted small">({owner.reviewCount || 0})</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="d-grid gap-2">
                {isAuthenticated && owner.id !== user?.id && (
                  <>
                    {owner.facebook_url ? (
                      <Button
                        variant="primary"
                        href={owner.facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FaFacebook className="me-2" />
                        Contact on Facebook
                      </Button>
                    ) : (
                      <Button
                        variant="outline-secondary"
                        disabled
                      >
                        Facebook link not added
                      </Button>
                    )}
                    {book.listing_type === 'donate' && (
                      <Button variant="success" onClick={() => setShowRequestModal(true)}>
                        Request
                      </Button>
                    )}
                    {book.listing_type === 'exchange' && (
                      <Button
                        variant="primary"
                        onClick={() => {
                          setModalRequestType('exchange');
                          setShowRequestModal(true);
                        }}
                      >
                        Offer Exchange
                      </Button>
                    )}
                    {book.listing_type === 'adopt' && (
                      <Button
                        variant="warning"
                        onClick={() => {
                          setModalRequestType('adopt');
                          setShowRequestModal(true);
                        }}
                      >
                        Adopt
                      </Button>
                    )}
                    {book.listing_type === 'sell' && (
                      <Button
                        variant="danger"
                        onClick={() => {
                          setModalRequestType('buy');
                          setShowRequestModal(true);
                        }}
                      >
                        Buy ({book.price} Coin)
                      </Button>
                    )}
                  </>
                )}
                {(!isAuthenticated || owner.id === user?.id) && (
                  <Button variant="outline-secondary" disabled>
                    {owner.id === user?.id ? 'Your Book' : 'Log in to request'}
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>

          {returnInfo && (
            <Card className="mb-4">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Return Details</h5>
                  <Badge bg={returnInfo.status === 'late' ? 'danger' : returnInfo.status === 'returned' ? 'success' : 'primary'}>
                    {returnInfo.status}
                  </Badge>
                </div>
                <div className="small text-muted d-flex align-items-center gap-2 mb-2">
                  <FaCalendarAlt />
                  <span>Due Date: {new Date(returnInfo.due_date).toLocaleDateString()}</span>
                </div>
                <div className={returnInfo.status === 'late' ? 'small text-danger mb-2' : 'small text-success mb-2'}>
                  {returnInfo.status === 'late'
                    ? `Late by ${returnInfo.lateDays || 0} days`
                    : returnInfo.status === 'returned'
                      ? `Returned on ${new Date(returnInfo.actual_return_date).toLocaleDateString()}`
                      : `${returnInfo.daysRemaining || 0} days left`}
                </div>
                <div className="small text-muted d-flex align-items-center gap-2 mb-3">
                  <FaCoins />
                  <span>Fine: {Number(returnInfo.fine_amount || 0)} Coin</span>
                </div>
                {canReturnBorrowedBook && (
                  <Button
                    variant={returnInfo.status === 'late' ? 'danger' : 'primary'}
                    className="w-100"
                    onClick={handleReturnBook}
                    disabled={returning}
                  >
                    <FaUndo className="me-2" />
                    {returning ? 'Returning...' : 'Return Book'}
                  </Button>
                )}
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {book.reviews && book.reviews.length > 0 && (
        <Row>
          <Col>
            <Card>
              <Card.Body>
                <h5 className="mb-3">Reviews</h5>
                {book.reviews.map((review) => (
                  <div key={review.id} className="border-bottom pb-3 mb-3">
                    <div className="d-flex justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <FaUserCircle />
                        <span className="fw-bold">{review.reviewer?.name || 'BookNest user'}</span>
                      </div>
                      {renderStars(review.rating)}
                    </div>
                    <p className="text-muted mb-0">{review.comment}</p>
                  </div>
                ))}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <RequestModal
        show={showRequestModal}
        onHide={() => setShowRequestModal(false)}
        book={book}
        requestType={modalRequestType}
        onSuccess={fetchBook}
      />
    </Container>
  );
}
