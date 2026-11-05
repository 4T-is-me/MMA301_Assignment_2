/**
 * Author: trangtttce191027
 */
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../contexts/ThemeContext';
import AIRecommendationScreen from '../screens/AIRecommendationScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import ProductListScreen from '../screens/ProductListScreen';
import SettingsScreen from '../screens/SettingsScreen';
import WishlistScreen from '../screens/WishlistScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
    ProductList: ['bag-handle-outline', 'bag-handle'],
    Wishlist: ['sparkles-outline', 'sparkles'],
    AIRecommendation: ['color-wand-outline', 'color-wand'],
    Orders: ['receipt-outline', 'receipt'],
    Settings: ['settings-outline', 'settings'],
};

function MainTabs() {
    const { theme } = useTheme();

    return (
        <Tab.Navigator
        screenOptions={({ route }) => {
            const [inactiveIcon, activeIcon] = TAB_ICONS[route.name];

            return {
            headerShown: true,
            tabBarHideOnKeyboard: true,
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: theme.colors.subText,
            tabBarStyle: {
                backgroundColor: theme.colors.card,
                borderTopColor: theme.colors.border,
            },
            headerStyle: {
                backgroundColor: theme.colors.card,
            },
            headerTintColor: theme.colors.text,
            tabBarIcon: ({ focused, color, size }) => (
                <Ionicons
                name={focused ? activeIcon : inactiveIcon}
                size={size}
                color={color}
                />
            ),
            };
        }}
        >
        <Tab.Screen
            name="ProductList"
            component={ProductListScreen}
            options={{ title: 'List Products' }}
        />
        <Tab.Screen
            name="Wishlist"
            component={WishlistScreen}
            options={{ title: 'Wishlist' }}
        />
        <Tab.Screen
            name="AIRecommendation"
            component={AIRecommendationScreen}
            options={{ title: 'AI Recommendation' }}
        />
        <Tab.Screen
            name="Orders"
            component={OrdersScreen}
            options={{ title: 'Orders' }}
        />
        <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: 'Settings' }}
        />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    const { theme } = useTheme();

    return (
        <Stack.Navigator
        screenOptions={{
            headerShown: true,
            headerStyle: {
            backgroundColor: theme.colors.card,
            },
            headerTintColor: theme.colors.text,
        }}
        >
        <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{ headerShown: false }}
        />
        <Stack.Screen
            name="ProductDetail"
            component={ProductDetailScreen}
            options={{headerShown: false}}
        />
        <Stack.Screen
            name="Checkout"
            component={CheckoutScreen}
            options={{ title: 'Checkout' }}
        />
        <Stack.Screen
            name="Cart"
            component={CartScreen}
            options={{ title: 'Cart' }}
        />
        </Stack.Navigator>
    );
}