import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, Badge, Button, Card, Col, Container, Row, Spinner } from 'react-bootstrap';
import { FaArrowLeft, FaBriefcase, FaCheck, FaEnvelope, FaFacebook, FaMapMarkerAlt, FaPhone, FaTimes, FaUniversity, FaUser } from 'react-icons/fa';
import api from '../api/axios';

export default function UserProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api.get(`/users/${id}`);
        setProfile(data.user);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Profile load korte problem hoyeche');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (error || !profile) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error || 'Profile not found'}</Alert>
        <Button as={Link} to="/my-requests" variant="outline-secondary">
          <FaArrowLeft className="me-2" />
          Back to Requests
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Button as={Link} to="/my-requests" variant="outline-secondary" className="mb-4">
        <FaArrowLeft className="me-2" />
        Back to Requests
      </Button>

      <Row className="g-4 justify-content-center">
        <Col lg={4} md={5}>
          <Card className="text-center p-4 shadow-sm">
            {profile.profile_image_url ? (
              <img
                src={profile.profile_image_url}
                alt={profile.name}
                className="rounded-circle mx-auto mb-3"
                style={{ width: 150, height: 150, objectFit: 'cover' }}
              />
            ) : (
              <div
                className="rounded-circle bg-light d-flex align-items-center justify-content-center mx-auto mb-3"
                style={{ width: 150, height: 150 }}
              >
                <FaUser size={64} className="text-muted" />
              </div>
            )}

            <h3 className="mb-2">{profile.name || 'Unknown User'}</h3>
            <Badge bg={profile.is_verified ? 'success' : profile.verification_status === 'pending' ? 'warning' : profile.verification_status === 'rejected' ? 'danger' : 'secondary'} className="mx-auto">
              {profile.is_verified ? (
                <>
                  <FaCheck className="me-1" /> Verified
                </>
              ) : (
                <>
                  <FaTimes className="me-1" /> {profile.verification_status === 'pending' ? 'Pending' : profile.verification_status === 'rejected' ? 'Rejected' : 'Not Submitted'}
                </>
              )}
            </Badge>
          </Card>
        </Col>

        <Col lg={7} md={7}>
          <Card className="p-4 shadow-sm">
            <h4 className="mb-4">Requester Profile</h4>

            <div className="mb-3">
              <div className="d-flex align-items-center gap-2 text-muted mb-1">
                <FaUser />
                <span>Name</span>
              </div>
              <div className="fw-bold">{profile.name || 'N/A'}</div>
            </div>

            <div className="mb-3">
              <div className="d-flex align-items-center gap-2 text-muted mb-1">
                <FaEnvelope />
                <span>Email</span>
              </div>
              <div className="fw-bold">{profile.email || 'N/A'}</div>
            </div>

            <div className="mb-3">
              <div className="d-flex align-items-center gap-2 text-muted mb-1">
                <FaPhone />
                <span>Phone</span>
              </div>
              <div className="fw-bold">{profile.phone || 'N/A'}</div>
            </div>

            <div className="mb-4">
              <div className="d-flex align-items-center gap-2 text-muted mb-1">
                <FaFacebook />
                <span>Facebook</span>
              </div>
              {profile.facebook_url ? (
                <a
                  href={profile.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fw-bold text-primary text-decoration-none"
                >
                  {profile.facebook_url}
                </a>
              ) : (
                <div className="fw-bold text-muted">N/A</div>
              )}
            </div>

            <div className="mb-3">
              <div className="d-flex align-items-center gap-2 text-muted mb-1">
                <FaMapMarkerAlt />
                <span>Address</span>
              </div>
              <div className="fw-bold">{profile.address || 'N/A'}</div>
            </div>

            <div className="mb-3">
              <div className="d-flex align-items-center gap-2 text-muted mb-1">
                <FaBriefcase />
                <span>Profession</span>
              </div>
              <div className="fw-bold">{profile.profession || 'N/A'}</div>
            </div>

            <div className="mb-4">
              <div className="d-flex align-items-center gap-2 text-muted mb-1">
                <FaUniversity />
                <span>Institute</span>
              </div>
              <div className="fw-bold">{profile.institute || 'N/A'}</div>
            </div>

            {profile.facebook_url && (
              <Button
                as="a"
                href={profile.facebook_url}
                target="_blank"
                rel="noopener noreferrer"
                variant="primary"
                className="align-self-start d-inline-flex align-items-center gap-2"
              >
                <FaFacebook />
                Open Facebook Profile
              </Button>
            )}
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
