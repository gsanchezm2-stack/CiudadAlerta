import { View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { neu, RADIUS, getColors } from '../../theme';

export default function NeuCard({ children, variant = 'raised', radius = RADIUS.lg, style }) {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const shadow = variant === 'inset' ? neu.inset(theme) : neu.raised(theme);
  const borderColor = colors.cardBorder;

  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radius,
          borderWidth: 1,
          borderColor: borderColor,
        },
        shadow,
        style,
      ]}
    >
      {children}
    </View>
  );
}
