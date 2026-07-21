import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { tienePermiso } from '../permisos';
import { getColors, RADIUS, FONT } from '../theme';
import DashboardScreen from '../components/screens/DashboardScreen';
import AlertNavigator from './AlertNavigator';
import NuevaAlertaScreen from '../components/screens/NuevaAlertaScreen';
import PerfilScreen from '../components/screens/PerfilScreen';
import AdminScreen from '../components/screens/AdminScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Dashboard: { focused: 'grid', unfocused: 'grid-outline' },
  Alertas: { focused: 'notifications', unfocused: 'notifications-outline' },
  Nueva: { focused: 'add-circle', unfocused: 'add-circle-outline' },
  Perfil: { focused: 'person', unfocused: 'person-outline' },
  Admin: { focused: 'settings', unfocused: 'settings-outline' },
};

export default function MainNavigator() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const isAdmin = tienePermiso(user?.rol, 'usuarios:ver');

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          const iconName = focused ? icons.focused : icons.unfocused;
          return <Ionicons name={iconName} size={22} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          paddingBottom: 4,
          paddingTop: 6,
          height: 62,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: FONT.xs,
          fontWeight: FONT.weight.semibold,
          letterSpacing: 0.2,
        },
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Alertas" component={AlertNavigator} />
      <Tab.Screen
        name="Nueva"
        component={NuevaAlertaScreen}
        options={{ tabBarLabel: 'Nueva' }}
      />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
      {isAdmin && (
        <Tab.Screen name="Admin" component={AdminScreen} />
      )}
    </Tab.Navigator>
  );
}
