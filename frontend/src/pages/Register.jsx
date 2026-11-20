import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, InputGroup } from 'react-bootstrap';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { getPasswordChecks, getPasswordStrength } from '../utils/passwordPolicy';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const passwordChecks = getPasswordChecks(formData.password, formData);
  const passwordStrength = getPasswordStrength(passwordChecks, formData.password);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^(?!.*\.\.)(?!\.)[^\s@]+@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email';
    }

    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^(?:01[3-9]\d{8}|\+8801[3-9]\d{8})$/.test(formData.phone)) {
      newErrors.phone = 'Enter a valid Bangladesh mobile number (01XXXXXXXXX or +8801XXXXXXXXX)';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (passwordChecks.some((check) => !check.valid)) {
      newErrors.password = 'Meet all password requirements below.';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      await register(formData.name, formData.email, formData.password, formData.phone, formData.confirmPassword);
      toast.success('Welcome! Your account has been created. You received +50 Coins!');
      navigate('/');
    } catch (error) {
      const message = error.response?.data?.message || 'There was a problem registering';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page min-vh-100 d-flex align-items-center">
      <div className="register-bg"></div>
      <Container className="position-relative py-5">
        <Row className="justify-content-center">
          <Col md={6} lg={5} xl={4}>
            <Card className="register-card shadow-lg border-0">
              <div className="register-card-header">
                <div className="brand-logo">📚</div>
                <h3 className="mb-1">Create Account</h3>
                <p className="text-white-50 mb-0">Create a new account</p>
              </div>
              <Card.Body className="p-4">
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-white">Your Name</Form.Label>
                    <InputGroup className="input-group-gradient">
                      <InputGroup.Text className="input-icon">
                        <FaUser />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        name="name"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={handleChange}
                        isInvalid={!!errors.name}
                        autoComplete="name"
                        className="form-input"
                      />
                    </InputGroup>
                    {errors.name && (
                      <Form.Control.Feedback type="invalid">
                        {errors.name}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="text-white">Email</Form.Label>
                    <InputGroup className="input-group-gradient">
                      <InputGroup.Text className="input-icon">
                        <FaEnvelope />
                      </InputGroup.Text>
                      <Form.Control
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleChange}
                        isInvalid={!!errors.email}
                        autoComplete="email"
                        className="form-input"
                      />
                    </InputGroup>
                    {errors.email && (
                      <Form.Control.Feedback type="invalid">
                        {errors.email}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="text-white">Phone Number</Form.Label>
                    <InputGroup className="input-group-gradient">
                      <InputGroup.Text className="input-icon">
                        <FaPhone />
                      </InputGroup.Text>
                      <Form.Control
                        type="tel"
                        name="phone"
                        placeholder="01XXXXXXXXX"
                        value={formData.phone}
                        maxLength={14}
                        onChange={handleChange}
                        isInvalid={!!errors.phone}
                        autoComplete="tel"
                        className="form-input"
                      />
                    </InputGroup>
                    {errors.phone && (
                      <Form.Control.Feedback type="invalid">
                        {errors.phone}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="text-white">Password</Form.Label>
                    <InputGroup className="input-group-gradient">
                      <InputGroup.Text className="input-icon">
                        <FaLock />
                      </InputGroup.Text>
                      <Form.Control
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="Enter password"
                        value={formData.password}
                        maxLength={128}
                        onChange={handleChange}
                        isInvalid={!!errors.password}
                        autoComplete="new-password"
                        className="form-input"
                      />
                      <Button
                        type="button"
                        variant="outline-light"
                        onClick={() => setShowPassword(!showPassword)}
                        className="eye-btn"
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </Button>
                    </InputGroup>
                    {errors.password && (
                      <Form.Control.Feedback type="invalid">
                        {errors.password}
                      </Form.Control.Feedback>
                    )}
                    {formData.password && (
                      <div className="small text-white mt-2" aria-live="polite">
                        <div className="mb-1">Strength: <strong>{passwordStrength}</strong></div>
                        <ul className="list-unstyled mb-0">
                          {passwordChecks.map((check) => (
                            <li key={check.label} className={check.valid ? 'text-success' : 'text-white-50'}>
                              {check.valid ? '✓' : '○'} {check.label}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="text-white">Confirm password</Form.Label>
                    <InputGroup className="input-group-gradient">
                      <InputGroup.Text className="input-icon">
                        <FaLock />
                      </InputGroup.Text>
                      <Form.Control
                        type={showPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        placeholder="Confirm password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        isInvalid={!!errors.confirmPassword}
                        autoComplete="new-password"
                        className="form-input"
                      />
                    </InputGroup>
                    {errors.confirmPassword && (
                      <Form.Control.Feedback type="invalid">
                        {errors.confirmPassword}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>

                  <div className="d-grid mb-4">
                    <Button
                      variant="success"
                      type="submit"
                      size="lg"
                      disabled={loading}
                      className="submit-btn"
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Registering...
                        </>
                      ) : (
                        'Register'
                      )}
                    </Button>
                  </div>
                </Form>

                <div className="text-center">
                  <p className="mb-0 text-white-50">
                    Already have an account?{' '}
                    <Link to="/login" className="login-link">
                      Login
                    </Link>
                  </p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      <style>{`
        .register-page {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #16213e 75%, #1a1a2e 100%);
          overflow: hidden;
        }
        .register-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M30 5L35 15L35 25L45 30L35 35L35 45L45 50L30 55L15 50L15 45L5 40L15 35L15 25L5 20L15 15L15 5L30 5Z'/%3E%3C/g%3E%3C/svg%3E");
        }
        .register-card {
          border-radius: 24px;
          overflow: hidden;
          background: linear-gradient(145deg, rgba(22, 33, 62, 0.95) 0%, rgba(15, 52, 96, 0.9) 100%);
          backdrop-filter: blur(20px);
        }
        .register-card-header {
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.1) 100%);
          padding: 32px;
          text-align: center;
          color: white;
        }
        .brand-logo {
          font-size: 3rem;
          margin-bottom: 8px;
        }
        .input-group-gradient {
          border-radius: 50px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }
        .input-group-gradient:focus-within {
          border-color: #4CAF50;
          box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.2);
        }
        .input-icon {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.7);
        }
        .form-input {
          background: transparent;
          border: none;
          color: white;
          border-left: 1px solid rgba(255, 255, 255, 0.2);
        }
        .form-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }
        .form-input:focus {
          background: transparent;
          box-shadow: none;
          color: white;
        }
        .eye-btn {
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.7);
        }
        .eye-btn:hover {
          color: white;
          background: transparent;
        }
        .submit-btn {
          border-radius: 50px;
          background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%);
          border: none;
          padding: 14px;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(76, 175, 80, 0.4);
        }
        .submit-btn:disabled {
          opacity: 0.7;
        }
        .login-link {
          color: #4CAF50;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s ease;
        }
        .login-link:hover {
          color: #8BC34A;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
