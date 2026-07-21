import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { crearAlerta } from '../../api';
import { TIPOS_ALERTA } from '../../utils';
import { SPACING, FONT, RADIUS, getColors } from '../../theme';
import NeuCard from '../ui/NeuCard';
import NeuInput from '../ui/NeuInput';
import NeuButton from '../ui/NeuButton';
import ScreenHeader from '../ui/ScreenHeader';

const TIPO_ICONS = {
  Seguridad: 'shield-checkmark',
  Infraestructura: 'construct',
  Movilidad: 'car',
  Ambiental: 'leaf',
  Salud: 'medical',
  Educacion: 'school',
  Otro: 'ellipsis-horizontal',
};

export default function NuevaAlertaScreen({ navigation }) {
  const { token } = useAuth();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const [tipo, setTipo] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [sector, setSector] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!tipo || !titulo.trim() || !descripcion.trim() || !sector.trim()) {
      setError('Todos los campos son obligatorios');
      return;
    }
    if (titulo.trim().length < 5) {
      setError('El titulo debe tener al menos 5 caracteres');
      return;
    }
    if (descripcion.trim().length < 10) {
      setError('La descripcion debe tener al menos 10 caracteres');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await crearAlerta(token, { titulo: titulo.trim(), tipo, descripcion: descripcion.trim(), sector: sector.trim() });
      Alert.alert('Exito', 'Alerta registrada correctamente', [
        { text: 'OK', onPress: () => navigation.navigate('Alertas') },
      ]);
    } catch (e) {
      setError(e.message || 'No se pudo enviar la alerta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ backgroundColor: colors.bg }}
        contentContainerStyle={{ padding: SPACING.xl, paddingBottom: SPACING.xxxl }}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader title="Nueva Alerta" subtitle="Reporta un problema" />

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

        <Text style={{ fontSize: FONT.xs, fontWeight: FONT.weight.semibold, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: SPACING.sm + 2, color: colors.textSecondary }}>
          Tipo de alerta
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.xl }}>
          {TIPOS_ALERTA.map(t => {
            const isSelected = tipo === t;
            return (
              <TouchableOpacity
                key={t}
                onPress={() => setTipo(t)}
                accessibilityRole="radio"
                accessibilityState={{ selected: tipo === t }}
                accessibilityLabel={`Tipo: ${t}`}
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
                <Ionicons name={TIPO_ICONS[t] || 'help-circle'} size={14} color={isSelected ? colors.chipTextSelected : colors.textSecondary} />
                <Text style={{ fontSize: FONT.sm, fontWeight: isSelected ? FONT.weight.semibold : FONT.weight.medium, color: isSelected ? colors.chipTextSelected : colors.textSecondary }}>
                  {t}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <NeuInput
          label="Titulo"
          value={titulo}
          onChangeText={setTitulo}
          placeholder="Ej: Bache en avenida principal"
          icon="document-text"
        />

        <NeuInput
          label="Sector"
          value={sector}
          onChangeText={setSector}
          placeholder="Ej: Zona Colonial, Naco..."
          icon="location"
        />

        <NeuInput
          label="Descripcion detallada"
          value={descripcion}
          onChangeText={setDescripcion}
          placeholder="Describe el problema con detalle (min. 10 caracteres)"
          multiline
        />
        <Text style={{ fontSize: FONT.sm, color: colors.textMuted, marginBottom: SPACING.xl, textAlign: 'right' }}>
          {descripcion.length}/500
        </Text>

        <NeuButton onPress={handleSubmit} loading={loading} icon="send">
          Enviar Alerta
        </NeuButton>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
