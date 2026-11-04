/**
 * Author: trangtttce191027
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function ImageViewerHeader({ onClose }) {
    return (
        <SafeAreaProvider style={styles.provider}>
            <SafeAreaView edges={['top', 'left', 'right']} style={styles.root}>
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={onClose}
                    hitSlop={{ top: 16, left: 16, bottom: 16, right: 16 }}
                    accessibilityRole="button"
                    accessibilityLabel="Close image"
                >
                    <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    provider: { flex: 0 },
    root: { alignItems: 'flex-end' },
    closeButton: {
        marginRight: 8,
        marginTop: 8,
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 22,
        backgroundColor: '#00000077',
    },
    closeText: {
        lineHeight: 22,
        fontSize: 19,
        textAlign: 'center',
        color: '#FFF',
        includeFontPadding: false,
    },
});
