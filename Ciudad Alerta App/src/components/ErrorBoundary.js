import { Component } from 'react';
import { View, Text } from 'react-native';
import { FONT, SPACING, COLORS } from '../theme';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      const colors = COLORS.light;
      return (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.bg,
            padding: SPACING.xxl,
          }}
        >
          <Text style={{ fontSize: FONT.xxl, marginBottom: SPACING.lg }}>&#128565;</Text>
          <Text
            style={{
              fontSize: FONT.lg,
              fontWeight: FONT.weight.bold,
              marginBottom: SPACING.md,
              textAlign: 'center',
              color: colors.text,
            }}
          >
            Algo salio mal
          </Text>
          <Text
            style={{
              fontSize: FONT.md,
              color: colors.textSecondary,
              textAlign: 'center',
              marginBottom: SPACING.xxl,
            }}
          >
            {this.state.error?.message || 'Error inesperado'}
          </Text>
          <Text
            onPress={() => this.setState({ hasError: false, error: null })}
            style={{
              fontSize: FONT.md,
              fontWeight: FONT.weight.bold,
              color: colors.primary,
            }}
          >
            Reintentar
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}
