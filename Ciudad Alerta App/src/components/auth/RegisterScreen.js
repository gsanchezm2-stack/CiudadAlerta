import { useState } from 'react';
import { View, Text, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { registrarUsuario } from '../../api';
import { SPACING, FONT, RADIUS, getColors } from '../../theme';
import NeuCard from '../ui/NeuCard';
import NeuInput from '../ui/NeuInput';
import NeuButton from '../ui/NeuButton';

export default function RegisterScreen({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const colors = getColors(theme);
  const { login } = useAuth();

  const handleRegister = async () => {
    if (!nombre.trim() || !email.trim() || !password.trim()) {
      setError('Completa todos los campos');
      return;
    }
    if (password.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await registrarUsuario(nombre.trim(), email.trim(), password);
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
              Unite a la comunidad
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
              Crear cuenta
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
              label="Nombre"
              value={nombre}
              onChangeText={setNombre}
              placeholder="Tu nombre"
              autoCapitalize="words"
              icon="person"
            />

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
              placeholder="Minimo 6 caracteres"
              secureTextEntry
              icon="lock-closed"
            />

            <NeuButton onPress={handleRegister} loading={loading} style={{ marginTop: SPACING.sm }}>
              Crear cuenta
            </NeuButton>

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.xl, gap: SPACING.xs }}>
              <Text style={{ fontSize: FONT.md, color: colors.textSecondary }}>
                Ya tenes cuenta?
              </Text>
              <Text
                onPress={() => navigation.goBack()}
                style={{ fontSize: FONT.md, fontWeight: FONT.weight.semibold, color: colors.primary }}
              >
                Inicia sesion
              </Text>
            </View>
          </NeuCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
