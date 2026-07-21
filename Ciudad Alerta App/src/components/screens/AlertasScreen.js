import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getAlertas, eliminarAlerta } from '../../api';
import { tienePermiso } from '../../permisos';
import { TIPOS_ALERTA } from '../../utils';
import { SPACING, FONT, RADIUS, getColors } from '../../theme';
import NeuCard from '../ui/NeuCard';
import NeuBadge from '../ui/NeuBadge';
import NeuInput from '../ui/NeuInput';
import ScreenHeader from '../ui/ScreenHeader';
import EmptyState from '../ui/EmptyState';

const ESTADOS = ['pendiente', 'en_revision', 'resuelto'];

export default function AlertasScreen({ navigation }) {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState(null);
  const [filterEstado, setFilterEstado] = useState(null);

  const puedeEliminar = tienePermiso(user?.rol, 'alertas:eliminar');

  const cargar = useCallback(async (pageNum = 1, append = false) => {
    try {
      const params = { limit: 20, page: pageNum };
      if (search.trim()) params.q = search.trim();
      if (filterTipo) params.tipo = filterTipo;
      if (filterEstado) params.estado = filterEstado;

      const data = await getAlertas(token, params);
      const newAlertas = data.alertas || [];

      if (append) {
        setAlertas(prev => [...prev, ...newAlertas]);
      } else {
        setAlertas(newAlertas);
      }
      setHasMore(newAlertas.length === 20);
      setPage(pageNum);
      setError(null);
    } catch (e) {
      setError(e.message || 'Error de conexion');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, search, filterTipo, filterEstado]);

  useEffect(() => { cargar(1); }, [filterTipo, filterEstado]);

  const onRefresh = () => {
    setRefreshing(true);
    cargar(1);
  };

  const onEndReached = () => {
    if (!loading && hasMore) {
      cargar(page + 1, true);
    }
  };

  const handleSearch = () => {
    setLoading(true);
    cargar(1);
  };

  const handleEliminar = (id) => {
    Alert.alert('Confirmar', 'Deseas eliminar esta alerta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          try {
            await eliminarAlerta(token, id);
            setAlertas(prev => prev.filter(a => a._id !== id));
          } catch (e) {
            Alert.alert('Error', e.message || 'Error al eliminar');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => navigation.navigate('AlertaDetail', { id: item._id })}
    >
      <NeuCard radius={RADIUS.md} style={{ marginBottom: SPACING.md }}>
        <View style={{ padding: SPACING.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm }}>
            <NeuBadge preset={item.estado} />
            <NeuBadge preset={item.tipo} />
            <Text style={{ fontSize: FONT.xs, color: colors.textMuted, marginLeft: 'auto' }}>
              {new Date(item.fecha).toLocaleDateString('es-ES')}
            </Text>
          </View>
          <Text style={{ fontSize: FONT.lg, fontWeight: FONT.weight.medium, color: colors.text, lineHeight: 22 }}>
            {item.titulo || item.descripcion}
          </Text>
          {item.titulo && (
            <Text style={{ fontSize: FONT.sm, color: colors.textMuted, lineHeight: 18, marginTop: 4 }} numberOfLines={2}>
              {item.descripcion}
            </Text>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: colors.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
              <Ionicons name="location-outline" size={13} color={colors.textMuted} />
              <Text style={{ fontSize: FONT.sm, color: colors.textSecondary }}>{item.sector}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
                <Ionicons name="person-outline" size={13} color={colors.textMuted} />
                <Text style={{ fontSize: FONT.sm, color: colors.textMuted }}>
                  {item.autor?.nombre || 'Anonimo'}
                </Text>
              </View>
              {puedeEliminar && (
                <TouchableOpacity onPress={() => handleEliminar(item._id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityLabel="Eliminar alerta" accessibilityRole="button">
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </NeuCard>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Alertas" subtitle={`${alertas.length} resultados`} />

      <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.md }}>
        <NeuInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar alertas..."
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
      </View>

      <View style={{ flexDirection: 'row', gap: SPACING.xs, paddingHorizontal: SPACING.lg, marginBottom: SPACING.xs, flexWrap: 'wrap' }}>
        {ESTADOS.map(e => (
          <TouchableOpacity
            key={e}
            onPress={() => setFilterEstado(filterEstado === e ? null : e)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: filterEstado === e }}
            accessibilityLabel={`Filtrar por estado: ${e.replace('_', ' ')}`}
            style={{
              paddingHorizontal: SPACING.md,
              paddingVertical: SPACING.xs + 2,
              borderRadius: RADIUS.full,
              backgroundColor: filterEstado === e ? colors.chipBgSelected : colors.chipBg,
              borderWidth: 1,
              borderColor: filterEstado === e ? colors.primary : 'transparent',
            }}
          >
            <Text style={{ fontSize: FONT.sm, fontWeight: FONT.weight.medium, color: filterEstado === e ? colors.chipTextSelected : colors.textSecondary }}>
              {e.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: SPACING.xs, paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg, flexWrap: 'wrap' }}>
        {TIPOS_ALERTA.map(t => (
          <TouchableOpacity
            key={t}
            onPress={() => setFilterTipo(filterTipo === t ? null : t)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: filterTipo === t }}
            accessibilityLabel={`Filtrar por tipo: ${t}`}
            style={{
              paddingHorizontal: SPACING.md,
              paddingVertical: SPACING.xs + 2,
              borderRadius: RADIUS.full,
              backgroundColor: filterTipo === t ? colors.chipBgSelected : colors.chipBg,
              borderWidth: 1,
              borderColor: filterTipo === t ? colors.primary : 'transparent',
            }}
          >
            <Text style={{ fontSize: FONT.sm, fontWeight: FONT.weight.medium, color: filterTipo === t ? colors.chipTextSelected : colors.textSecondary }}>
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={alertas}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl }}
        ListEmptyComponent={
          <EmptyState loading={loading} error={error} onRetry={() => { setLoading(true); cargar(1); }} emptyMessage="No hay alertas" />
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
}
