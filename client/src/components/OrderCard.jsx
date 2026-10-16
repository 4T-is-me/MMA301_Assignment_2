import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles/OrdersStyles';
import { formatCurrency } from '../utils/formatCurrency';
import { useTheme } from '../contexts/ThemeContext';
import CartCheckout from './CartCheckout';

export default function OrderCard({ item }) {
    const { theme } = useTheme();
    return (
        <View style={[styles.orderCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.orderHeader}>
                <Text style={[styles.orderId, { color: theme.colors.text }]} numberOfLines={1}>#{item.id}</Text>
                <Text style={[styles.orderStatus, { backgroundColor: theme.dark ? '#17382A' : '#E8F5EE', color: theme.dark ? '#86EFAC' : '#15803D' }]}>
                    {String(item.status).toLowerCase() === 'placed' ? 'Paid' : item.status}
                </Text>
            </View>

            <Text style={[styles.orderDate, { color: theme.colors.subText }]}>
                {new Date(item.createdAt).toLocaleString('en-GB', {
                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
            </Text>

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            {item.items.map(product => (
                <View key={product.id} style={styles.productRow}>
                    <CartCheckout item={product} index={0} imageUri={product.thumbnail || product.image} finalPrice={product.price} />
                </View>
            ))}

            <View style={[styles.orderFooter, { borderTopColor: theme.colors.border }]}>
                <Text style={[styles.totalLabel, { color: theme.colors.subText }]}>Order Total</Text>
                <Text style={[styles.totalPrice, { color: theme.colors.primary }]}>{formatCurrency(item.totalPrice)}</Text>
            </View>
        </View>
    )
}
