/**
 * Author: trangtttce191027
 */
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { CartProvider } from './src/contexts/CartContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { WishlistProvider } from './src/contexts/WishlistContext';
import { OrderProvider } from './src/contexts/OrderContext';

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
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
          <OrderProvider>
            <AppContent />
          </OrderProvider>
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

