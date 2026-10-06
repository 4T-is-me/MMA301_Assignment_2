import React from 'react';
import { View, Text, Button } from 'react-native';
import { styles } from '../styles/AIRecommendationStyles';

export default function AIRecommendationScreen({ route, navigation }) {
    const { productId } = route.params || {};

    return (
        <View style={styles.container}>
            <Text style={styles.title}>AI Recommendation Screen</Text>
            <Text style={styles.subtitle}>Viewing Product ID: {productId}</Text>
            <Button
                title="Go to Cart"
                onPress={() => navigation.navigate('Cart')}
            />
        </View>
    );
}