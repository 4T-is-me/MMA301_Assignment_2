/**
 * Author: trangtttce191027
 */
import React from 'react';
import { View, Text,Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/CheckoutStyles';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency } from '../utils/formatCurrency';
export default function CartCheckout({ item, index, imageUri, finalPrice}) {
    const { theme } = useTheme();
    return (
        <View key={item.id} style={[styles.itemRow, index > 0 && { borderTopWidth: 1, borderTopColor: theme.colors.border }]}>
            <View style={[styles.imageFrame, { backgroundColor: theme.colors.inputBg }]}>
                {imageUri ? <Image source={{ uri: imageUri }} style={styles.itemImage} /> : <Ionicons name="image-outline" size={24} color={theme.colors.subText} />}
            </View>
            <View style={styles.itemInfo}>
                <Text numberOfLines={2} style={[styles.itemTitle, { color: theme.colors.text }]}>{item.title}</Text>
                <Text style={[styles.itemMeta, { color: theme.colors.subText }]}>{formatCurrency(finalPrice)} / item</Text>
                <View style={styles.itemBottom}>
                    <Text style={[styles.quantity, { color: theme.colors.subText, backgroundColor: theme.colors.inputBg }]}>Qty {item.quantity}</Text>
                    <Text style={[styles.itemTotal, { color: theme.colors.primary }]}>{formatCurrency(finalPrice * item.quantity)}</Text>
                </View>
            </View>
        </View>
    )
}
