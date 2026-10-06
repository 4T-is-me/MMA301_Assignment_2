import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles/CartStyles';

export default function CartScreen({navigation}) {
    return (
        <View style={styles.container}>
        <Text style={styles.title}>Cart Screen</Text>
        </View>
    );
}

