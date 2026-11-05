/**
 * Author: trangtttce191027
 */

import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: { flex: 1 },
    listContent: { padding: 16, paddingBottom: 32 },
    orderCard: { padding: 18, marginBottom: 18, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
    orderId: { fontSize: 13, lineHeight: 20, fontWeight: '700', flex: 1, minWidth: 0 },
    orderStatus: { fontSize: 11, fontWeight: '700', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, overflow: 'hidden', flexShrink: 0 },
    orderDate: { fontSize: 12, lineHeight: 18, marginTop: 8 },
    divider: { height: 1, marginTop: 16, marginBottom: 2 },
    productRow: { marginHorizontal: -16 },
    productName: { fontSize: 14 },
    orderFooter: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: 16, marginTop: 2 },
    totalLabel: { fontSize: 13, fontWeight: '500' },
    totalPrice: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '700' },
});
