/**
 * Account: trangtttce191027
 * Author: trangtttce191027
 * Issue / UC: UC02 - Cart Screen
 * Purpose: Màn hình giỏ hàng hiển thị danh sách sản phẩm đã chọn, tăng giảm số lượng, xóa khi về 0 và điều hướng đến thanh toán.
 */
import React, { useLayoutEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { styles } from '../styles/CartStyles';
import { useTheme } from '../contexts/ThemeContext';
import { useCart } from '../contexts/CartContext';
import CartItem from '../components/CartItem';
import { formatCurrency } from '../utils/formatCurrency';

export default function CartScreen({ navigation }) {
    const { theme } = useTheme();
    const { cartItems, itemCount, totalPrice, clearCart, total } = useCart();
    const isEmpty = cartItems.length === 0;

    useLayoutEffect(() => {
        const handleClearCart = () => {
            Alert.alert('Clear cart', 'Are you sure you want to clear your cart?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', onPress: clearCart },
            ]);
        };
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    onPress={() => handleClearCart()}
                    disabled={isEmpty}
                    accessibilityRole="button"
                    accessibilityLabel="Clear cart"
                    accessibilityState={{ disabled: isEmpty }}
                    style={[styles.clearHeaderButton, { backgroundColor: theme.colors.welcomeBg, opacity: isEmpty ? 0.4 : 1 }]}
                >
                    <Text style={[styles.clearHeaderButtonText, { color: theme.colors.primary }]}>Clear cart</Text>
                </TouchableOpacity>
            ),
        });
    }, [navigation, clearCart, isEmpty, theme]);

    const discountAmount = total - totalPrice;
    const handleCheckout = () => {
        navigation.navigate('Checkout');
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {cartItems.length > 0 ? (
                <View style={styles.cartItemContainer}>
                    <FlatList
                        style={{ flex: 1 }}
                        data={cartItems}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <CartItem product={item} />
                        )}
                        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
                        showsVerticalScrollIndicator={false}
                    />

                    {/* Footer Container with Bottom Tab Padding */}
                    <View style={[
                        styles.cartFooter,
                        {
                            backgroundColor: theme.colors.card,
                            borderTopColor: theme.colors.border,
                            // Extra padding to clear the bottom tab bar
                            paddingBottom: 24
                        }
                    ]}>
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: theme.colors.text }]}>
                                Total Items ({itemCount})
                            </Text>
                            <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                                {formatCurrency(total.toFixed(2))}
                            </Text>
                        </View>

                        {discountAmount > 0 && (
                            <View style={styles.summaryRow}>
                                <Text style={[styles.summaryLabel, { color: theme.colors.text }]}>
                                    Discount
                                </Text>
                                <Text style={[styles.summaryValue, { color: '#22c55e' }]}>
                                    -{formatCurrency(discountAmount.toFixed(2))}
                                </Text>
                            </View>
                        )}

                        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

                        <View style={styles.summaryRow}>
                            <Text style={[styles.totalLabel, { color: theme.colors.text }]}>
                                Final Total
                            </Text>
                            <Text style={[styles.totalPrice, { color: theme.colors.primary }]}>
                                {formatCurrency(totalPrice.toFixed(2))}
                            </Text>
                        </View>


                        <TouchableOpacity
                            onPress={handleCheckout}
                            disabled={cartItems.length === 0}
                            style={[styles.checkoutButton, { backgroundColor: theme.colors.primary }]}
                        >
                            <Text style={styles.checkoutButtonText}>
                                Proceed to Checkout
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <View style={styles.emptyCartContainer}>
                    <Text style={[styles.emptyCartText, { color: theme.colors.text }]}>
                        Your cart is empty!
                    </Text>
                </View>
            )}
        </View>
    );
}
