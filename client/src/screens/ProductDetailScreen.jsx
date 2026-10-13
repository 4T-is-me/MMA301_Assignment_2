import React, { useEffect, useState } from 'react';
import { View, Text, Button, ActivityIndicator, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import { styles } from '../styles/ProductDetailStyles';
import { ProductService } from '../services/productService';
import { useTheme } from '../contexts/ThemeContext';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import ReviewCard from '../components/ReviewCard';
import ratingStars from '../utils/ratingStars';
import ImageViewing from 'react-native-image-viewing';
import ImageViewerHeader from '../components/ImageViewerHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Constants } from '../constants/constants';
import { useCart } from '../contexts/CartContext';

export default function ProductDetailScreen({ route, navigation }) {
    const { productId } = route.params || {};
    const { theme } = useTheme();
    const { addToCart } = useCart();
    const insets = useSafeAreaInsets();
    const accent = theme.colors.primary;

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [counter, setCounter] = useState(1);
    const [isVisible, setIsVisible] = useState(false);
    const [activeTab, setActiveTab] = useState('description');

    useEffect (() => {
        const controller = new AbortController();
        const fetchProductDetail = async () => {
            if (!productId) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const product = await ProductService.getProductById(productId, controller.signal);
                setProduct(product);
            } catch (error) {
                console.error(error);
                Toast.show({ type: 'error', text1: 'Unable to load product.', text2: 'Check your connection and tap Retry!' });
            } finally {
                setLoading(false);
            }
        }
        fetchProductDetail();

        return () => {
            controller.abort();
        }
    }, [productId]);

    const handleAddToCart = () => {
        const quantity = Number(counter);
        if (!product || product.stock <= 0 || !Number.isInteger(quantity) || quantity < 1) return;
        addToCart(product, quantity);
        setCounter(1);
        Toast.show({
            type: 'success',
            text1: 'Added to cart!',
            text2: `${product.title} added successfully.`,
        });

    }

    // Trạng thái đang tải
    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!product) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>{'Product not found'}</Text>
                <Button title="Go to Home" onPress={() => navigation.goBack()} />
            </View>
        );
    }

    const discount = product.discountPercentage || 0;
    const discountPrice = discount
                        ? product.price * (1 - discount / 100)
                        : product.price;

    const renderTabContent = () => {
        if(activeTab === 'description') {
            return (
                <View style={[styles.subContainer, { backgroundColor: theme.colors.background }]}>
                    <Text style={[styles.brand, { color: theme.colors.text }]}>{product.brand}</Text>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>About this product</Text>
                    <Text style={[styles.subtitle, { color: theme.colors.subText }]}>{product.description}</Text>
                    <Text style={[styles.warranty, { color: theme.colors.subText }]}>Warranty: {product.warrantyInformation}</Text>
                </View>
            )
        }

        if(activeTab === "shipping") {
            return(
                <View style={[styles.subContainer, { backgroundColor: theme.colors.background }]}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Shipping & returns</Text>
                    <Text style={[styles.shipping, { color: theme.colors.text }]}>
                        {product.shippingInformation}
                    </Text>
                    <Text style={[styles.returnProduct, { color: theme.colors.subText }]}>
                        {product.returnPolicy}
                    </Text>
                </View>
            )
        }

        if(activeTab === "reviews") {
            return (
                <View style={[styles.subContainer, { backgroundColor: theme.colors.background }]}>
                    {product.reviews?.length ? (
                        product.reviews.map((review, index) => (
                            <ReviewCard key={`${review.reviewerEmail}-${review.date}-${index}`} review={review} />
                        ))
                    ) : (
                        <Text style={[styles.noReviews, { color: theme.colors.text }]}>No reviews yet.</Text>
                    )}
                </View>
            )
        }
        return null;
    };

    const imageUri = product.thumbnail || product.images?.[0];
    const statusStockBadge = product.stock > 0 ? 'In stock' : 'Out of stock';
    return (
        <ScrollView
            style={[styles.screen, { backgroundColor: theme.colors.background }]}
            contentContainerStyle={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}
            keyboardShouldPersistTaps="handled"
        >
            {/* back button + image */}
            <View style={styles.productImageContainer}>
                {/* Click vào ảnh để mở chế độ phóng to */}
                <TouchableOpacity activeOpacity={0.9} onPress={() => setIsVisible(true)} style={styles.imageTouch} accessibilityLabel="View product image" accessibilityRole="button">
                    <Image source={{ uri: imageUri }} style={styles.productImage} />
                </TouchableOpacity>
                
                <View style={styles.productImageButton}>
                    <TouchableOpacity style={styles.imageAction} onPress={() => navigation.goBack()} accessibilityLabel="Go back" accessibilityRole="button">
                        <Ionicons name="arrow-back-outline" size={24} color={"#000"} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.imageAction} onPress={() => navigation.navigate('Cart')} accessibilityLabel="Open cart" accessibilityRole="button">
                        <Ionicons name="cart-outline" size={24}  color={"#000"} />
                    </TouchableOpacity>
                </View>

            </View>

            {/* Component hiển thị ảnh phóng to toàn màn hình */}
            <ImageViewing
                images={[{ uri: imageUri }]}
                imageIndex={0}
                visible={isVisible}
                onRequestClose={() => setIsVisible(false)}
                HeaderComponent={() => <ImageViewerHeader onClose={() => setIsVisible(false)} />}
                // Tùy chỉnh thêm giao diện nền đen khi phóng to
                presentationStyle="overFullScreen"
            />
            {/* infor + cart button */}
            <View style={styles.productInfoButton}>
                {/* category + status */}
                <View style={styles.categoryRow}>
                    <View style={[styles.categoryContainer, { backgroundColor: theme.colors.welcomeBg }]}>
                        <Text style={[styles.category, { color: theme.dark ? theme.colors.text : accent }]}>{product.category}</Text>
                    </View>
                    <View style={[ styles.statusContainer, statusStockBadge === 'Out of stock' ? styles.statusOutOfStock : styles.statusInStock]}>
                        <Text style={[ styles.status, { color: statusStockBadge === 'Out of stock' ? '#d9534f' : '#2e7d32' }]}>
                            {statusStockBadge}
                        </Text>
                    </View>
                </View>

                {/* Title*/}
                <Text style={[styles.title, { color: theme.colors.text }]}>{product.title}</Text>
                {/* rating + review count */}
                <View style={styles.ratingRow}>
                    {ratingStars(product.rating).map((name, index) => (
                        <View key={index}>
                            <Ionicons name={name} size={12} color={accent} />
                        </View>
                    ))}
                    <Text style={[styles.ratingText, { color: theme.colors.subText }]}>{product.rating.toFixed(1)}</Text>
                    <Text style={[styles.reviewCount, { color: theme.colors.subText }]}>({product.reviews?.length || 0} reviews)</Text>
                </View>

                {/* price + price discount + discount percentage */}
                <View style={styles.priceRow}>
                    <Text style={[styles.price, { color: theme.colors.text }]}>${discountPrice.toFixed(2)}</Text>
                    {discount > 0 && <View style={styles.discountRow}>
                        <Text style={[styles.originalPrice, { color: theme.colors.subText }]}>
                            ${product.price.toFixed(2)}
                        </Text>
                    </View>}
                    {discount > 0 && <View style={styles.discountPercentageRow}>
                        <Text style={[styles.discountPercentage, { color: theme.dark ? theme.colors.text : accent, backgroundColor: theme.colors.welcomeBg }]}>
                            -{Math.round(discount)}%
                        </Text>
                    </View>}
                </View>

                {/* add to cart button */}
                <View style={styles.addToCartButton}>
                    {/* counter */}
                    <View style={[styles.counter, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
                        <TouchableOpacity onPress={() => setCounter((value) => String(Math.max(1, Number(value) - 1)))} style={[styles.counterButton, {backgroundColor: theme.colors.primaryLight}]}>
                            <Ionicons name='remove-outline' size={24} color={theme.colors.primary} />
                        </TouchableOpacity>

                        <Text style={[styles.counterInput, { color: theme.colors.text }]}>
                            {counter}
                        </Text>

                        <TouchableOpacity onPress={() => setCounter((value) => String(Math.min(product.stock, Number(value) + 1)))} style={[styles.counterButton, {backgroundColor: theme.colors.primaryLight}]}>
                            <Ionicons name='add-outline' size={24} color={theme.colors.primary} />
                        </TouchableOpacity>
                    </View>

                    {/* add to cart */}
                    <TouchableOpacity style={[styles.cartAction, { backgroundColor: accent }]} onPress={handleAddToCart}>
                        <Ionicons name="cart-outline" size={20} color="#FFF" />
                        <Text style={[styles.addToCart, { color: '#FFF' }]}>Add to cart</Text>
                    </TouchableOpacity>

                </View>

            </View>

            {/* tab button */}
            <View style={[styles.tabContainer, { borderBottomColor: theme.colors.border }]} accessibilityRole="tablist">
                {Constants.TAB_PRODUCT.map((tab) => {
                    const selected = activeTab === tab.id;
                    const color = selected ? accent : theme.colors.subText;
                    return (
                        <TouchableOpacity
                            key={tab.id}
                            onPress={() => setActiveTab(tab.id)}
                            accessibilityRole="tab"
                            accessibilityState={{ selected }}
                            style={[styles.tabItem, selected && { borderBottomColor: accent, backgroundColor: theme.colors.welcomeBg }]}
                        >
                            <Ionicons name={tab.icon} size={20} color={color} />
                            <Text style={[styles.tabText, selected && styles.tabTextActive, { color }]}>{tab.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {renderTabContent()}
        </ScrollView>
    );
}
