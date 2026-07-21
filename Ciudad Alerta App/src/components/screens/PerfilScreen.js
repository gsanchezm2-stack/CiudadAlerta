import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, FONT, RADIUS, getColors } from '../../theme';
import NeuCard from '../ui/NeuCard';
import Avatar from '../ui/Avatar';
import NeuBadge from '../ui/NeuBadge';
import NeuButton from '../ui/NeuButton';
import ScreenHeader from '../ui/ScreenHeader';

const THEME_OPTIONS = [
  { value: 'light', label: 'Claro', icon: 'sunny' },
  { value: 'dark', label: 'Oscuro', icon: 'moon' },
  { value: 'auto', label: 'Automatico', icon: 'phone-portrait-outline' },
];

export default function PerfilScreen() {
  const { user, logout } = useAuth();
  const { mode, setThemeMode } = useTheme();
  const colors = getColors(mode === 'auto' ? 'light' : mode);

  const rows = [
    { icon: 'person', label: 'Nombre', value: user?.nombre },
    { icon: 'mail', label: 'Email', value: user?.email },
    { icon: 'shield-checkmark', label: 'Rol', value: user?.rol },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ alignItems: 'center', padding: SPACING.xl, paddingBottom: SPACING.xxxl }}
    >
      <ScreenHeader title="Mi Perfil" />

      <NeuCard style={{ width: '100%', maxWidth: 480, padding: SPACING.xxxl, alignItems: 'center' }}>
        <Avatar name={user?.nombre} size="xl" />
        <Text style={{ fontSize: FONT.xxl, fontWeight: FONT.weight.bold, color: colors.text, marginTop: SPACING.lg }}>
          {user?.nombre}
        </Text>
        <NeuBadge preset={user?.rol} style={{ marginTop: SPACING.sm }} />

        <View style={{ width: '100%', marginTop: SPACING.xxl }}>
          {rows.map((row, i) => (
            <View
              key={row.label}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: SPACING.md,
                paddingVertical: SPACING.md + 2,
                borderBottomWidth: i < rows.length - 1 ? 1 : 0,
                borderBottomColor: colors.border,
              }}
            >
              <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${colors.primary}10`, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={row.icon} size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: FONT.xs, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {row.label}
                </Text>
                <Text style={{ fontSize: FONT.md, fontWeight: FONT.weight.semibold, color: colors.text, marginTop: 2 }}>
                  {row.value}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </NeuCard>

      <NeuCard radius={RADIUS.lg} style={{ width: '100%', maxWidth: 480, marginTop: SPACING.lg, padding: SPACING.xl }}>
        <Text style={{ fontSize: FONT.xs, fontWeight: FONT.weight.semibold, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: SPACING.md, color: colors.textSecondary }}>
          Apariencia
        </Text>
        <View style={{ flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' }}>
          {THEME_OPTIONS.map(opt => {
            const isSelected = mode === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setThemeMode(opt.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected: mode === opt.value }}
                accessibilityLabel={`Tema ${opt.label}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: SPACING.xs,
                  paddingHorizontal: SPACING.md + 2,
                  paddingVertical: SPACING.sm + 2,
                  borderRadius: RADIUS.full,
                  backgroundColor: isSelected ? colors.chipBgSelected : colors.chipBg,
                  borderWidth: 1.5,
                  borderColor: isSelected ? colors.primary : 'transparent',
                }}
              >
                <Ionicons name={opt.icon} size={14} color={isSelected ? colors.chipTextSelected : colors.textSecondary} />
                <Text style={{ fontSize: FONT.sm, fontWeight: isSelected ? FONT.weight.semibold : FONT.weight.medium, color: isSelected ? colors.chipTextSelected : colors.textSecondary }}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </NeuCard>

      <View style={{ width: '100%', maxWidth: 480, marginTop: SPACING.lg }}>
        <NeuButton variant="danger" onPress={logout}>
          Cerrar sesion
        </NeuButton>
      </View>
    </ScrollView>
  );
}
