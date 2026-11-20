import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const CoinContext = createContext(null);

export function CoinProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [coinBalance, setCoinBalance] = useState(0);

  const fetchBalance = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await api.get('/coins/balance');
      setCoinBalance(data.coin_balance || 0);
    } catch (error) {
      console.error('Failed to fetch coin balance:', error);
    }
  }, [isAuthenticated]);

  const refreshBalance = useCallback(() => {
    fetchBalance();
  }, [fetchBalance]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBalance();
    } else {
      setCoinBalance(0);
    }
  }, [isAuthenticated, fetchBalance]);

  return (
    <CoinContext.Provider value={{ coinBalance, refreshBalance, fetchBalance }}>
      {children}
    </CoinContext.Provider>
  );
}

export function useCoin() {
  const context = useContext(CoinContext);
  if (!context) {
    throw new Error('useCoin must be used within CoinProvider');
  }
  return context;
}