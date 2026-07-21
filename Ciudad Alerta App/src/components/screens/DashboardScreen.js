import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getAlertas, getStats } from '../../api';
import { SPACING, FONT, RADIUS, getColors } from '../../theme';
import NeuCard from '../ui/NeuCard';
import NeuBadge from '../ui/NeuBadge';
import ScreenHeader from '../ui/ScreenHeader';
import EmptyState from '../ui/EmptyState';

const STAT_ICONS = {
  total: 'stats-chart',
  pendiente: 'time-outline',
  en_revision: 'eye-outline',
  resuelto: 'checkmark-circle-outline',
};

const STAT_COLORS = {
  total: 'primary',
  pendiente: 'warning',
  en_revision: 'info',
  resuelto: 'success',
};

export default function DashboardScreen({ navigation }) {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const [stats, setStats] = useState(null);
  const [recientes, setRecientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [s, alertasData] = await Promise.all([
        getStats(token),
        getAlertas(token, { limit: 5 }),
      ]);
      setStats(s);
      setRecientes(alertasData.alertas || []);
      setError(null);
    } catch (e) {
      setError(e.message || 'Error de conexion');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const estadoData = stats?.porEstado || {};
  const total = stats?.total || recientes.length;

  const statCards = [
    { key: 'total', label: 'Total', value: total, color: colors.primary, bgColor: `${colors.primary}10` },
    { key: 'pendiente', label: 'Pendientes', value: estadoData['pendiente'] || 0, color: colors.warning, bgColor: `${colors.warning}10` },
    { key: 'en_revision', label: 'En revision', value: estadoData['en_revision'] || 0, color: colors.info, bgColor: `${colors.info}10` },
    { key: 'resuelto', label: 'Resueltos', value: estadoData['resuelto'] || 0, color: colors.success, bgColor: `${colors.success}10` },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: SPACING.xxxl }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <ScreenHeader title="Tablero" subtitle={`Bienvenido, ${user?.nombre}`} />

      <EmptyState loading={loading} error={error} onRetry={loadData}>
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, paddingHorizontal: SPACING.lg, marginBottom: SPACING.xxl }}>
            {statCards.map((stat) => (
              <View key={stat.key} style={{ flex: 1, minWidth: '42%' }}>
                <NeuCard radius={RADIUS.lg} style={{ overflow: 'hidden' }}>
                  <View style={{ padding: SPACING.lg }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm }}>
                      <View style={{ width: RADIUS.lg + 4, height: RADIUS.lg + 4, borderRadius: RADIUS.sm, backgroundColor: stat.bgColor, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name={STAT_ICONS[stat.key]} size={18} color={stat.color} />
                      </View>
                    </View>
                    <Text style={{ fontSize: FONT.hero, fontWeight: FONT.weight.heavy, color: stat.color, letterSpacing: -1 }}>
                      {stat.value}
                    </Text>
                    <Text style={{ fontSize: FONT.xs, marginTop: SPACING.xs, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: FONT.weight.semibold, color: colors.textSecondary }}>
                      {stat.label}
                    </Text>
                  </View>
                </NeuCard>
              </View>
            ))}
          </View>

          <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: FONT.xl, fontWeight: FONT.weight.bold, color: colors.text, letterSpacing: -0.3 }}>
                Alertas recientes
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Alertas')} accessibilityLabel="Ver todas las alertas" accessibilityRole="button">
                <Text style={{ fontSize: FONT.sm, fontWeight: FONT.weight.semibold, color: colors.primary }}>
                  Ver todas
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ paddingHorizontal: SPACING.lg, gap: SPACING.sm }}>
            {recientes.map((a) => (
              <TouchableOpacity
                key={a._id}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Alertas', { screen: 'AlertaDetail', params: { id: a._id } })}
                accessibilityLabel={`${a.tipo}: ${a.descripcion?.slice(0, 50)}`}
                accessibilityRole="button"
              >
                <NeuCard radius={RADIUS.md}>
                  <View style={{ padding: SPACING.lg }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm }}>
                      <NeuBadge preset={a.estado} />
                      <NeuBadge preset={a.tipo} style={{ paddingHorizontal: 8 }} />
                      <Text style={{ fontSize: FONT.xs, color: colors.textMuted, marginLeft: 'auto' }}>
                        {new Date(a.fecha).toLocaleDateString('es-ES')}
                      </Text>
                    </View>
                    <Text style={{ color: colors.text, fontSize: FONT.md, fontWeight: FONT.weight.medium, lineHeight: 20 }}>
                      {a.descripcion?.slice(0, 80)}{a.descripcion?.length > 80 ? '...' : ''}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.sm }}>
                      <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                      <Text style={{ color: colors.textMuted, fontSize: FONT.sm }}>
                        {a.sector}
                      </Text>
                    </View>
                  </View>
                </NeuCard>
              </TouchableOpacity>
            ))}
            {recientes.length === 0 && (
              <View style={{ alignItems: 'center', paddingVertical: SPACING.xxxl }}>
                <Ionicons name="document-text-outline" size={40} color={colors.textMuted} />
                <Text style={{ marginTop: SPACING.md, fontSize: FONT.md, color: colors.textMuted }}>
                  No hay alertas recientes
                </Text>
              </View>
            )}
          </View>
        </>
      </EmptyState>
    </ScrollView>
  );
}
