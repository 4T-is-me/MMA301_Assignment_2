/**
 * Account: trangtttce191027
 * Author: trangtttce191027
 * Issue / UC: UC03 - Wishlist Screen
 * Purpose: Màn hình hiển thị các sản phẩm yêu thích từ Firebase Cloud Firestore, hỗ trợ xóa và xem chi tiết sản phẩm.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button } from 'react-native';
import { styles } from '../styles/WishlistStyles';
import { useTheme } from '../contexts/ThemeContext';
import { useWishlist } from '../contexts/WishlistContext';
import ProductCard from '../components/ProductCard';
import { ProductService } from '../services/productService';
export default function WishlistScreen({ navigation }) {
    const { theme } = useTheme();
    const { wishlist, loading, error, reloadWishlist } = useWishlist();
    const [products, setProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [productsError, setProductsError] = useState(null);
    const [retryAttempt, setRetryAttempt] = useState(0);

    const handleNavigateToProductDetail = (productId) => {
        navigation.navigate('ProductDetail', { productId });
    }

    useEffect(() => {
        let active = true;

        const loadProducts = async () => {
            if (loading || error) return;

            if (wishlist.length === 0) {
                setProducts([]);
                setProductsError(null);
                setProductsLoading(false);
                return;
            }

            try {
                setProductsLoading(true);
                setProductsError(null);

                const data = await Promise.all(
                    wishlist.map((item) =>
                        ProductService.getProductById(item.productId)
                    )
                );

                if (active) {
                    setProducts(data);
                }
            } catch (err) {
                if (active) {
                    setProductsError(err.message);
                }
            } finally {
                if (active) {
                    setProductsLoading(false);
                }
            }
        };

        loadProducts();

        return () => {
            active = false;
        };
    }, [wishlist, loading, error, retryAttempt]);


    if (loading || productsLoading) {
        return (
            <View style={styles.centerContainer}>
                <Text style={{ color: theme.colors.text }}>
                    Loading wishlist...
                </Text>
            </View>
        );
    }

    if (error || productsError) {
        return (
            <View style={styles.centerContainer}>
                <Text style={{ color: theme.colors.text }}>
                    Failed to load wishlist.
                </Text>
                <Button title="Retry" onPress={() => error ? reloadWishlist() : setRetryAttempt(attempt => attempt + 1)} />
            </View>
        );
    }
    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <FlatList
                data={products}
                keyExtractor={(item) => String(item.id)}
                numColumns={2}
                renderItem={({ item }) => (
                    <ProductCard
                        product={item}
                        onPress={handleNavigateToProductDetail}
                    />
                )}
                contentContainerStyle={{ padding: 12, flexGrow: 1 }}
                ListEmptyComponent={
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ color: theme.colors.subText }}>
                            Your wishlist is empty!
                        </Text>
                    </View>
                }
            />
        </View>
    );
}
