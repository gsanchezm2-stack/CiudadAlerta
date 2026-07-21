import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ThemeContext = createContext(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return ctx;
}

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState('auto');

  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync('ciudadalerta_theme');
        if (stored === 'dark' || stored === 'light' || stored === 'auto') {
          setMode(stored);
        }
      } catch {
        // keep default 'auto'
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await SecureStore.setItemAsync('ciudadalerta_theme', mode);
      } catch {
        // silent
      }
    })();
  }, [mode]);

  const resolvedTheme = useMemo(() => {
    return mode === 'auto' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
  }, [mode, systemScheme]);

  const setThemeMode = (newMode) => setMode(newMode);

  return (
    <ThemeContext.Provider value={{ mode, theme: resolvedTheme, setThemeMode, isDark: resolvedTheme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}
