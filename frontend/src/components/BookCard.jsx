import { Card, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaUserCircle, FaCoins } from 'react-icons/fa';
import { BsFillCheckCircleFill } from 'react-icons/bs';

const listingTypeConfig = {
  donate: { label: 'Donate', gradient: 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)' },
  exchange: { label: 'Exchange', gradient: 'linear-gradient(135deg, #2196F3 0%, #64B5F6 100%)' },
  adopt: { label: 'Adopt', gradient: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)' },
  sell: { label: 'Sell', gradient: 'linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%)' },
};

const conditionConfig = {
  new: 'New',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
};

export default function BookCard({ book }) {
  const navigate = useNavigate();
  const listingType = listingTypeConfig[book.listing_type] || listingTypeConfig.sell;
  const owner = book.owner || {};

  const handleClick = () => {
    navigate(`/books/${book.id}`);
  };

  return (
    <Card className="h-100 book-card" onClick={handleClick} style={{ cursor: 'pointer' }}>
      <div className="book-card-image">
        {book.cover_image_url ? (
          <img
            src={book.cover_image_url}
            alt={book.title}
            style={{ height: '200px', width: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div className="book-card-placeholder">
            <span>No Image</span>
          </div>
        )}
        <div className="book-card-overlay">
          <span className="badge-listing" style={{ background: listingType.gradient }}>
            {listingType.label}
          </span>
          {book.listing_type !== 'sell' && book.coin_required > 0 && (
            <span className="badge-coin">
              <FaCoins className="me-1" /> {book.coin_required} Coin
            </span>
          )}
        </div>
      </div>
      <Card.Body>
        <Card.Title
          className="book-card-title mb-1"
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {book.title}
        </Card.Title>
        <Card.Subtitle className="text-muted small mb-2">{book.author}</Card.Subtitle>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <Badge className="badge-condition">{conditionConfig[book.condition] || book.condition}</Badge>
        </div>
        {book.pickup_location && (
          <div className="text-muted small d-flex align-items-center gap-1 mb-2">
            <FaMapMarkerAlt size={12} />
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {book.pickup_location}
            </span>
          </div>
        )}
        {book.listing_type === 'sell' ? (
          <div className="coin-price">
            <FaCoins className="me-1" /> {book.price} Coin
          </div>
        ) : book.coin_required ? null : (
          <div className="text-muted small">Free</div>
        )}
        {owner.name && (
          <div className="d-flex align-items-center gap-2 mt-2 pt-2 book-card-footer">
            {owner.avatar ? (
              <img
                src={owner.avatar}
                alt={owner.name}
                style={{ width: 24, height: 24, borderRadius: '50%' }}
              />
            ) : (
              <FaUserCircle size={24} className="text-muted" />
            )}
            <span className="small">{owner.name}</span>
            {owner.is_verified && (
              <BsFillCheckCircleFill size={14} className="text-primary" />
            )}
          </div>
        )}
      </Card.Body>

      <style>{`
        .book-card {
          border: none;
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
        }
        .book-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }
        .book-card-image {
          position: relative;
          overflow: hidden;
        }
        .book-card-image img {
          transition: transform 0.5s ease;
        }
        .book-card:hover .book-card-image img {
          transform: scale(1.1);
        }
        .book-card-placeholder {
          height: 200px;
          background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #adb5bd;
          font-size: 0.9rem;
        }
        .book-card-overlay {
          position: absolute;
          top: 12px;
          left: 12px;
          right: 12px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .badge-listing {
          padding: 6px 14px;
          border-radius: 50px;
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }
        .badge-coin {
          display: inline-flex;
          align-items: center;
          padding: 6px 14px;
          border-radius: 50px;
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          background: linear-gradient(135deg, #F57F17 0%, #FFB300 100%);
          box-shadow: 0 2px 8px rgba(245, 127, 23, 0.3);
        }
        .book-card-title {
          font-weight: 600;
          color: #2c3e50;
          line-height: 1.3;
        }
        .badge-condition {
          background: linear-gradient(135deg, #6c757d 0%, #868e96 100%);
          color: white;
          padding: 4px 12px;
          border-radius: 50px;
          font-size: 0.7rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .coin-price {
          display: inline-flex;
          align-items: center;
          color: #F57F17;
          font-weight: 700;
          font-size: 1.1rem;
        }
        .book-card-footer {
          border-top: 1px solid #f0f0f0;
        }
      `}</style>
    </Card>
  );
}