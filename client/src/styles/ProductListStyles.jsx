import { StyleSheet } from 'react-native';


export const styles = StyleSheet.create({
    container: { flex: 1 },
    list: { flex: 1 },
    listContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
    columnWrapper: { justifyContent: 'space-between', alignItems: 'stretch' },
    statusContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    statusText: { textAlign: 'center', marginTop: 12 },
    card: {
        width: '48%', borderWidth: 1, borderRadius: 18, padding: 10, marginBottom: 16,
        shadowColor: '#243B36', shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    },
    cardLink: { flex: 1 },
    cardPressed: { opacity: 0.8 },
    imageWrapper: { height: 148, borderRadius: 12, padding: 8, marginBottom: 12 },
    image: { width: '100%', height: '100%' },
    cardContent: { flex: 1 },
    // Chừa hai dòng tiêu đề để các thẻ có chiều cao đồng đều.
    productTitle: { fontSize: 14, lineHeight: 20, minHeight: 40, fontWeight: '600' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    ratingStars: { flexDirection: 'row', gap: 1 },
    reviewContainer: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    reviewText: { fontSize: 11 },
    cardFooter: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 14 },
    priceContainer: { flex: 1 },
    discountRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 6, rowGap: 2 },
    originalPrice: { fontSize: 11, textDecorationLine: 'line-through' },
    discountPercentage: { fontSize: 11, fontWeight: '600' },
    finalPrice: { fontSize: 20, fontWeight: '700', marginTop: 4 },
    cartButton: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
});
