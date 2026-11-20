import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { FaBook, FaExchangeAlt, FaHandHoldingHeart, FaCoins, FaArrowRight } from 'react-icons/fa';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import BookCard from '../components/BookCard';
import heroBg from "../assets/background.jpg";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const data = await api.get('/books?limit=8');
        setBooks(data.books || []);
      } catch (error) {
        console.error('Failed to fetch books:', error);
      }
    };
    fetchBooks();
  }, []);

  const handleAddBook = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      navigate('/add-book');
    }
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section 
  className="hero-section"
  style={{ backgroundImage: `url(${heroBg})` }}
>
  <div className="hero-particles"></div>
        <Container>
          <Row className="align-items-center min-vh-75 py-5">
            <Col lg={8}>
              <div className="hero-content">
                <span className="hero-badge mb-3">📚 Book Sharing Platform</span>
                <h1 className="hero-title mb-3">
                  Share Knowledge, Adopt Stories, Sell Books
                  <br />
                  <span className="gradient-text"> Build a Reading Community.</span>
                </h1>
                <p className="hero-subtitle mb-4">
                  Donate, exchange, adopt, or buy physical books in your city
                </p>
                <div className="d-flex gap-3 flex-wrap">
                  <Button as={Link} to="/books" className="btn-hero-primary">
                    <FaBook className="me-2" /> Find Books
                  </Button>
                  <Button onClick={handleAddBook} className="btn-hero-secondary">
                    Post a Book <FaArrowRight className="ms-2" />
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* How It Works */}
      <section className="how-it-works py-5">
        <Container>
          <h2 className="text-center mb-5 section-title">How It Works</h2>
          <Row className="g-4">
            <Col md={3} sm={6}>
              <Card className="h-100 feature-card">
                <div className="feature-icon donate">
                  <FaBook />
                </div>
                <h5 className="mt-3">Donate Books</h5>
                <p className="text-muted mb-2">Donate your old books</p>
                <span className="coin-reward">+20 Coin</span>
              </Card>
            </Col>
            <Col md={3} sm={6}>
              <Card className="h-100 feature-card">
                <div className="feature-icon exchange">
                  <FaExchangeAlt />
                </div>
                <h5 className="mt-3">Exchange Books</h5>
                <p className="text-muted mb-2">Get books from others</p>
                <span className="coin-reward">Both get +15 Coins</span>
              </Card>
            </Col>
            <Col md={3} sm={6}>
              <Card className="h-100 feature-card">
                <div className="feature-icon adopt">
                  <FaHandHoldingHeart />
                </div>
                <h5 className="mt-3">Adopt</h5>
                <p className="text-muted mb-2">Borrow for a fixed time</p>
                <span className="text-muted small">Coin deposit</span>
              </Card>
            </Col>
            <Col md={3} sm={6}>
              <Card className="h-100 feature-card">
                <div className="feature-icon sell">
                  <FaCoins />
                </div>
                <h5 className="mt-3">Buy</h5>
                <p className="text-muted mb-2">Buy with Coins</p>
                <span className="text-muted small">Anytime</span>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Latest Books */}
      <section className="latest-books py-5">
        <Container>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="section-title mb-0">Recent Books</h2>
            <Button as={Link} to="/books" className="btn-view-all">
              View All Books <FaArrowRight className="ms-2" />
            </Button>
          </div>
          <Row className="g-4">
            {books.map((book) => (
              <Col key={book.id} lg={3} md={4} sm={6}>
                <BookCard book={book} />
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Coin System */}
      <section className="coin-system py-5">
        <Container>
          <Card className="coin-card">
            <div className="coin-glow"></div>
            <Row className="align-items-center">
              <Col lg={7}>
                <h3 className="mb-3">💰 Coin System</h3>
                <p className="mb-4">
                  Coins are used for activities across our platform
                </p>
                <div className="d-flex flex-wrap gap-3">
                  <div className="reward-item">
                    <span className="reward-icon">🎁</span>
                    <span className="reward-amount">+50</span>
                    <span className="reward-label text-dark">New registration</span>
                  </div>
                  <div className="reward-item">
                    <span className="reward-icon">📚</span>
                    <span className="reward-amount">+20</span>
                    <span className="reward-label text-dark">Book donation</span>
                  </div>
                  <div className="reward-item">
                    <span className="reward-icon">🔄</span>
                    <span className="reward-amount">+15</span>
                    <span className="reward-label text-dark">Book exchange</span>
                  </div>
                </div>
              </Col>
              <Col lg={5}>
                <div className="text-center">
                  <div className="coin-circle">
                    <span className="coin-value">50</span>
                    <span className="coin-label">Coin FREE</span>
                  </div>
                  <p className="mt-3 mb-0 text-dark">Register and get coins!</p>
                </div>
              </Col>
            </Row>
          </Card>
        </Container>
      </section>

      <style>{`
        .hero-section {
  background-image: url("../assets/pic.jpg");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
  overflow: hidden;
}
        .hero-particles {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M40 5L45 15L55 20L45 25L40 35L35 25L25 20L35 15L40 5Z'/%3E%3Ccircle cx='20' cy='20' r='3'/%3E%3Ccircle cx='60' cy='40' r='2'/%3E%3Ccircle cx='30' cy='60' r='2'/%3E%3Ccircle cx='70' cy='70' r='3'/%3E%3C/svg%3E");
          animation: float 6s ease-in-out infinite;
        }
        .min-vh-75 {
          min-height: 75vh;
        }
        .hero-badge {
          display: inline-block;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          padding: 8px 20px;
          border-radius: 50px;
          color: white;
          font-size: 0.9rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .hero-title {
          font-size: 3.5rem;
          font-weight: 700;
          line-height: 1.2;
          color: white;
          text-shadow: 2px 4px 8px rgba(0, 0, 0, 0.2);
        }
        .gradient-text {
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF6B00 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-subtitle {
          font-size: 1.25rem;
          color: rgba(255, 255, 255, 0.9);
          max-width: 500px;
        }
        .btn-hero-primary {
          background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%);
          border: none;
          border-radius: 50px;
          padding: 14px 32px;
          font-weight: 600;
          color: white;
          transition: all 0.3s ease;
        }
        .btn-hero-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(76, 175, 80, 0.4);
          color: white;
        }
        .btn-hero-secondary {
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.5);
          border-radius: 50px;
          padding: 14px 32px;
          font-weight: 600;
          color: white;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }
        .btn-hero-secondary:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: white;
          color: white;
          transform: translateY(-3px);
        }
        .section-title {
          position: relative;
          display: inline-block;
        }
        .section-title::after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 50%;
          width: 60px;
          height: 4px;
          background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%);
          border-radius: 2px;
          transform: translateX(-50%);
        }
        .feature-card {
          border-radius: 20px;
          border: none;
          padding: 32px 24px;
          text-align: center;
          transition: all 0.3s ease;
          background: white;
          position: relative;
          overflow: hidden;
        }
        .feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, transparent, var(--gradient-primary), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .feature-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
        .feature-card:hover::before {
          opacity: 1;
        }
        .feature-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          font-size: 32px;
          transition: all 0.3s ease;
        }
        .feature-icon.donate {
          background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.2) 100%);
          color: #4CAF50;
        }
        .feature-icon.exchange {
          background: linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(33, 150, 243, 0.2) 100%);
          color: #2196F3;
        }
        .feature-icon.adopt {
          background: linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 152, 0, 0.2) 100%);
          color: #FF9800;
        }
        .feature-icon.sell {
          background: linear-gradient(135deg, rgba(244, 67, 54, 0.1) 0%, rgba(244, 67, 54, 0.2) 100%);
          color: #F44336;
        }
        .feature-card:hover .feature-icon {
          transform: scale(1.1);
        }
        .coin-reward {
          display: inline-block;
          background: linear-gradient(135deg, #F57F17 0%, #FFB300 100%);
          color: white;
          padding: 4px 12px;
          border-radius: 50px;
          font-size: 0.85rem;
          font-weight: 600;
        }
        .latest-books {
          background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);
        }
        .btn-view-all {
          background: transparent;
          border: 2px solid #4CAF50;
          border-radius: 50px;
          padding: 10px 24px;
          color: #4CAF50;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .btn-view-all:hover {
          background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%);
          border-color: transparent;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(76, 175, 80, 0.3);
        }
        .coin-card {
          background: linear-gradient(145deg, rgba(26, 71, 42, 0.95) 0%, rgba(46, 125, 50, 0.9) 100%);
          border-radius: 24px;
          padding: 48px;
          color: black;
          position: relative;
          overflow: hidden;
          border: none;
        }
        .coin-glow {
          position: absolute;
          top: -50%;
          right: -20%;
          width: 60%;
          height: 200%;
          background: radial-gradient(circle, rgba(245, 127, 23, 0.2) 0%, transparent 70%);
          pointer-events: none;
        }
        .reward-item {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255, 255, 255, 0.1);
          padding: 12px 20px;
          border-radius: 16px;
          backdrop-filter: blur(10px);
        }
        .reward-icon {
          font-size: 1.5rem;
        }
        .reward-amount {
          font-size: 1.25rem;
          font-weight: 700;
          color: #FFD700;
        }
        .reward-label {
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
        }
        .coin-circle {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          background: linear-gradient(135deg, #F57F17 0%, #FFB300 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          box-shadow: 0 0 40px rgba(245, 127, 23, 0.5);
          animation: pulse-glow 2s infinite;
        }
        .coin-value {
          font-size: 3rem;
          font-weight: 700;
          line-height: 1;
        }
        .coin-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 40px rgba(245, 127, 23, 0.5);
          }
          50% {
            box-shadow: 0 0 60px rgba(245, 127, 23, 0.8);
          }
        }
      `}</style>
    </div>
  );
}