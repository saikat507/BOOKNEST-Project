import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, InputGroup } from 'react-bootstrap';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

export default function Login({ defaultRole = 'user' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: location.state?.role || defaultRole,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^(?!.*\.\.)(?!\.)[^\s@]+@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      const response = await login(formData.email, formData.password, formData.role);
      const loggedInUser = response.user || response;
      toast.success('Welcome! You have logged in successfully.');
      navigate(loggedInUser.role === 'admin' ? '/admin/dashboard' : from, { replace: true });
    } catch (error) {
      const message = error.response?.data?.message || 'There was a problem logging in';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page min-vh-100 d-flex align-items-center">
      <div className="login-bg"></div>
      <Container className="position-relative">
        <Row className="justify-content-center">
          <Col md={6} lg={5} xl={4}>
            <Card className="login-card shadow-lg border-0">
              <div className="login-card-header">
                <div className="brand-logo">📚</div>
                <h3 className="mb-1">Welcome Back</h3>
                <p className="text-white-50 mb-0">Sign in to your account</p>
              </div>
              <Card.Body className="p-4">
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-4">
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

                  <div className="text-end mb-3"><Link to="/forgot-password" className="register-link">Forgot password?</Link></div>

                  <Form.Group className="mb-4">
                    <Form.Label className="text-white">Password</Form.Label>
                    <InputGroup className="input-group-gradient">
                      <InputGroup.Text className="input-icon">
                        <FaLock />
                      </InputGroup.Text>
                      <Form.Control
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleChange}
                        isInvalid={!!errors.password}
                        autoComplete="current-password"
                        className="form-input"
                      />
                      <Button
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
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="text-white">Login as</Form.Label>
                    <div className="role-choice">
                      <Form.Check
                        inline
                        type="radio"
                        id="login-role-user"
                        name="role"
                        value="user"
                        label="Login as User"
                        checked={formData.role === 'user'}
                        onChange={handleChange}
                        className="text-white"
                      />
                      <Form.Check
                        inline
                        type="radio"
                        id="login-role-admin"
                        name="role"
                        value="admin"
                        label="Login as Admin"
                        checked={formData.role === 'admin'}
                        onChange={handleChange}
                        className="text-white"
                      />
                    </div>
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
                          Logging in...
                        </>
                      ) : (
                        'Login'
                      )}
                    </Button>
                  </div>
                </Form>

                <div className="text-center">
                  <p className="mb-0 text-white-50">
                    Do not have an account?{' '}
                    <Link to="/register" className="register-link">
                      Register
                    </Link>
                  </p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      <style>{`
        .login-page {
          background: linear-gradient(135deg, #1a472a 0%, #2E7D32 25%, #4CAF50 50%, #8BC34A 75%, #1B5E20 100%);
          overflow: hidden;
        }
        .login-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M50 5L55 15L55 25L65 30L55 35L55 45L65 50L55 55L55 65L65 70L55 75L55 85L65 90L50 95L35 90L35 85L25 80L35 75L35 65L25 60L35 55L35 45L25 40L35 35L35 25L25 20L35 15L35 5L50 5Z'/%3E%3C/g%3E%3C/svg%3E");
        }
        .login-card {
          border-radius: 24px;
          overflow: hidden;
          background: linear-gradient(145deg, rgba(26, 71, 42, 0.95) 0%, rgba(46, 125, 50, 0.9) 100%);
          backdrop-filter: blur(20px);
        }
        .login-card-header {
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
        .register-link {
          color: #8BC34A;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s ease;
        }
        .register-link:hover {
          color: #CDDC39;
          text-decoration: underline;
        }
        .form-label {
          font-weight: 500;
        }
        .role-choice {
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.18);
          padding: 12px 14px;
        }
      `}</style>
    </div>
  );
}
