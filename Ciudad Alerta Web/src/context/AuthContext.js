import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('ciudadalerta_token');
    const storedUser = localStorage.getItem('ciudadalerta_user');

    if (!storedToken || !storedUser) {
      setReady(true);
      return;
    }

    const API = process.env.REACT_APP_API_URL
      ? `${process.env.REACT_APP_API_URL}/api`
      : '/api';

    fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then(res => {
        if (res.ok) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } else {
          localStorage.removeItem('ciudadalerta_user');
          localStorage.removeItem('ciudadalerta_token');
        }
      })
      .catch(() => {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      })
      .finally(() => setReady(true));
  }, []);

  const login = useCallback((userData, tokenStr) => {
    setUser(userData);
    setToken(tokenStr);
    localStorage.setItem('ciudadalerta_user', JSON.stringify(userData));
    localStorage.setItem('ciudadalerta_token', tokenStr);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ciudadalerta_user');
    localStorage.removeItem('ciudadalerta_token');
  }, []);

  if (!ready) {
    return (
      <AuthContext.Provider value={{ user: null, token: null, login: () => {}, logout: () => {}, isAuthenticated: false }}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}
