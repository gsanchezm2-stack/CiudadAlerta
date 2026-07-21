import { Platform } from 'react-native';

let API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  if (Platform.OS === 'android') {
    API_URL = 'http://10.0.2.2:5000';
  } else {
    API_URL = 'http://localhost:5000';
  }
}

export { API_URL };
