/**
 * Account: trangtttce191027
 * Author: trangtttce191027
 * Issue / UC: UC04 - Order History Screen
 * Purpose: Màn hình hiển thị danh sách đơn hàng đã đặt trong quá khứ kèm chi tiết sản phẩm, ngày đặt và tổng tiền.
 */

import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/OrdersStyles';
import { useTheme } from '../contexts/ThemeContext';
import { useOrder } from '../contexts/OrderContext';
import OrderCard from '../components/OrderCard';

export default function OrdersScreen() {
    const { theme } = useTheme();
    const { orders } = useOrder();
    const renderOrder = ({ item }) => (
        <OrderCard item={item} />
    )

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <FlatList
                data={orders}
                keyExtractor={item => String(item.id)}
                renderItem={renderOrder}
                contentContainerStyle={[styles.listContent, orders.length === 0 && { flexGrow: 1 }]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="receipt-outline" size={56} color={theme.colors.subText} />
                        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No orders yet!</Text>
                        <Text style={{ color: theme.colors.subText }}>Your order history will appear here.</Text>
                    </View>
                }
            />
        </View>
    )
}
