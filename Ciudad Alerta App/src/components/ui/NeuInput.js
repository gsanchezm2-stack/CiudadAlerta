import { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { RADIUS, FONT, SPACING, getColors } from '../../theme';

export default function NeuInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  multiline = false,
  error,
  style,
  accessibilityLabel,
  ...rest
}) {
  const [focused, setFocused] = useState(false);
  const { theme } = useTheme();
  const colors = getColors(theme);

  const borderColor = error
    ? colors.danger
    : focused
      ? colors.primary
      : colors.border;

  return (
    <View style={[{ marginBottom: SPACING.lg }, style]}>
      {label && (
        <Text
          style={{
            fontSize: FONT.xs,
            fontWeight: FONT.weight.semibold,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            marginBottom: SPACING.xs + 2,
            color: focused ? colors.primary : colors.textSecondary,
          }}
        >
          {label}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={accessibilityLabel || label || placeholder}
        accessibilityState={{ disabled: false }}
        style={[
          {
            backgroundColor: colors.inputBg,
            borderRadius: RADIUS.md,
            padding: SPACING.md + 2,
            fontSize: FONT.md,
            color: colors.text,
            borderWidth: 1.5,
            borderColor: borderColor,
            minHeight: multiline ? 110 : 48,
          },
          multiline && { textAlignVertical: 'top' },
        ]}
        {...rest}
      />
      {error && (
        <Text
          style={{
            fontSize: FONT.sm,
            color: colors.danger,
            marginTop: SPACING.xs,
            fontWeight: FONT.weight.medium,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
