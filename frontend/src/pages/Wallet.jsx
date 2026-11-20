import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Table, Button, Badge, Form, Spinner, Alert } from 'react-bootstrap';
import { FaCoins, FaArrowUp, FaArrowDown, FaDonate, FaExchangeAlt, FaEdit, FaGift } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCoin } from '../context/CoinContext';

export default function Wallet() {
  const { user } = useAuth();
  const { coinBalance, refreshBalance } = useCoin();

  const [loading, setLoading] = useState(true);
  const [ledger, setLedger] = useState([]);
  const [stats, setStats] = useState({
    earned: 0,
    spent: 0,
    donated: 0,
    exchanges: 0,
  });
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchLedger();
  }, [filter, page, coinBalance]);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 20,
        type: filter,
      });
      const data = await api.get(`/coins/ledger?${params.toString()}`);
      setLedger(data.transactions || []);
      setTotalPages(data.totalPages || 1);
      setStats(data.stats || {});
    } catch (err) {
      toast.error('There was a problem loading the ledger');
    } finally {
      setLoading(false);
    }
  };

  const renderAmount = (amount, type) => {
    const isCredit = amount > 0;
    return (
      <span className={isCredit ? 'text-success' : 'text-danger'}>
        {isCredit ? <FaArrowUp className="me-1" /> : <FaArrowDown className="me-1" />}
        {Math.abs(amount)} Coin
      </span>
    );
  };

  const getReasonLabel = (reason) => {
    const reasons = {
      register_bonus: { label: 'Registration Bonus', icon: FaGift, color: 'success' },
      donate_reward: { label: 'Book Donation Reward', icon: FaDonate, color: 'success' },
      exchange_reward: { label: 'Book Exchange Reward', icon: FaExchangeAlt, color: 'primary' },
      sell_reward: { label: 'Book Sale Income', icon: FaCoins, color: 'danger' },
      adopt_reward: { label: 'Book Adopt Reward', icon: FaGift, color: 'warning' },
      adopt_deposit: { label: 'Adopt Deposit', icon: FaArrowDown, color: 'danger' },
      adopt_refund: { label: 'Adopt Deposit Refund', icon: FaArrowUp, color: 'success' },
      return_fine: { label: 'Late Return Fine', icon: FaArrowDown, color: 'danger' },
      purchase: { label: 'Book Purchase', icon: FaArrowDown, color: 'danger' },
      review: { label: 'Review Reward', icon: FaEdit, color: 'info' },
      admin_award: { label: 'Admin Award', icon: FaCoins, color: 'secondary' },
    };
    return reasons[reason] || { label: reason, icon: FaCoins, color: 'secondary' };
  };

  return (
    <Container className="py-4">
      <h2 className="mb-4">Wallet</h2>

      <Row className="mb-4">
        <Col md={8}>
          <Card className="bg-warning text-dark">
            <Card.Body className="d-flex align-items-center justify-content-between">
              <div>
                <h6 className="text-muted mb-1">Your Coin Balance</h6>
                <h1 className="mb-0 d-flex align-items-center gap-2">
                  <FaCoins size={40} />
                  {coinBalance}
                </h1>
              </div>
              <div className="text-end">
                <Button variant="dark" as={Link} to="/add-book">
                  Post a Book
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Row className="g-3">
            <Col xs={6}>
              <Card className="text-center p-3">
                <FaArrowUp className="text-success mb-1" />
                <h5 className="mb-0">{stats.earned || 0}</h5>
                <small className="text-muted">Earned</small>
              </Card>
            </Col>
            <Col xs={6}>
              <Card className="text-center p-3">
                <FaArrowDown className="text-danger mb-1" />
                <h5 className="mb-0">{stats.spent || 0}</h5>
                <small className="text-muted">Spent</small>
              </Card>
            </Col>
            <Col xs={6}>
              <Card className="text-center p-3">
                <FaDonate className="text-success mb-1" />
                <h5 className="mb-0">{stats.donated || 0}</h5>
                <small className="text-muted">Donated</small>
              </Card>
            </Col>
            <Col xs={6}>
              <Card className="text-center p-3">
                <FaExchangeAlt className="text-primary mb-1" />
                <h5 className="mb-0">{stats.exchanges || 0}</h5>
                <small className="text-muted">Exchanges</small>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Coin History</h5>
            <Form.Select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(1);
              }}
              style={{ width: 'auto' }}
            >
              <option value="all">All</option>
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
            </Form.Select>
          </div>

          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
            </div>
          ) : ledger.length === 0 ? (
            <Alert variant="info">No transactions found</Alert>
          ) : (
            <>
              <Table responsive>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Reason</th>
                    <th>Amount</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((tx) => {
                    const reasonInfo = getReasonLabel(tx.reason);
                    return (
                      <tr key={tx._id}>
                        <td>{new Date(tx.createdAt).toLocaleDateString('bn-BD')}</td>
                        <td>
                          <Badge bg={reasonInfo.color}>
                            <reasonInfo.icon className="me-1" />
                            {reasonInfo.label}
                          </Badge>
                        </td>
                        <td>{renderAmount(tx.amount, tx.type)}</td>
                        <td>{tx.balance} Coin</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>

              {totalPages > 1 && (
                <div className="d-flex justify-content-center gap-2 mt-3">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="d-flex align-items-center px-3">
                    Page {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <h5 className="mb-3">How to Earn Coins?</h5>
          <Row className="g-3">
            <Col md={3} sm={6}>
              <Card className="p-3 text-center">
                <FaDonate size={32} className="text-success mb-2 mx-auto" />
                <h6>Donate Books</h6>
                <span className="text-success fw-bold">+20 Coin</span>
              </Card>
            </Col>
            <Col md={3} sm={6}>
              <Card className="p-3 text-center">
                <FaExchangeAlt size={32} className="text-primary mb-2 mx-auto" />
                <h6>Exchange Books</h6>
                <span className="text-success fw-bold">+15 Coin</span>
              </Card>
            </Col>
            <Col md={3} sm={6}>
              <Card className="p-3 text-center">
                <FaArrowUp size={32} className="text-success mb-2 mx-auto" />
                <h6>Return Books</h6>
                <span className="text-muted">Deposit Refund</span>
              </Card>
            </Col>
            <Col md={3} sm={6}>
              <Card className="p-3 text-center">
                <FaEdit size={32} className="text-info mb-2 mx-auto" />
                <h6>Give Reviews</h6>
                <span className="text-success fw-bold">+2 Coin</span>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
}
