import React from 'react';
import { View, Text, Button } from 'react-native';
import { styles } from '../styles/ProductDetailStyles';

export default function ProductDetailScreen({ route, navigation }) {
    const { productId } = route.params || {};

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Product Detail Screen</Text>
            <Text style={styles.subtitle}>Viewing Product ID: {productId}</Text>
            <Button
                title="Go to Cart"
                onPress={() => navigation.navigate('Cart')}
            />
        </View>
    );
}
