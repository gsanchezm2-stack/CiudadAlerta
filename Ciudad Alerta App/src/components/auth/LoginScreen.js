import { useState } from 'react';
import { View, Text, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { loginUser } from '../../api';
import { SPACING, FONT, RADIUS, getColors } from '../../theme';
import NeuCard from '../ui/NeuCard';
import NeuInput from '../ui/NeuInput';
import NeuButton from '../ui/NeuButton';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const colors = getColors(theme);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Completa todos los campos');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await loginUser(email.trim(), password);
      await login(res.usuario, res.token);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: SPACING.xl }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ alignItems: 'center', marginBottom: SPACING.xxxl }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: RADIUS.xl,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: SPACING.lg,
              }}
            >
              <Ionicons name="shield-checkmark" size={36} color={colors.whiteText} />
            </View>
            <Text
              style={{
                fontSize: FONT.hero,
                fontWeight: FONT.weight.heavy,
                color: colors.text,
                letterSpacing: -0.5,
              }}
            >
              CiudadAlerta
            </Text>
            <Text
              style={{
                fontSize: FONT.md,
                color: colors.textSecondary,
                marginTop: SPACING.xs,
              }}
            >
              Plataforma de alertas ciudadanas
            </Text>
          </View>

          <NeuCard style={{ padding: SPACING.xxl }}>
            <Text
              style={{
                fontSize: FONT.xxl,
                fontWeight: FONT.weight.bold,
                textAlign: 'center',
                marginBottom: SPACING.xxl,
                color: colors.text,
                letterSpacing: -0.3,
              }}
            >
              Iniciar sesion
            </Text>

            {error ? (
              <View
                accessibilityRole="alert"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: SPACING.sm,
                  marginBottom: SPACING.lg,
                  backgroundColor: colors.dangerLight || `${colors.danger}10`,
                  padding: SPACING.md,
                  borderRadius: RADIUS.md,
                }}
              >
                <Ionicons name="alert-circle" size={18} color={colors.danger} />
                <Text style={{ fontSize: FONT.sm, color: colors.danger, flex: 1, fontWeight: FONT.weight.medium }}>
                  {error}
                </Text>
              </View>
            ) : null}

            <NeuInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="tu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              icon="mail"
            />

            <NeuInput
              label="Contrasena"
              value={password}
              onChangeText={setPassword}
              placeholder="Tu contrasena"
              secureTextEntry
              icon="lock-closed"
            />

            <NeuButton onPress={handleLogin} loading={loading} style={{ marginTop: SPACING.sm }}>
              Entrar
            </NeuButton>

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.xl, gap: SPACING.xs }}>
              <Text style={{ fontSize: FONT.md, color: colors.textSecondary }}>
                No tenes cuenta?
              </Text>
              <Text
                onPress={() => navigation.navigate('Register')}
                style={{ fontSize: FONT.md, fontWeight: FONT.weight.semibold, color: colors.primary }}
              >
                Registrate
              </Text>
            </View>
          </NeuCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
