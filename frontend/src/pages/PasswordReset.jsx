import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Card, Container, Form } from 'react-bootstrap';
import api from '../api/axios';
import { getPasswordChecks, getPasswordStrength } from '../utils/passwordPolicy';

export default function PasswordReset() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [requested, setRequested] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const checks = getPasswordChecks(newPassword);
  const strength = getPasswordStrength(checks, newPassword);

  const requestReset = async (event) => {
    event.preventDefault(); setError(''); setMessage('');
    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(response.message); setRequested(true);
    } catch (err) { setError(err.response?.data?.message || 'Could not request a password reset.'); }
  };

  const submitReset = async (event) => {
    event.preventDefault(); setError(''); setMessage('');
    if (newPassword !== confirmPassword) return setError('Passwords do not match.');
    if (checks.some((check) => !check.valid)) return setError('Meet all password requirements below.');
    try {
      const response = await api.post('/auth/reset-password', { email, otp: token, newPassword, confirmPassword });
      setMessage(response.message); setToken(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) { setError(err.response?.data?.message || 'Could not reset your password.'); }
  };

  return <Container className="py-5" style={{ maxWidth: 560 }}>
    <Card className="p-4 shadow">
      <h2>Reset password</h2>
      {message && <Alert variant="info">{message}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}
      {!requested ? <Form onSubmit={requestReset}>
        <Form.Group className="mb-3"><Form.Label>Email address</Form.Label><Form.Control type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Form.Group>
        <Button type="submit">Send reset token</Button>
      </Form> : <Form onSubmit={submitReset}>
        <Form.Group className="mb-3"><Form.Label>Email address</Form.Label><Form.Control type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Form.Group>
        <Form.Group className="mb-3"><Form.Label>Reset token from your email</Form.Label><Form.Control value={token} onChange={(e) => setToken(e.target.value)} required /></Form.Group>
        <Form.Group className="mb-3"><Form.Label>New password</Form.Label><Form.Control type="password" autoComplete="new-password" maxLength={128} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required /></Form.Group>
        {newPassword && <div className="mb-3"><div>Strength: <strong>{strength}</strong></div><ul className="list-unstyled">{checks.map((check) => <li className={check.valid ? 'text-success' : 'text-muted'} key={check.label}>{check.valid ? '✓' : '○'} {check.label}</li>)}</ul></div>}
        <Form.Group className="mb-3"><Form.Label>Confirm new password</Form.Label><Form.Control type="password" autoComplete="new-password" maxLength={128} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required isInvalid={Boolean(confirmPassword && confirmPassword !== newPassword)} /><Form.Control.Feedback type="invalid">Passwords do not match.</Form.Control.Feedback></Form.Group>
        <Button type="submit">Reset password</Button>
      </Form>}
      <div className="mt-3"><Link to="/login">Back to login</Link></div>
    </Card>
  </Container>;
}
