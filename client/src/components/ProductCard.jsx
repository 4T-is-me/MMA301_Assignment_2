import React, { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { styles } from '../styles/ProductListStyles';
import ratingStars from '../utils/ratingStars';
import { COLORS } from '../constants/theme';
import { formatCurrency } from '../utils/formatCurrency';
import { useWishlist } from '../contexts/WishlistContext';
import Toast from 'react-native-toast-message';
import { ProductService } from '../services/productService';
import { useCart } from '../contexts/CartContext';
function ProductCard({ product, onPress, style }) {
    const { theme } = useTheme();
    const { addToCart } = useCart();
    const { isFavorite, addItem, removeItem } = useWishlist();

    const [counter, setCounter] = useState(1);
    const [wishlistLoading, setWishlistLoading] = useState(false);

    const accent = theme.colors.primary;
    const imageUri = product.thumbnail || product.images?.[0];
    const discount = product.discountPercentage || 0;
    // Calculate the price after applying the discount percentage.
    const finalPrice = product.price * (1 - discount / 100);
    // The API returns an array of reviews; use its length to display the count.
    const reviewCount = product.reviews?.length || 0;
    const favorite= isFavorite(product.id);

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

    const handleToggleWishlist = async () => {
        if(!product || wishlistLoading) return;
        const wasFavorite = isFavorite(product.id);
        try {
            setWishlistLoading(true);
            if(wasFavorite) {
                await removeItem(product.id);
            }else {
                await addItem(product);
            }
            Toast.show({
                type: 'success',
                text1: wasFavorite ? 'Removed from wishlist!' : 'Added to wishlist!',
            })
        } catch (error) {
            console.error("Error toggling wishlist", error);
            Toast.show({ type: 'error', text1: 'Unable to toggle wishlist.', text2: 'Check your connection and tap Retry!' });
        } finally {
            setWishlistLoading(false);
        }
    }

    return (
        <View style={[
            styles.card,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border, shadowColor: theme.colors.text },
            style,
        ]}>
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`View ${product.title}`}
            onPress={() => onPress(product.id)}
            style={({ pressed }) => [
                styles.cardLink,
                pressed && styles.cardPressed,
            ]}
        >
            <View style={[styles.imageWrapper, { backgroundColor: theme.colors.inputBg }]}>
                <Pressable
                    onPress={() => onPress(product.id)}
                    style={{ flex: 1 }}
                >
                    {imageUri && (
                        <Image
                            source={{ uri: imageUri }}
                            style={styles.image}
                            resizeMode="contain"
                            accessibilityLabel={product.title}
                        />
                    )}
                </Pressable>

                <Pressable
                    onPress={handleToggleWishlist}
                    disabled={wishlistLoading }
                    accessibilityRole="button"
                    accessibilityLabel={
                        favorite ? 'Remove from wishlist' : 'Add to wishlist'
                    }
                    style={[ styles.favoriteButton,   { backgroundColor: theme.colors.card }  ]}
                >
                    <Ionicons
                        name={favorite ? 'heart' : 'heart-outline'}
                        size={20}
                        color={favorite ? '#ef4444' : theme.colors.primary}
                    />
                </Pressable>
            </View>

            <Pressable
                onPress={() => onPress(product.id)}
                style={styles.cardLink}>

        
                <View style={styles.cardContent}>
                    <Text numberOfLines={2} style={[styles.productTitle, { color: theme.colors.text }]}>
                        {product.title}
                    </Text>
                    <View style={styles.ratingRow}>
                        <View
                            style={styles.ratingStars}
                            accessible
                            accessibilityLabel={`Rating ${product.rating || 0} out of 5`}
                        >
                            {ratingStars(product.rating).map((name, index) => (
                                <View key={index}>
                                    <Ionicons name={name} size={12} color={accent} />
                                </View>
                            ))}
                        </View>
                        <View style={styles.reviewContainer}>
                            <Ionicons name="chatbox-ellipses-outline" size={12} color={theme.colors.subText} />
                            <Text style={[styles.reviewText, { color: theme.colors.subText }]}>{reviewCount}</Text>
                        </View>
                    </View>
                </View>
            </Pressable>

        </Pressable>
            <View style={styles.cardFooter}>
                <View style={styles.priceContainer}>
                    <View style={styles.discountRow}>
                        <Text style={[styles.originalPrice, { color: theme.colors.subText }]}>
                            {formatCurrency(product.price)}
                        </Text>
                        <Text style={[styles.discountPercentage, { color: theme.dark ? theme.colors.text : accent, backgroundColor: theme.colors.welcomeBg }]}>
                            -{Math.round(discount)}%
                        </Text>
                    </View>
                    <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.finalPrice, { color: theme.colors.text }]}>
                        {formatCurrency(finalPrice)}
                    </Text>
                </View>
                {/* button cart*/}
                <Pressable
                    accessibilityRole="button"
                    onPress={handleAddToCart}
                    style={[styles.cartButton, { backgroundColor: accent }]}
                >
                    <Ionicons name="cart-outline" size={18} color={COLORS.dark.text} />
                </Pressable>
            </View>
        </View>
    );
}

// Do not re-render the component when product and the onPress function remain unchanged.
export default React.memo(ProductCard);
