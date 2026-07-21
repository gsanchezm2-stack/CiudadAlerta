import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getUsuarios, cambiarRolUsuario } from '../../api';
import { tienePermiso } from '../../permisos';
import { SPACING, FONT, RADIUS, getColors } from '../../theme';
import NeuCard from '../ui/NeuCard';
import NeuBadge from '../ui/NeuBadge';
import NeuInput from '../ui/NeuInput';
import ScreenHeader from '../ui/ScreenHeader';
import EmptyState from '../ui/EmptyState';
import Avatar from '../ui/Avatar';

const ROLES = ['ciudadano', 'autoridad', 'administrador'];

export default function AdminScreen() {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const cargar = async () => {
    try {
      const data = await getUsuarios(token);
      setUsuarios(data);
      setError(null);
    } catch (e) {
      setError(e.message || 'No se pudo cargar usuarios');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { cargar(); }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    cargar();
  };

  const handleRolChange = (id, nombre, nuevoRol) => {
    if (id === user?.id) {
      Alert.alert('Error', 'No puedes cambiar tu propio rol');
      return;
    }
    Alert.alert('Cambiar rol', `Cambiar rol de ${nombre} a "${nuevoRol}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar', onPress: async () => {
          try {
            await cambiarRolUsuario(token, id, nuevoRol);
            setUsuarios(prev => prev.map(u => u._id === id ? { ...u, rol: nuevoRol } : u));
          } catch (e) {
            Alert.alert('Error', e.message || 'Error al cambiar rol');
          }
        },
      },
    ]);
  };

  if (!tienePermiso(user?.rol, 'usuarios:ver')) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <Ionicons name="lock-closed-outline" size={40} color={colors.textMuted} />
        <Text style={{ color: colors.textMuted, fontSize: FONT.md, marginTop: SPACING.md }}>No tienes acceso a esta seccion</Text>
      </View>
    );
  }

  const filtered = usuarios.filter(u => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return u.nombre?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.rol?.toLowerCase().includes(q);
  });

  const renderItem = ({ item }) => (
    <NeuCard radius={RADIUS.md} style={{ marginBottom: SPACING.md }}>
      <View style={{ padding: SPACING.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md }}>
          <Avatar name={item.nombre} size="sm" />
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: FONT.weight.semibold, color: colors.text, fontSize: FONT.lg }}>
              {item.nombre}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: FONT.sm }}>{item.email}</Text>
          </View>
          <NeuBadge preset={item.rol} />
        </View>

        {item.createdAt && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.md }}>
            <Ionicons name="time-outline" size={12} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted, fontSize: FONT.sm }}>
              Registro: {new Date(item.createdAt).toLocaleDateString('es-ES')}
            </Text>
          </View>
        )}

        {item._id !== user?.id && (
          <View style={{ flexDirection: 'row', gap: SPACING.xs }}>
            {ROLES.filter(r => r !== item.rol).map(r => (
              <TouchableOpacity
                key={r}
                style={{
                  paddingHorizontal: SPACING.md,
                  paddingVertical: SPACING.sm,
                  borderRadius: RADIUS.sm,
                  backgroundColor: colors.chipBg,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                onPress={() => handleRolChange(item._id, item.nombre, r)}
              >
                <Text style={{ fontSize: FONT.sm, color: colors.text, fontWeight: FONT.weight.medium }}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </NeuCard>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Admin" subtitle="Gestionar usuarios y roles" />

      <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg }}>
        <NeuInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nombre, email o rol..."
          icon="search"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl }}
        ListEmptyComponent={
          <EmptyState loading={loading} error={error} onRetry={cargar} emptyMessage="No hay usuarios" />
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      />
    </View>
  );
}
