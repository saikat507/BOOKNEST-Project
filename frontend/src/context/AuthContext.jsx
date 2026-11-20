import { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  token: localStorage.getItem('booknest_token'),
  isLoading: true,
  isAuthenticated: false,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    case 'RESTORE_SESSION':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'RESTORE_SESSION_FAIL':
      return { ...state, token: null, isLoading: false };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('booknest_token');
      if (token) {
        try {
          const response = await api.get('/auth/me');
          const userData = response.user || response;
          dispatch({ type: 'RESTORE_SESSION', payload: userData });
        } catch (error) {
          console.error('Session restore failed:', error);
          localStorage.removeItem('booknest_token');
          dispatch({ type: 'RESTORE_SESSION_FAIL' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    restoreSession();
  }, []);

  const login = async (email, password, role = 'user') => {
    const response = await api.post('/auth/login', { email, password, role });
    
    const token = response.token;
    const user = response.user || response;
    
    if (!token) {
      throw new Error('No token received');
    }
    
    localStorage.setItem('booknest_token', token);
    dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    return response;
  };

  const adminLogin = async (email, password) => {
    return login(email, password, 'admin');
  };

  const register = async (name, email, password, phone, confirmPassword, role = 'user') => {
    const response = await api.post('/auth/register', { name, email, password, confirmPassword, phone, role });
    
    const token = response.token;
    const user = response.user || response;
    
    if (!token) {
      throw new Error('No token received');
    }
    
    localStorage.setItem('booknest_token', token);
    dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    return response;
  };

  const logout = () => {
    localStorage.removeItem('booknest_token');
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (data) => {
    dispatch({ type: 'UPDATE_USER', payload: data });
  };

  return (
    <AuthContext.Provider
      value={{ ...state, login, adminLogin, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
