import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AlertasScreen from '../components/screens/AlertasScreen';
import AlertaDetailScreen from '../components/screens/AlertaDetailScreen';

const Stack = createNativeStackNavigator();

export default function AlertNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AlertasList" component={AlertasScreen} />
      <Stack.Screen
        name="AlertaDetail"
        component={AlertaDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}
