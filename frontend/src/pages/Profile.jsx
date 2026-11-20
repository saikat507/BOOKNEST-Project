import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { FaUser, FaEnvelope, FaPhone, FaCheck, FaTimes, FaFacebook, FaMapMarkerAlt, FaBriefcase, FaUniversity } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import profileBg from "../assets/pp.jpg";
import { getPasswordChecks, getPasswordStrength } from '../utils/passwordPolicy';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const verificationLabel = user?.is_verified
    ? 'Verified'
    : user?.verification_status === 'pending'
      ? 'Pending'
      : user?.verification_status === 'rejected'
        ? 'Rejected'
        : 'Not Submitted';
  const verificationVariant = user?.is_verified
    ? 'success'
    : user?.verification_status === 'pending'
      ? 'warning'
      : user?.verification_status === 'rejected'
        ? 'danger'
        : 'secondary';

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    facebook_url: user?.facebook_url || '',
    address: user?.address || '',
    profession: user?.profession || '',
    institute: user?.institute || '',
  });
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const passwordChecks = getPasswordChecks(passwordForm.newPassword, { name: user?.name || '', email: user?.email || '' });
  const passwordStrength = getPasswordStrength(passwordChecks, passwordForm.newPassword);

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        facebook_url: user.facebook_url || '',
        address: user.address || '',
        profession: user.profession || '',
        institute: user.institute || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size cannot exceed 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (formData.phone && !/^(?:01[3-9]\d{8}|\+8801[3-9]\d{8})$/.test(formData.phone)) {
      toast.error('Enter a valid Bangladesh mobile number (01XXXXXXXXX or +8801XXXXXXXXX).');
      return;
    }

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('phone', formData.phone || '');
      payload.append('facebook_url', formData.facebook_url || '');
      payload.append('address', formData.address || '');
      payload.append('profession', formData.profession || '');
      payload.append('institute', formData.institute || '');
      
      if (imageFile) {
        payload.append('profile_image', imageFile);
      }

      const response = await api.put('/auth/profile', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const updatedUser = response.user;
      updateUser(updatedUser);
      toast.success('Profile updated');
      setEditMode(false);
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      console.error('Profile update error:', err);
      toast.error(err.response?.data?.message || 'There was a problem updating');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadID = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size cannot exceed 10MB');
      return;
    }

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('id_document', file);

      const response = await api.post('/auth/upload-id', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      updateUser(response.user);
      toast.success('ID uploaded. Your verification request is pending review.');
    } catch (err) {
      console.error('ID upload error:', err);
      toast.error(err.response?.data?.message || 'There was a problem uploading');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordChecks.some((check) => !check.valid)) return toast.error('Meet all password requirements.');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast.error('Passwords do not match.');
    setPasswordLoading(true);
    try {
      await api.put('/auth/change-password', passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCancel = () => {
      setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      facebook_url: user?.facebook_url || '',
      address: user?.address || '',
      profession: user?.profession || '',
      institute: user?.institute || '',
    });
    setImagePreview(null);
    setImageFile(null);
    setEditMode(false);
  };

  const userProfileImage = imagePreview || user?.profile_image_url;

  return (
  <div
    className="profile-page"
    style={{
      backgroundImage: `url(${profileBg})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      minHeight: "100vh",
      padding: "40px 0",
      backgroundAttachment: "fixed"
    }}
  >
    <Container className="py-4">
      <h1 className="mb-4 text-white">My Profile</h1>

      <Row className="g-4">
        <Col md={4}>
          <Card
  className="text-center p-4 shadow"
  style={{
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(10px)",
    borderRadius: "20px",
    border: "none"
  }}
>
            {userProfileImage ? (
              <img
                src={userProfileImage}
                alt="Profile"
                className="rounded-circle mb-3"
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

            {editMode && (
              <div className="mb-3">
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>
            )}

            <h4>{user?.name || 'Unknown'}</h4>
            <p className="text-muted mb-2">{user?.email || 'No email'}</p>

            <Badge bg={verificationVariant} className="mb-2">
              {user?.is_verified ? (
                <>
                  <FaCheck className="me-1" /> Verified
                </>
              ) : (
                <>
                  <FaTimes className="me-1" /> {verificationLabel}
                </>
              )}
            </Badge>

            {user?.role === 'admin' && (
              <Badge bg="danger" className="d-block mb-2">
                Admin
              </Badge>
            )}
            
            {user?.role === 'moderator' && (
              <Badge bg="info" className="d-block mb-2">
                Moderator
              </Badge>
            )}
          </Card>
        </Col>

        <Col md={8}>
          <Card
  className="p-4 mb-4 shadow"
  style={{
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(10px)",
    borderRadius: "20px",
    border: "none"
  }}
>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="mb-0">Profile Information</h4>
              {!editMode && (
                <Button variant="outline-primary" onClick={() => setEditMode(true)}>
                  Edit
                </Button>
              )}
            </div>

            {editMode ? (
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-light"
                  />
                  <Form.Text className="text-muted">
                   
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+8801XXXXXXXXX"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label><FaFacebook className="me-2" />Facebook Profile URL</Form.Label>
                  <Form.Control
                    type="url"
                    name="facebook_url"
                    value={formData.facebook_url}
                    onChange={handleChange}
                    placeholder="https://facebook.com/yourprofile"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label><FaMapMarkerAlt className="me-2" />Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Your address"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label><FaBriefcase className="me-2" />Profession</Form.Label>
                  <Form.Control
                    type="text"
                    name="profession"
                    value={formData.profession}
                    onChange={handleChange}
                    placeholder="Student, Teacher, Engineer..."
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label><FaUniversity className="me-2" />Institute</Form.Label>
                  <Form.Control
                    type="text"
                    name="institute"
                    value={formData.institute}
                    onChange={handleChange}
                    placeholder="School, college, university or workplace"
                  />
                </Form.Group>

                <div className="d-flex gap-2">
                  <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Saving...
                      </>
                    ) : (
                      'Save'
                    )}
                  </Button>
                  <Button variant="secondary" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              </Form>
            ) : (
              <>
                <div className="mb-3">
                  <div className="d-flex align-items-center gap-2 text-muted mb-1">
                    <FaUser />
                    <span>Name</span>
                  </div>
                  <div className="fw-bold">{user?.name || 'N/A'}</div>
                </div>

                <div className="mb-3">
                  <div className="d-flex align-items-center gap-2 text-muted mb-1">
                    <FaEnvelope />
                    <span>Email</span>
                  </div>
                  <div className="fw-bold">{user?.email || 'N/A'}</div>
                </div>

                <div className="mb-3">
                  <div className="d-flex align-items-center gap-2 text-muted mb-1">
                    <FaPhone />
                    <span>Phone</span>
                  </div>
                  <div className="fw-bold">{user?.phone || 'N/A'}</div>
                </div>

                <div className="mb-3">
                  <div className="d-flex align-items-center gap-2 text-muted mb-1">
                    <FaFacebook />
                    <span>Facebook</span>
                  </div>
                  {user?.facebook_url ? (
                    <a href={user.facebook_url} target="_blank" rel="noopener noreferrer" className="fw-bold text-primary text-decoration-none">
                      {user.facebook_url}
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
                  <div className="fw-bold">{user?.address || 'N/A'}</div>
                </div>

                <div className="mb-3">
                  <div className="d-flex align-items-center gap-2 text-muted mb-1">
                    <FaBriefcase />
                    <span>Profession</span>
                  </div>
                  <div className="fw-bold">{user?.profession || 'N/A'}</div>
                </div>

                <div className="mb-3">
                  <div className="d-flex align-items-center gap-2 text-muted mb-1">
                    <FaUniversity />
                    <span>Institute</span>
                  </div>
                  <div className="fw-bold">{user?.institute || 'N/A'}</div>
                </div>
              </>
            )}
          </Card>

          <Card
  className="p-4 shadow"
  style={{
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(10px)",
    borderRadius: "20px",
    border: "none"
  }}
>
            <h4 className="mb-4">ID Verification</h4>

            {user?.is_verified ? (
              <Alert variant="success">
                <FaCheck className="me-2" />
                Your account has been verified
              </Alert>
            ) : user?.verification_status === 'pending' ? (
              <Alert variant="warning">
                Your verification request is pending review.
              </Alert>
            ) : user?.verification_status === 'rejected' ? (
              <>
                <Alert variant="danger">
                  Your verification request was rejected. {user?.verification?.rejection_reason || user?.rejection_reason || ''}
                </Alert>
                <Form.Control
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleUploadID}
                  disabled={loading}
                />
              </>
            ) : (
              <>
                <p className="text-muted mb-3">
                  Upload your National ID or Birth Certificate. Your account will be reviewed after upload.
                </p>
                <Form.Control
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleUploadID}
                  disabled={loading}
                />
                {loading && (
                  <div className="mt-2">
                    <Spinner size="sm" className="me-2" />
                    Uploading...
                  </div>
                )}
              </>
            )}
          </Card>
        </Col>
      </Row>
      <Card className="mt-4 p-4 shadow" style={{ background: 'rgba(255,255,255,0.92)', borderRadius: '20px', border: 'none' }}>
        <h4>Change password</h4>
        <Form onSubmit={handlePasswordChange}>
          {['currentPassword', 'newPassword', 'confirmPassword'].map((field) => (
            <Form.Group className="mb-3" key={field}>
              <Form.Label>{field === 'currentPassword' ? 'Current password' : field === 'newPassword' ? 'New password' : 'Confirm new password'}</Form.Label>
              <Form.Control
                type={passwordVisible ? 'text' : 'password'}
                autoComplete={field === 'currentPassword' ? 'current-password' : 'new-password'}
                maxLength={field === 'newPassword' || field === 'confirmPassword' ? 128 : undefined}
                value={passwordForm[field]}
                onChange={(event) => setPasswordForm((previous) => ({ ...previous, [field]: event.target.value }))}
                required
              />
            </Form.Group>
          ))}
          <Form.Check className="mb-3" type="checkbox" label="Show passwords" checked={passwordVisible} onChange={(event) => setPasswordVisible(event.target.checked)} />
          {passwordForm.newPassword && <div className="mb-3" aria-live="polite">
            <div>Password strength: <strong>{passwordStrength}</strong></div>
            <ul className="list-unstyled mb-0">{passwordChecks.map((check) => <li key={check.label} className={check.valid ? 'text-success' : 'text-muted'}>{check.valid ? '✓' : '○'} {check.label}</li>)}</ul>
          </div>}
          {passwordForm.confirmPassword && passwordForm.confirmPassword !== passwordForm.newPassword && <div className="text-danger mb-3">Passwords do not match.</div>}
          <Button type="submit" disabled={passwordLoading}>{passwordLoading ? 'Updating…' : 'Update password'}</Button>
        </Form>
      </Card>
        </Container>
  </div>
  );
}
