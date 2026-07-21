import { View, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { FONT, getColors } from '../../theme';

const SIZE_MAP = { sm: 36, md: 48, lg: 64, xl: 80 };
const FONT_MAP = { sm: FONT.sm, md: FONT.lg, lg: FONT.xxl, xl: FONT.hero };

export default function Avatar({ name = '', size = 'md', color, style }) {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const sz = SIZE_MAP[size] || SIZE_MAP.md;
  const initial = name?.charAt(0)?.toUpperCase() || '?';

  return (
    <View
      style={[
        {
          width: sz,
          height: sz,
          borderRadius: sz / 2,
          backgroundColor: color || colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text
        style={{
          color: '#fff',
          fontSize: FONT_MAP[size] || FONT.lg,
          fontWeight: FONT.weight.bold,
        }}
      >
        {initial}
      </Text>
    </View>
  );
}
