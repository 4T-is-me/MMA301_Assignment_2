import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { CartProvider } from './src/contexts/CartContext';

function AppContent() {
  const { theme } = useTheme();

  return (
    <NavigationContainer theme={theme}>
      <AppNavigator />
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <Toast />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </ThemeProvider>
  );
}

