import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../config';

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
    (async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('ciudadalerta_token');
        const storedUser = await SecureStore.getItemAsync('ciudadalerta_user');
        if (storedToken && storedUser) {
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            const res = await fetch(`${API_URL}/api/auth/me`, {
              headers: { Authorization: `Bearer ${storedToken}` },
              signal: controller.signal,
            });
            clearTimeout(timeout);
            if (res.ok) {
              setToken(storedToken);
              setUser(JSON.parse(storedUser));
            } else {
              await SecureStore.deleteItemAsync('ciudadalerta_token');
              await SecureStore.deleteItemAsync('ciudadalerta_user');
            }
          } catch {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
          }
        }
      } catch {
        // silent
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const login = useCallback(async (userData, tokenStr) => {
    setUser(userData);
    setToken(tokenStr);
    await SecureStore.setItemAsync('ciudadalerta_token', tokenStr);
    await SecureStore.setItemAsync('ciudadalerta_user', JSON.stringify(userData));
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setToken(null);
    await SecureStore.deleteItemAsync('ciudadalerta_token');
    await SecureStore.deleteItemAsync('ciudadalerta_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user, ready }}>
      {children}
    </AuthContext.Provider>
  );
}
