import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, View, Text } from 'react-native';
import Toast from 'react-native-toast-message';
import ProductCard from '../components/ProductCard';
import { useTheme } from '../contexts/ThemeContext';
import { getProducts } from '../services/productService';
import { styles } from '../styles/ProductListStyles';

export default function ProductListScreen({ navigation }) {
    const { theme } = useTheme();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const controller = new AbortController();

        async function loadProducts() {
            try {
                const remoteProducts = await getProducts({
                    limit: 20,
                    skip: 0,
                    signal: controller.signal,
                });
                if (!controller.signal.aborted) {
                    setProducts(remoteProducts);
                }
            } catch {
                if (!controller.signal.aborted) {
                    setError('Unable to load products. Check your connection and reopen the app.');
                    Toast.show({
                        type: 'error',
                        text1: 'Unable to load products',
                        text2: 'Check your connection and reopen the app.',
                    });
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        loadProducts();
        return () => controller.abort();
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {loading ? (
                <View style={styles.statusContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={[styles.statusText, { color: theme.colors.subText }]}>
                        Loading products...
                    </Text>
                </View>
            ) : error ? (
                <View style={styles.statusContainer}>
                    <Text style={[styles.statusText, { color: theme.colors.text }]}>
                        {error}
                    </Text>
                </View>
            ) : (
                <FlatList
                    style={styles.list}
                    contentContainerStyle={styles.listContent}
                    data={products}
                    keyExtractor={(item) => String(item.id)}
                    numColumns={2}
                    columnWrapperStyle={styles.columnWrapper}
                    renderItem={({ item }) => (
                        <ProductCard
                            product={item}
                            onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                        />
                    )}
                    ListEmptyComponent={
                        <Text style={[styles.statusText, { color: theme.colors.subText }]}>
                            No products available.
                        </Text>
                    }
                />
            )}
        </View>
    );
}

