import { StyleSheet } from 'react-native';


export const styles = StyleSheet.create({
    container: { flex: 1 },
    cartItemContainer: { flex: 1, gap: 16 },
    emptyCartContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
    emptyCartText: { fontSize: 16, textAlign: 'center' },
    totalPrice: { fontSize: 16, fontWeight: 'bold' },
    cartFooter: { paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, gap: 10, },
    clearButton: { padding: 14,  borderRadius: 10, alignItems: 'center',},
    cartFooter: {
        padding: 16,
        borderTopWidth: 1,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 14,
        opacity: 0.7,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        marginVertical: 8,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    totalPrice: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    clearButton: {
        marginTop: 12,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    clearButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    emptyCartContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyCartText: {
        fontSize: 16,
        fontWeight: '500',
        opacity: 0.6,
    }
});