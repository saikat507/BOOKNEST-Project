import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { Container, Form, Button, Row, Col, Card, Alert } from 'react-bootstrap';
import { FaDonate, FaExchangeAlt, FaHandHoldingHeart, FaCoins, FaImage, FaCloudUploadAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api/axios';

const listingTypes = [
  { value: 'donate', label: 'Donate', icon: FaDonate, color: 'success', desc: 'Donate books and get +20 Coins' },
  { value: 'exchange', label: 'Exchange', icon: FaExchangeAlt, color: 'primary', desc: 'Exchange books, both get +15 Coins' },
  { value: 'adopt', label: 'Adopt', icon: FaHandHoldingHeart, color: 'warning', desc: 'Borrow temporarily' },
  { value: 'sell', label: 'Sell', icon: FaCoins, color: 'danger', desc: 'Sell for Coins' },
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

const conditions = [
  { value: 'new', label: 'New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

export default function AddBook() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      listing_type: 'donate',
      title: '',
      author: '',
      genre: '',
      condition: 'good',
      description: '',
      price: '',
      return_period: '',
      coin_required: '',
      location: '',
    },
  });

  const selectedType = watch('listing_type');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('listing_type', data.listing_type);
      formData.append('title', data.title);
      formData.append('author', data.author);
      formData.append('genre', data.genre);
      formData.append('condition', data.condition);
      formData.append('description', data.description);
      formData.append('pickup_location', data.location);

      if (data.price) formData.append('price', data.price);
      if (data.return_period) formData.append('return_days', data.return_period);
      if (data.coin_required) formData.append('coin_required', data.coin_required);
      if (imageFile) formData.append('cover_image', imageFile);

      await api.post('/books', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Book posted successfully!');
      navigate('/my-books');
    } catch (err) {
      toast.error(err.response?.data?.message || 'There was a problem posting the book');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <h2 className="mb-4">Post a Book</h2>

      <Form onSubmit={handleSubmit(onSubmit)}>
        <Row className="mb-4">
          <Col>
            <h5 className="mb-3">Select Book Type</h5>
            <Row className="g-3">
              {listingTypes.map((type) => (
                <Col key={type.value} md={3} sm={6}>
                  <Card
                    className={`text-center p-3 type-card ${
                      selectedType === type.value ? `border-${type.color} bg-light` : ''
                    }`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setValue('listing_type', type.value)}
                  >
                    <type.icon size={32} className={`text-${type.color} mb-2`} />
                    <h6>{type.label}</h6>
                    <small className="text-muted">{type.desc}</small>
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>

        <Card className="mb-4">
          <Card.Body>
            <h5 className="mb-3">Book Information</h5>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Book Title *</Form.Label>
                  <Form.Control
                    {...register('title', { required: 'Book title is required' })}
                    isInvalid={!!errors.title}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.title?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Author *</Form.Label>
                  <Form.Control
                    {...register('author', { required: 'Author name is required' })}
                    isInvalid={!!errors.author}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.author?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Type</Form.Label>
                  <Form.Select {...register('genre')}>
                    <option value="">-- Select --</option>
                    {genres.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Condition</Form.Label>
                  <Form.Select {...register('condition')}>
                    {conditions.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    {...register('description')}
                    placeholder="Tell something about the book..."
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="mb-4">
          <Card.Body>
            <h5 className="mb-3">Book Image</h5>
            <div
              className="image-upload-area text-center p-5 border rounded"
              style={{
                border: '2px dashed #dee2e6',
                cursor: 'pointer',
                backgroundColor: imagePreview ? 'transparent' : '#f8f9fa',
              }}
              onClick={() => document.getElementById('image-input').click()}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ maxHeight: '300px', maxWidth: '100%' }}
                />
              ) : (
                <>
                  <FaCloudUploadAlt size={48} className="text-muted mb-2" />
                  <p className="text-muted mb-0">
                    Click or drag here to upload an image
                  </p>
                </>
              )}
              <Form.Control
                id="image-input"
                type="file"
                accept="image/*"
                className="d-none"
                onChange={handleImageChange}
              />
            </div>
          </Card.Body>
        </Card>

        {(selectedType === 'sell' || selectedType === 'adopt' || selectedType !== 'sell') && (
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Additional Information</h5>
              <Row className="g-3">
                {selectedType === 'sell' && (
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Price (Coin)</Form.Label>
                      <Form.Control
                        type="number"
                        {...register('price')}
                        placeholder="How many coins do you want to sell for?"
                      />
                    </Form.Group>
                  </Col>
                )}
                {selectedType === 'adopt' && (
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Return Period (days)</Form.Label>
                      <Form.Control
                        type="number"
                        {...register('return_period')}
                        placeholder="After how many days should it be returned?"
                      />
                    </Form.Group>
                  </Col>
                )}
                {selectedType !== 'sell' && (
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Coin Required (optional)</Form.Label>
                      <Form.Control
                        type="number"
                        {...register('coin_required')}
                        placeholder="Other coins"
                      />
                    </Form.Group>
                  </Col>
                )}
              </Row>
            </Card.Body>
          </Card>
        )}

        <Card className="mb-4">
          <Card.Body>
            <h5 className="mb-3">Pickup Information</h5>
            <Form.Group>
              <Form.Label>Pickup Location</Form.Label>
              <Form.Control
                {...register('location')}
                placeholder="Where should it be picked up?"
              />
            </Form.Group>
          </Card.Body>
        </Card>

        <div className="d-grid">
          <Button variant="primary" type="submit" size="lg" disabled={loading}>
            {loading ? 'Posting...' : 'Post a Book'}
          </Button>
        </div>
      </Form>
    </Container>
  );
}