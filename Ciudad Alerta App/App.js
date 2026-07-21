import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { getColors, SPACING, FONT } from './src/theme';
import ErrorBoundary from './src/components/ErrorBoundary';
import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';

function SplashLoading() {
  const { theme } = useTheme();
  const colors = getColors(theme);
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ marginTop: SPACING.lg, fontSize: FONT.md, color: colors.textSecondary }}>
        Cargando...
      </Text>
    </View>
  );
}

function AppContent() {
  const { isAuthenticated, ready } = useAuth();
  const { theme } = useTheme();
  const colors = getColors(theme);

  if (!ready) {
    return <SplashLoading />;
  }

  return (
    <NavigationContainer
      theme={{
        ...(theme === 'dark' ? DarkTheme : DefaultTheme),
        dark: theme === 'dark',
        colors: {
          primary: colors.primary,
          background: colors.bg,
          card: colors.card,
          text: colors.text,
          border: colors.border,
          notification: colors.primary,
        },
      }}
    >
      {isAuthenticated ? (
        <MainNavigator />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  );
}
