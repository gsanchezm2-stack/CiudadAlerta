import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { FONT, SPACING, getColors } from '../../theme';

export default function ScreenHeader({ title, subtitle, rightAction, rightLabel }) {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === 'ios' ? insets.top : insets.top + SPACING.sm;

  return (
    <View style={{ paddingHorizontal: SPACING.lg, paddingTop: topPadding + SPACING.sm, paddingBottom: SPACING.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text accessibilityRole="header" style={{ fontSize: FONT.hero, fontWeight: FONT.weight.heavy, color: colors.text, letterSpacing: -0.7 }}>
            {title}
          </Text>
          {subtitle && (
            <Text style={{ fontSize: FONT.md, color: colors.textSecondary, marginTop: SPACING.xs }}>
              {subtitle}
            </Text>
          )}
        </View>
        {rightAction && (
          <TouchableOpacity
            onPress={rightAction}
            accessibilityRole="button"
            accessibilityLabel={rightLabel}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: FONT.md, fontWeight: FONT.weight.semibold, color: colors.primary }}>
              {rightLabel}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
