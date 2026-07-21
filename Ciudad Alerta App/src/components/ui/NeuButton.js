import { useState } from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { neu, RADIUS, FONT, SPACING, getColors } from '../../theme';

const VARIANTS = {
  primary: (colors) => ({ bg: colors.primary, text: colors.whiteText, pressed: colors.primaryDark }),
  danger: (colors) => ({ bg: colors.danger, text: colors.whiteText, pressed: colors.dangerDark || '#B91C1C' }),
  accent: (colors) => ({ bg: colors.primaryLight, text: colors.whiteText, pressed: colors.primary }),
  ghost: (colors) => ({ bg: 'transparent', text: colors.primary, pressed: null }),
  outline: (colors) => ({ bg: 'transparent', text: colors.primary, pressed: null, border: colors.primary }),
};

export default function NeuButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onPress,
  style,
  accessibilityLabel,
  accessibilityRole = 'button',
  accessibilityState,
}) {
  const [pressed, setPressed] = useState(false);
  const { theme } = useTheme();
  const colors = getColors(theme);
  const v = VARIANTS[variant](colors);
  const isSmall = size === 'sm';
  const isGhost = variant === 'ghost';
  const isOutline = variant === 'outline';

  const shadowStyle = pressed ? neu.insetSmall(theme) : neu.small(theme);
  const bgStyle = isGhost
    ? { backgroundColor: pressed ? colors.overlayBg : 'transparent' }
    : isOutline
      ? { backgroundColor: pressed ? `${colors.primary}08` : 'transparent', borderWidth: 1.5, borderColor: v.border || colors.primary }
      : { backgroundColor: pressed && v.pressed ? v.pressed : v.bg };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={disabled || loading}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: disabled || loading, busy: loading, ...accessibilityState }}
      style={[
        {
          ...bgStyle,
          borderRadius: RADIUS.md,
          paddingVertical: isSmall ? SPACING.sm + 1 : SPACING.md + 3,
          paddingHorizontal: isSmall ? SPACING.lg : SPACING.xl,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: SPACING.sm,
          opacity: disabled ? 0.5 : 1,
          minHeight: isSmall ? 36 : 48,
        },
        !isGhost && shadowStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <Text
          style={{
            color: v.text,
            fontSize: isSmall ? FONT.sm : FONT.md,
            fontWeight: FONT.weight.semibold,
            letterSpacing: 0.3,
          }}
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}
