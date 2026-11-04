/**
 * Account: trangtttce191027
 * Author: Tô Thị Thảo Trang (CE191027)
 * Issue / UC: UC01 - Product Catalog & Infinite Pagination
 * Purpose: Màn hình danh sách sản phẩm, tích hợp DummyJSON API với phân trang FlatList (limit/skip), lọc danh mục, tìm kiếm và kéo để làm mới (pull-to-refresh).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, ScrollView, TextInput, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import ProductCard from '../components/ProductCard';
import { useTheme } from '../contexts/ThemeContext';
import { ProductService } from '../services/productService';
import { styles } from '../styles/ProductListStyles';
import { Constants } from '../constants/constants';
import { COLORS } from '../constants/theme';

export default function ProductListScreen({ navigation }) {
    const { theme } = useTheme();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [skip, setSkip] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [retryAction, setRetryAction] = useState('initial');
    const controllerRef = useRef(null);// Keep request running => avoid duplicate calls and cancel when leaving the screen.
    const [searchText, setSearchText] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [bannerFailed, setBannerFailed] = useState(false);
    const accent = theme.colors.primary;

    const query = searchText.trim().toLowerCase();

    //Recalculate the group only when data or filters change.
    const groupedProducts = useMemo(() => {
        const loadedCategories = [...new Set(products.map((product) => product.category))]
            .map((value) => ({
                value,
                label: Constants.CATEGORIES.find((category) => category.value === value)?.label
                    || value.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
            }));
        const catalogCategories = selectedCategory === 'all'
            ? loadedCategories
            : loadedCategories.filter((category) => category.value === selectedCategory);

        // find in loaded products, no create api request.
        return catalogCategories.map((category) => ({
            ...category,
            products: products.filter((product) =>
                product.category === category.value && product.title.toLowerCase().includes(query)
            ),
        })).filter((group) => group.products.length > 0);
    }, [products, query, selectedCategory]);

    // each group = 2 column, last row(can be 1 or 2)
    const productRows = useMemo(() => groupedProducts.flatMap((group) => {
        const rows = [];
        for (let index = 0; index < group.products.length; index += 2) {
            rows.push({
                key: `${group.value}-${group.products[index].id}`,
                label: group.label,
                count: group.products.length,
                showHeading: index === 0,
                products: group.products.slice(index, index + 2),
            });
        }
        return rows;
    }), [groupedProducts]);

    //React.memo helper skips components with unchanging data.
    const openProduct = useCallback((productId) => {
        navigation.navigate('ProductDetail', { productId });
    }, [navigation]);

    const renderProductRow = useCallback(({ item }) => (
        <View>
            {item.showHeading && (
                <View style={styles.sectionHeading}>
                    <Text accessibilityRole="header" style={[styles.sectionTitle, { color: theme.colors.text }]}>{item.label}</Text>
                    <Text style={[styles.resultCount, { color: theme.colors.subText }]}>{item.count} products</Text>
                </View>
            )}
            <View style={styles.columnWrapper}>
                {item.products.map((product) => (
                    <React.Fragment key={product.id}>
                        <ProductCard product={product} onPress={openProduct} />
                    </React.Fragment>
                ))}
            </View>
        </View>
    ), [openProduct, theme.colors.text, theme.colors.subText]);

    const loadProducts = useCallback(async () => {
        if (controllerRef.current && !controllerRef.current.signal.aborted) return;
        const controller = new AbortController();
        controllerRef.current = controller;
        setLoading(true);
        setProducts([]);
        setSkip(0);
        setHasMore(false);
        setLoadingMore(false);
        setRefreshing(false);
        setError(null);
        try {
            // first page always skip = 0.
            const page = await ProductService.getProducts({ category: selectedCategory, limit: Constants.PAGE_SIZE, skip: 0, signal: controller.signal });
            if (controller.signal.aborted) return;
            setProducts(page.products);
            setSkip(page.skip + page.products.length);
            setHasMore(page.products.length > 0 && page.skip + page.products.length < page.total);
        } catch {
            if (controller.signal.aborted) return;
            setError('Unable to load products.');
            setRetryAction('initial');
            Toast.show({ type: 'error', text1: 'Unable to load products.', text2: 'Check your connection and tap Retry.' });
        } finally {
            if (!controller.signal.aborted) {
                controllerRef.current = null;
                setLoading(false);
            }
        }
    }, [selectedCategory]);

    async function loadMore() {
        // Do not continue downloading when busy or out of data.
        if (loading || loadingMore || refreshing || !hasMore || controllerRef.current) return;
        const controller = new AbortController();
        controllerRef.current = controller;
        setLoadingMore(true);
        setError(null);
        try {
            const page = await ProductService.getProducts({ category: selectedCategory, limit: Constants.PAGE_SIZE, skip, signal: controller.signal });
            if (controller.signal.aborted) return;
            // Append a new page;  ID appears only once.
            setProducts((current) => {
                const combined = [...current, ...page.products];
                return combined.filter((product, index) => combined.findIndex((item) => item.id === product.id) === index);
            });
            const nextSkip = page.skip + page.products.length;
            setSkip(nextSkip);
            setHasMore(page.products.length > 0 && nextSkip < page.total);
        } catch {
            if (controller.signal.aborted) return;
            setError('Unable to load more products.');
            setRetryAction('more');
            Toast.show({ type: 'error', text1: 'Unable to load more products.', text2: 'Check your connection and tap Retry.' });
        } finally {
            if (!controller.signal.aborted) {
                controllerRef.current = null;
                setLoadingMore(false);
            }
        }
    }

    async function refreshProducts() {
        if (loading || loadingMore || refreshing || controllerRef.current) return;
        const controller = new AbortController();
        controllerRef.current = controller;
        setRefreshing(true);
        setError(null);
        try {
            const page = await ProductService.getProducts({ category: selectedCategory, limit: Constants.PAGE_SIZE, skip: 0, signal: controller.signal });
            if (controller.signal.aborted) return;
            // Refresh replaces the old list and resets pagination to the first page.
            setProducts(page.products);
            setSkip(page.skip + page.products.length);
            setHasMore(page.products.length > 0 && page.skip + page.products.length < page.total);
        } catch {
            if (controller.signal.aborted) return;
            setError('Unable to refresh products.');
            setRetryAction('refresh');
            Toast.show({ type: 'error', text1: 'Unable to refresh products.', text2: 'Check your connection and tap Retry.' });
        } finally {
            if (!controller.signal.aborted) {
                controllerRef.current = null;
                setRefreshing(false);
            }
        }
    }

    function retryProducts() {
        if (retryAction === 'more') loadMore();
        else if (retryAction === 'refresh') refreshProducts();
        else loadProducts();
    }

    useEffect(() => {
        // Starts an external API request; loading state belongs to that request lifecycle.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadProducts();
        return () => controllerRef.current?.abort();
    }, [loadProducts]);

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.catalogControls}>
                <View style={styles.searchBarContainer}>
                    <View style={[styles.searchBar, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                        <Ionicons name="search-outline" size={20} color={accent} />
                        <TextInput
                            style={[styles.searchInput, { color: theme.colors.text }]}
                            placeholder="Search products..."
                            placeholderTextColor={theme.colors.subText}
                            accessibilityLabel="Search products by title"
                            value={searchText}
                            onChangeText={setSearchText}
                            autoCapitalize="none"
                            autoCorrect={false}
                            returnKeyType="search"
                        />
                        {searchText.length > 0 && (
                            <Pressable onPress={() => setSearchText('')} accessibilityRole="button" accessibilityLabel="Clear search" style={styles.clearButton}>
                                <Ionicons name="close-circle" size={20} color={theme.colors.subText} />
                            </Pressable>
                        )}
                    </View>
                    <TouchableOpacity
                        style={[styles.headerCartButton, { backgroundColor: theme.colors.primary }]}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Open cart"
                        onPress={() => navigation.navigate('Cart')}
                    >
                        <Ionicons name="cart-outline" size={22} color={COLORS.dark.text} />
                    </TouchableOpacity>
                </View>
                {/* category*/}
                <ScrollView horizontal style={styles.categoryScroller} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow} keyboardShouldPersistTaps="handled">
                    {Constants.CATEGORIES.map((category) => {
                        const selected = selectedCategory === category.value;
                        return (
                            <Pressable
                                key={category.value}
                                onPress={() => setSelectedCategory(category.value)}
                                accessibilityRole="button"
                                accessibilityState={{ selected }}
                                style={[styles.categoryChip, { backgroundColor: selected ? accent : theme.colors.card, borderColor: selected ? accent : theme.colors.border }]}
                            >
                                <Text style={[styles.categoryLabel, { color: selected ? COLORS.dark.text : theme.colors.subText }]}>{category.label}</Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>
            </View>
            {!loading && error && products.length > 0 && (
                <View style={[styles.errorBanner, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                    <Text accessibilityRole="alert" style={[styles.errorMessage, { color: theme.colors.text }]}>{error} Check your connection and tap Retry.</Text>
                    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Retry products" onPress={retryProducts} style={[styles.retryButton, { backgroundColor: accent }]}>
                        <Text style={{ color: COLORS.dark.text }}>Retry</Text>
                    </TouchableOpacity>
                </View>
            )}
            {loading ? (
                <View style={styles.statusContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={[styles.statusText, { color: theme.colors.subText }]}>
                        Loading products...
                    </Text>
                </View>
            ) : error && products.length === 0 ? (
                <View style={styles.statusContainer}>
                    <Text style={[styles.statusText, { color: theme.colors.text }]}>
                        {error}
                    </Text>
                    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Retry products" onPress={retryProducts} style={[styles.retryButton, { backgroundColor: accent }]}>
                        <Text style={{ color: COLORS.dark.text }}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    style={styles.list}
                    contentContainerStyle={styles.listContent}
                    data={productRows}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshProducts} tintColor={accent} colors={[accent]} />}
                    onEndReached={() => {
                        if (!error) loadMore();
                    }}
                    onEndReachedThreshold={0.3}
                    ListFooterComponent={
                        <View style={styles.listFooter}>
                            {loadingMore ? (
                                <>
                                    <ActivityIndicator color={accent} />
                                    <Text style={[styles.statusText, { color: theme.colors.subText }]}>Loading more products...</Text>
                                </>
                            ) : !error && !hasMore && products.length > 0 ? (
                                <Text style={{ color: theme.colors.subText }}>No more products</Text>
                            ) : null}
                        </View>
                    }
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    ListHeaderComponent={
                        <View>
                            <View style={[styles.promoBanner, { backgroundColor: accent, borderColor: accent }]}>
                                {/* if error, Retain the banner content on the colored background. */}
                                {!bannerFailed && <Image source={{ uri: Constants.BANNER_URI }} style={styles.bannerImage} resizeMode="cover" onError={() => setBannerFailed(true)} />}
                                <View style={[styles.bannerShade, { backgroundColor: COLORS.dark.background }]} />
                                <View style={[styles.bannerContent, { borderLeftColor: accent }]}>
                                    <Text style={[styles.bannerEyebrow, { color: theme.colors.primaryLight }]}>TECH PICKS</Text>
                                    <Text style={[styles.bannerTitle, { color: COLORS.dark.text }]}>Upgrade your everyday</Text>
                                    <Text style={[styles.bannerSubtitle, { color: theme.colors.primaryLight }]}>Discover devices that fit your life.</Text>
                                </View>
                            </View>
                        </View>
                    }
                    keyExtractor={(item) => item.key}
                    renderItem={renderProductRow}
                    ListEmptyComponent={
                        <Text style={[styles.statusText, { color: theme.colors.subText }]}>
                            No products found.
                        </Text>
                    }
                />
            )}
            <Pressable
                onPress={() => navigation.navigate('AIRecommendation')}
                accessibilityRole="button"
                accessibilityLabel="Find products with AI"
                style={({ pressed }) => [styles.aiFab, { backgroundColor: accent, opacity: pressed ? 0.85 : 1 }]}
            >
                <Ionicons name="sparkles" size={24} color="#FFF" />
                <Text style={styles.aiFabText}>Ask AI</Text>
            </Pressable>
        </View>
    );
}

