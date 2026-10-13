import { StyleSheet } from 'react-native';


export const styles = StyleSheet.create({
    container: { flex: 1 },
    emptyCartContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
    emptyCartText: { fontSize: 16, textAlign: 'center' },
    totalPrice: { fontSize: 16, fontWeight: 'bold' },
    cartFooter: { paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, gap: 10, },
    clearButton: { padding: 14,  borderRadius: 10, alignItems: 'center',},
});