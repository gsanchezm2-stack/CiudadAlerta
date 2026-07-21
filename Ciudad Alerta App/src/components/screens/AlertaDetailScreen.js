import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getAlerta, cambiarEstadoAlerta, eliminarAlerta, crearComentario, eliminarComentario } from '../../api';
import { tienePermiso } from '../../permisos';
import { SPACING, FONT, RADIUS, getColors } from '../../theme';
import NeuCard from '../ui/NeuCard';
import NeuBadge from '../ui/NeuBadge';
import NeuButton from '../ui/NeuButton';
import NeuInput from '../ui/NeuInput';
import EmptyState from '../ui/EmptyState';

const ESTADOS = ['pendiente', 'en_revision', 'resuelto'];

export default function AlertaDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const [alerta, setAlerta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [enviando, setEnviando] = useState(false);

  const esAutor = alerta?.autor?._id === user?.id;
  const puedeCambiarEstado = tienePermiso(user?.rol, 'alertas:cambiar_estado') || (tienePermiso(user?.rol, 'alertas:cerrar_propia') && esAutor);
  const puedeEliminar = tienePermiso(user?.rol, 'alertas:eliminar');
  const puedeCambiarEstadoLibre = tienePermiso(user?.rol, 'alertas:cambiar_estado');

  useEffect(() => {
    async function load() {
      try {
        const data = await getAlerta(token, id);
        setAlerta(data);
        setComentarios(data.comentarios || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleEstado = async () => {
    let nuevoEstado;
    if (puedeCambiarEstadoLibre) {
      const idx = ESTADOS.indexOf(alerta.estado);
      nuevoEstado = ESTADOS[(idx + 1) % 3];
    } else {
      nuevoEstado = 'resuelto';
    }
    try {
      const updated = await cambiarEstadoAlerta(token, id, nuevoEstado);
      setAlerta(prev => ({ ...prev, estado: updated.estado }));
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDelete = () => {
    Alert.alert('Confirmar', 'Seguro que quieres eliminar esta alerta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          try {
            await eliminarAlerta(token, id);
            navigation.goBack();
          } catch (e) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  const handleComentario = async () => {
    if (!nuevoComentario.trim()) return;
    setEnviando(true);
    try {
      const c = await crearComentario(token, id, nuevoComentario);
      setComentarios(prev => [c, ...prev]);
      setNuevoComentario('');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setEnviando(false);
    }
  };

  const handleDeleteComentario = (cid) => {
    Alert.alert('Confirmar', 'Eliminar comentario?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          try {
            await eliminarComentario(token, cid);
            setComentarios(prev => prev.filter(c => c._id !== cid));
          } catch (e) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  if (loading) {
    return <EmptyState loading={true} />;
  }

  if (error || !alerta) {
    return <EmptyState error={error || 'Alerta no encontrada'} onRetry={() => navigation.goBack()} />;
  }

  const metaItems = [
    { icon: 'location-outline', label: 'Sector', value: alerta.sector },
    { icon: 'calendar-outline', label: 'Fecha', value: new Date(alerta.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) },
    { icon: 'person-outline', label: 'Reportado por', value: alerta.autor?.nombre || 'Anonimo' },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: SPACING.xxxl }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, padding: SPACING.lg }}
        >
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
          <Text style={{ color: colors.primary, fontWeight: FONT.weight.semibold, fontSize: FONT.md }}>Volver</Text>
        </TouchableOpacity>

        <NeuCard radius={RADIUS.lg} style={{ marginHorizontal: SPACING.lg, marginBottom: SPACING.lg, padding: SPACING.xl }}>
          <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg, flexWrap: 'wrap' }}>
            <NeuBadge preset={alerta.estado} />
            <NeuBadge preset={alerta.tipo} />
          </View>

          <Text style={{ fontSize: FONT.xxl, fontWeight: FONT.weight.bold, color: colors.text, marginBottom: SPACING.md, letterSpacing: -0.3, lineHeight: 28 }}>
            {alerta.titulo || alerta.descripcion}
          </Text>
          {alerta.titulo && (
            <Text style={{ fontSize: FONT.md, color: colors.textSecondary, marginBottom: SPACING.xl, lineHeight: 20 }}>
              {alerta.descripcion}
            </Text>
          )}

          {metaItems.map((item, i) => (
            <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md, paddingBottom: SPACING.md, borderBottomWidth: i < metaItems.length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
              <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${colors.primary}10`, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={item.icon} size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: FONT.xs, fontWeight: FONT.weight.semibold, textTransform: 'uppercase', letterSpacing: 0.7, color: colors.textMuted }}>
                  {item.label}
                </Text>
                <Text style={{ fontSize: FONT.md, fontWeight: FONT.weight.medium, color: colors.text, marginTop: 2 }}>
                  {item.value}
                </Text>
              </View>
            </View>
          ))}

          <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg }}>
            {puedeCambiarEstado && (
              <NeuButton variant="accent" onPress={handleEstado} size="sm" style={{ flex: 1 }}>
                Cambiar estado
              </NeuButton>
            )}
            {puedeEliminar && (
              <NeuButton variant="danger" onPress={handleDelete} size="sm" style={{ flex: 1 }}>
                Eliminar
              </NeuButton>
            )}
          </View>
        </NeuCard>

        <NeuCard radius={RADIUS.lg} style={{ marginHorizontal: SPACING.lg, padding: SPACING.xl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.lg }}>
            <Ionicons name="chatbubble-ellipses" size={18} color={colors.primary} />
            <Text style={{ fontSize: FONT.xl, fontWeight: FONT.weight.bold, color: colors.text }}>
              Comentarios ({comentarios.length})
            </Text>
          </View>

          <View style={{ marginBottom: SPACING.lg }}>
            <NeuInput
              value={nuevoComentario}
              onChangeText={setNuevoComentario}
              placeholder="Escribe un comentario..."
              multiline
            />
            <NeuButton onPress={handleComentario} loading={enviando} disabled={!nuevoComentario.trim()} size="sm">
              Comentar
            </NeuButton>
          </View>

          {comentarios.map(c => (
            <NeuCard key={c._id} variant="inset" radius={RADIUS.sm} style={{ marginBottom: SPACING.sm, padding: SPACING.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: FONT.xs, color: colors.whiteText, fontWeight: FONT.weight.bold }}>
                    {c.autor?.nombre?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                </View>
                <Text style={{ fontSize: FONT.md, fontWeight: FONT.weight.semibold, color: colors.text }}>
                  {c.autor?.nombre || 'Anonimo'}
                </Text>
                <NeuBadge preset={c.autor?.rol} style={{ paddingHorizontal: 8, paddingVertical: 2 }} />
                <Text style={{ fontSize: FONT.xs, color: colors.textMuted, marginLeft: 'auto' }}>
                  {new Date(c.fecha).toLocaleDateString('es-ES')}
                </Text>
              </View>
              <Text style={{ fontSize: FONT.md, color: colors.textSecondary, lineHeight: 20, paddingLeft: 36 }}>
                {c.texto}
              </Text>
              {(c.autor?._id === user?.id || tienePermiso(user?.rol, 'comentarios:eliminar')) && (
                <TouchableOpacity onPress={() => handleDeleteComentario(c._id)} style={{ marginTop: SPACING.sm, marginLeft: 36 }} accessibilityRole="button" accessibilityLabel="Eliminar comentario">
                  <Text style={{ color: colors.danger, fontSize: FONT.sm, fontWeight: FONT.weight.semibold }}>Eliminar</Text>
                </TouchableOpacity>
              )}
            </NeuCard>
          ))}

          {comentarios.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: SPACING.xl }}>
              <Ionicons name="chatbubble-outline" size={32} color={colors.textMuted} />
              <Text style={{ marginTop: SPACING.sm, fontSize: FONT.md, color: colors.textMuted }}>
                No hay comentarios aun
              </Text>
            </View>
          )}
        </NeuCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
