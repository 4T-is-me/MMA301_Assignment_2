import React from 'react';
import { View, Text, Button } from 'react-native';
import { styles } from '../styles/ProductListStyles';

export default function ProductListScreen({ navigation }) {
    return (
        <View style={styles.container}>
        <Text style={styles.title}>Product List Screen (Catalog)</Text>
        <Button
            title="Go to Product Detail (Mock Item)"
            onPress={() => navigation.navigate('ProductDetail', { productId: 1 })}
        />
        </View>
    );
}

