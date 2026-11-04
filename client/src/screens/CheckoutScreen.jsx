/**
 * Account: trangtttce191027
 * Author: Tô Thị Thảo Trang (CE191027)
 * Issue / UC: UC04 / UC05 - Mock Checkout & Local Notification Workflow
 * Purpose: Màn hình thanh toán mô phỏng, lưu đơn hàng snapshot vào AsyncStorage, làm sạch giỏ hàng và kích hoạt thông báo cục bộ.
 */

import React, { useRef, useState } from 'react';
import { View, Text, Alert, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/CheckoutStyles';
import { NotificationService } from '../services/notificationService';
import { useTheme } from '../contexts/ThemeContext';
import { useCart } from '../contexts/CartContext';
import { useOrder } from '../contexts/OrderContext';
import { formatCurrency } from '../utils/formatCurrency';
import CartCheckout from '../components/CartCheckout';

export default function CheckoutScreen({ navigation }) {
    const { theme } = useTheme();
    const { cartItems, itemCount, totalPrice, total, clearCart } = useCart();
    const discountAmount = total - totalPrice;
    const { placeOrder } = useOrder();

    const [loading, setLoading] = useState(false);
    const placingOrder = useRef(false);

    const handlePlaceOrder = async () => {
        if (placingOrder.current || cartItems.length === 0) return;

        placingOrder.current = true;
        setLoading(true);

        try {
            const newOrder = await placeOrder(cartItems, totalPrice);
            clearCart();
            let notificationNote = '';
            try {
                await NotificationService.sendOrderNotification(newOrder.id);
            } catch (notificationError) {
                notificationNote = notificationError.code === 'PERMISSION_DENIED'
                    ? '\nNotifications are disabled. Enable them in device settings to receive updates.'
                    : '\nYour order was saved, but its notification could not be sent.';
                console.warn(
                    'Order saved, but notification failed:',
                    notificationError
                );
            }
            Alert.alert(
                'Payment successful!',
                `Payment for order #${newOrder.id} is complete.${notificationNote}`,
                [
                    {
                        text: 'View Orders',
                        onPress: () => navigation.navigate('MainTabs', { screen: 'Orders' }),
                    },
                ]
            );
        } catch (error) {
            console.error('Payment failed:', error);
            Alert.alert(
                'Payment failed',
                error.message || 'Unable to complete your payment.'
            );
        } finally {
            placingOrder.current = false;
            setLoading(false);
        }
    };

    return (
        <ScrollView
            style={[styles.screen, { backgroundColor: theme.colors.background }]}
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
        >
            <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <View style={[styles.cardHeader, { borderBottomColor: theme.colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Your items</Text>
                    <View style={[styles.countBadge, { backgroundColor: theme.colors.welcomeBg }]}>
                        <Text style={[styles.countText, { color: theme.colors.primary }]}>{itemCount} items</Text>
                    </View>
                </View>
                {cartItems.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="bag-outline" size={36} color={theme.colors.subText} />
                        <Text style={[styles.subtitle, { color: theme.colors.subText }]}>Your cart is empty.</Text>
                    </View>
                ) : cartItems.map((item, index) => {
                    const finalPrice = item.price * (1 - (item.discountPercentage || 0) / 100);
                    const imageUri = item.thumbnail || item.image || item.images?.[0];
                    return (
                        <CartCheckout key={item.id} item={item} index={index} imageUri={imageUri} finalPrice={finalPrice} />
                    );
                })}
            </View>

            <View style={[styles.card, styles.summary, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Payment summary</Text>
                <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: theme.colors.subText }]}>Total Items ({itemCount})</Text>
                    <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{formatCurrency(total)}</Text>
                </View>
                {discountAmount > 0 && (
                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: theme.colors.subText }]}>Discount</Text>
                        <Text style={[styles.summaryValue, { color: '#22c55e' }]}>-{formatCurrency(discountAmount)}</Text>
                    </View>
                )}
                <View style={[styles.totalRow, { borderTopColor: theme.colors.border }]}>
                    <Text style={[styles.totalLabel, { color: theme.colors.text }]}>Final Total</Text>
                    <Text style={[styles.totalPrice, { color: theme.colors.primary }]}>{formatCurrency(totalPrice)}</Text>
                </View>
                <View style={[styles.infoNote, { backgroundColor: theme.colors.welcomeBg }]}>
                    <Ionicons name="notifications-outline" size={18} color={theme.colors.primary} />
                    <Text style={[styles.infoText, { color: theme.colors.text }]}>Get a payment confirmation notification when notifications are enabled.</Text>
                </View>
            </View>

            <TouchableOpacity
                onPress={handlePlaceOrder}
                disabled={loading || cartItems.length === 0}
                accessibilityRole="button"
                accessibilityState={{ disabled: loading || cartItems.length === 0, busy: loading }}
                style={[styles.sendButton, { backgroundColor: theme.colors.primary, opacity: loading || cartItems.length === 0 ? 0.5 : 1 }]}
            >
                {loading ? <ActivityIndicator color="#FFF" /> : <Ionicons name="bag-check-outline" size={22} color="#FFF" />}
                <Text style={styles.sendButtonText}>{loading ? 'Processing payment...' : 'Pay now'}</Text>
                {!loading && <Ionicons name="arrow-forward" size={20} color="#FFF" />}
            </TouchableOpacity>
            <Text style={[styles.footerNote, { color: theme.colors.subText }]}>Review quantities and prices before confirming.</Text>
        </ScrollView>
    );
}
