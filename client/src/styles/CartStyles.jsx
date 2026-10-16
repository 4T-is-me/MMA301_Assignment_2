import { StyleSheet } from 'react-native';


export const styles = StyleSheet.create({
    container: { flex: 1 },
    clearHeaderButton: { marginRight: 12, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
    clearHeaderButtonText: { fontSize: 13, fontWeight: '600' },
    cartItemContainer: { flex: 1, gap: 16 },
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
    checkoutButton: {
        marginTop: 12,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkoutButtonText: {
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
