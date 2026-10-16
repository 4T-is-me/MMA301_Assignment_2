import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { styles } from '../styles/CartStyles';
import { useTheme } from '../contexts/ThemeContext';
import { useCart } from '../contexts/CartContext';
import CartItem from '../components/CartItem';
import { formatCurrency } from '../utils/formatCurrency';

export default function CartScreen({ navigation }) {
    const { theme } = useTheme();
    const { cartItems, itemCount, totalPrice, clearCart, total } = useCart();

    const discountAmount = total - totalPrice;

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
                            onPress={clearCart} 
                            style={[styles.clearButton, { backgroundColor: theme.colors.primary }]}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.clearButtonText}>
                                Clear Cart
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