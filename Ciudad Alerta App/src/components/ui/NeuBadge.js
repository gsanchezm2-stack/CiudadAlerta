import { View, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { FONT, RADIUS, SPACING, getColors } from '../../theme';

const PRESETS_LIGHT = {
  pendiente: { bg: '#FEF3C7', text: '#92400E', dot: '#F5A623' },
  en_revision: { bg: '#DBEAFE', text: '#1E40AF', dot: '#4361EE' },
  resuelto: { bg: '#D1FAE5', text: '#065F46', dot: '#27AE60' },
  Seguridad: { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' },
  Infraestructura: { bg: '#FEF3C7', text: '#92400E', dot: '#F5A623' },
  Movilidad: { bg: '#DBEAFE', text: '#1E40AF', dot: '#4361EE' },
  Ambiental: { bg: '#D1FAE5', text: '#065F46', dot: '#27AE60' },
  Salud: { bg: '#F3E8FF', text: '#6B21A8', dot: '#A855F7' },
  Educacion: { bg: '#E0E7FF', text: '#3730A3', dot: '#6366F1' },
  Otro: { bg: '#F3F4F6', text: '#4B5563', dot: '#9CA3AF' },
  ciudadano: { bg: '#DBEAFE', text: '#1E40AF', dot: '#4361EE' },
  autoridad: { bg: '#D1FAE5', text: '#065F46', dot: '#27AE60' },
  administrador: { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' },
};

const PRESETS_DARK = {
  pendiente: { bg: '#3B2F0B', text: '#FCD34D', dot: '#F59E0B' },
  en_revision: { bg: '#1E2A4A', text: '#93C5FD', dot: '#5B7FFF' },
  resuelto: { bg: '#0B3B2E', text: '#6EE7B7', dot: '#34D399' },
  Seguridad: { bg: '#3B1111', text: '#FCA5A5', dot: '#EF4444' },
  Infraestructura: { bg: '#3B2F0B', text: '#FCD34D', dot: '#F59E0B' },
  Movilidad: { bg: '#1E2A4A', text: '#93C5FD', dot: '#5B7FFF' },
  Ambiental: { bg: '#0B3B2E', text: '#6EE7B7', dot: '#34D399' },
  Salud: { bg: '#2E1065', text: '#C4B5FD', dot: '#A855F7' },
  Educacion: { bg: '#1E1B4B', text: '#A5B4FC', dot: '#6366F1' },
  Otro: { bg: '#1F2937', text: '#9CA3AF', dot: '#6B7280' },
  ciudadano: { bg: '#1E2A4A', text: '#93C5FD', dot: '#5B7FFF' },
  autoridad: { bg: '#0B3B2E', text: '#6EE7B7', dot: '#34D399' },
  administrador: { bg: '#3B1111', text: '#FCA5A5', dot: '#EF4444' },
};

export default function NeuBadge({ preset, label, style }) {
  const { theme } = useTheme();
  const presets = theme === 'dark' ? PRESETS_DARK : PRESETS_LIGHT;
  const c = presets[preset] || presets.Otro;

  return (
    <View
      style={[
        {
          backgroundColor: c.bg,
          paddingHorizontal: SPACING.md - 2,
          paddingVertical: SPACING.xs,
          borderRadius: RADIUS.full,
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.xs + 1,
        },
        style,
      ]}
    >
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: c.dot,
        }}
      />
      <Text
        style={{
          fontSize: FONT.xs,
          fontWeight: FONT.weight.semibold,
          color: c.text,
          textTransform: 'capitalize',
          letterSpacing: 0.3,
        }}
      >
        {label || preset?.replace('_', ' ')}
      </Text>
    </View>
  );
}
