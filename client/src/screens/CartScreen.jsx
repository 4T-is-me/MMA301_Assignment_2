import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { styles } from '../styles/CartStyles';
import { useTheme } from '../contexts/ThemeContext';
import { useCart } from '../contexts/CartContext';
import CartItem from '../components/CartItem';
export default function CartScreen({navigation}) {
    const {theme} = useTheme();
    const { cartItems, itemCount, totalPrice, clearCart } = useCart();

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {cartItems.length > 0 ? (
                cartItems.map((item) => (
                    <>
                        <FlatList
                            style={{ flex: 1 }}
                            data={cartItems}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <CartItem product={item} />
                            )}
                            contentContainerStyle={{ padding: 16 }}
                        />
                        <View  style={[ styles.cartFooter,{ backgroundColor: theme.colors.card,  borderTopColor: theme.colors.border,}]} >
                            <Text style={{ color: theme.colors.text }}>
                                Total Items: {itemCount}
                            </Text>

                            <Text style={[styles.totalPrice, { color: theme.colors.primary  }]}
                            >
                                Total: ${totalPrice.toFixed(2)}
                            </Text>

                            <TouchableOpacity onPress={clearCart}  style={[ styles.clearButton,  { backgroundColor: theme.colors.primary } ]} >
                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                                    Clear Cart
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </>
                    
                ))
            ): (
                <View style={styles.emptyCartContainer}>
                    <Text style={styles.emptyCartText}>Your cart is empty!</Text>
                </View>
            )}
        </View>
    );
}

