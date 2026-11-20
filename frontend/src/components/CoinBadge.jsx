import { FaCoins } from 'react-icons/fa';
import { useCoin } from '../context/CoinContext';

export default function CoinBadge() {
  const { coinBalance } = useCoin();
  const balance = typeof coinBalance === 'number' ? coinBalance : 0;

  return (
    <div className="coin-badge">
      <div className="coin-badge-icon">
        <FaCoins />
      </div>
      <span className="coin-badge-value">{balance}</span>

      <style>{`
        .coin-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #F57F17 0%, #FFB300 50%, #FFC107 100%);
          padding: 6px 14px;
          border-radius: 50px;
          box-shadow: 0 4px 15px rgba(245, 127, 23, 0.3);
          animation: coin-shine 3s ease-in-out infinite;
        }
        .coin-badge-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1rem;
        }
        .coin-badge-value {
          color: white;
          font-weight: 700;
          font-size: 0.95rem;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }
        @keyframes coin-shine {
          0%, 100% {
            box-shadow: 0 4px 15px rgba(245, 127, 23, 0.3);
          }
          50% {
            box-shadow: 0 4px 25px rgba(245, 127, 23, 0.5);
          }
        }
      `}</style>
    </div>
  );
}