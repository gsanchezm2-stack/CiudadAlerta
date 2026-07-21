import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { FONT, SPACING, getColors } from '../../theme';

const CONTAINER_STYLE = { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xxxl };

export default function EmptyState({
  loading = false,
  error = null,
  onRetry,
  emptyMessage = 'No hay datos',
  children,
}) {
  const { theme } = useTheme();
  const colors = getColors(theme);

  if (loading) {
    return (
      <View style={CONTAINER_STYLE} accessibilityRole="progressbar" accessibilityLabel="Cargando">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: SPACING.lg, fontSize: FONT.md, color: colors.textSecondary }}>
          Cargando...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={CONTAINER_STYLE} accessibilityRole="alert">
        <Ionicons name="alert-circle-outline" size={32} color={colors.danger} style={{ marginBottom: SPACING.md }} />
        <Text style={{ fontSize: FONT.md, color: colors.danger, textAlign: 'center', marginBottom: SPACING.lg }}>
          {error}
        </Text>
        {onRetry && (
          <TouchableOpacity
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel="Reintentar"
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: FONT.md, color: colors.primary, fontWeight: FONT.weight.bold }}>
              Reintentar
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={CONTAINER_STYLE}>
      <Ionicons name="document-text-outline" size={32} color={colors.textMuted} style={{ marginBottom: SPACING.md }} />
      <Text style={{ fontSize: FONT.md, color: colors.textSecondary, textAlign: 'center' }}>
        {emptyMessage}
      </Text>
      {children}
    </View>
  );
}
