import { Modal, Button, Form, Card, Alert } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCoin } from '../context/CoinContext';

export default function RequestModal({ show, onHide, book, requestType, onSuccess }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { coinBalance, refreshBalance } = useCoin();

  const [loading, setLoading] = useState(false);
  const [myBooks, setMyBooks] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (show && (requestType === 'exchange' || requestType === 'adopt')) {
      resetForm();
    }
  }, [show, requestType]);

  useEffect(() => {
    if (show && requestType === 'exchange') {
      fetchMyBooks();
    }
  }, [show, requestType]);

  const resetForm = () => {
    setSelectedBookId('');
    setMessage('');
  };

  const fetchMyBooks = async () => {
    try {
      const data = await api.get('/books/my-listed');
      setMyBooks(data.books || []);
    } catch (err) {
      console.error('Failed to fetch my books:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (requestType === 'donate' || requestType === 'exchange') {
      if (message.length < 10) {
        toast.error('Please enter at least 10 characters');
        return;
      }
    }

    if (requestType === 'exchange' && !selectedBookId) {
      toast.error('Please select a book');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        book_id: book.id,
        request_type: requestType,
        message,
      };

      if (requestType === 'exchange') {
        payload.offered_book_id = selectedBookId;
      }

      await api.post('/requests', payload);

      toast.success('Request sent successfully!');
      onSuccess?.();
      onHide();
    } catch (err) {
      toast.error(err.response?.data?.message || 'There was a problem sending the request');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (requestType) {
      case 'exchange':
        return 'Offer Exchange';
      case 'adopt':
        return 'Adopt';
      default:
        return 'Request';
    }
  };

  const renderContent = () => {
    if (requestType === 'exchange') {
      return (
        <>
          <p>You can offer one of the books below in exchange for "{book?.title}":</p>
          <Form.Group className="mb-3">
            <Form.Label>Select your book *</Form.Label>
            <Form.Select
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              required
            >
              <option value="">-- Select a book --</option>
              {myBooks
                .filter((b) => b.id !== book.id)
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} - {b.author}
                  </option>
                ))}
            </Form.Select>
            {myBooks.filter((b) => b.id !== book.id).length === 0 && (
              <Alert variant="warning" className="mt-2">
                You have no available books. Post a book first.
              </Alert>
            )}
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Message (at least 10 characters) *</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Why do you want this book? Enter at least 10 characters..."
              required
            />
            <Form.Text className="text-muted">
              ({message.length}/10 characters)
            </Form.Text>
          </Form.Group>
        </>
      );
    }

    if (requestType === 'adopt') {
      return (
        <>
          <p>You want to adopt "{book?.title}"</p>
          {book?.coin_required > 0 && (
            <Alert variant="warning">
              <strong>{book.coin_required} Coin</strong> will be held as a deposit
            </Alert>
          )}
        </>
      );
    }

    return (
      <>
        <p>You are requesting "{book?.title}"</p>
        <Form.Group>
          <Form.Label>Why do you want this book?</Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter at least 10 characters..."
            minLength={10}
            required
          />
          <Form.Text className="text-muted">
            ({message.length}/10 characters)
          </Form.Text>
        </Form.Group>
      </>
    );
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{getTitle()}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>{renderContent()}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button
            variant={
              requestType === 'adopt'
                ? 'warning'
                : requestType === 'exchange'
                ? 'primary'
                : 'success'
            }
            type="submit"
            disabled={
              loading ||
              (requestType === 'exchange' &&
                myBooks.filter((b) => b.id !== book.id).length === 0)
            }
          >
            {loading
              ? 'Sending...'
              : requestType === 'adopt'
              ? 'Adopt'
              : requestType === 'exchange'
              ? 'Offer Exchange'
              : 'Request'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}