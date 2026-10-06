import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles/SettingsStyles';

export default function SettingsScreen() {
    return (
        <View style={styles.container}>
        <Text style={styles.title}>Settings Screen</Text>
        </View>
    );
}