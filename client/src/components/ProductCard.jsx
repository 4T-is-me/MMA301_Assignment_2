import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { styles } from '../styles/ProductListStyles';
import ratingStars from '../utils/ratingStars';
import { COLORS } from '../constants/theme';

function ProductCard({ product, onPress }) {
    const { theme } = useTheme();
    const accent = theme.colors.primary;
    const imageUri = product.thumbnail || product.images?.[0];
    const discount = product.discountPercentage || 0;
    // Calculate the price after applying the discount percentage.
    const finalPrice = product.price * (1 - discount / 100);
    // The API returns an array of reviews; use its length to display the count.
    const reviewCount = product.reviews?.length || 0;

    return (
        <View style={[
            styles.card,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border, shadowColor: theme.colors.text },
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
                {imageUri && (
                    <Image
                        source={{ uri: imageUri }}
                        style={styles.image}
                        resizeMode="contain"
                        accessibilityLabel={product.title}
                    />
                )}
            </View>
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
            <View style={styles.cardFooter}>
                <View style={styles.priceContainer}>
                    <View style={styles.discountRow}>
                        <Text style={[styles.originalPrice, { color: theme.colors.subText }]}>
                            ${product.price.toFixed(2)}
                        </Text>
                        <Text style={[styles.discountPercentage, { color: theme.dark ? theme.colors.text : accent, backgroundColor: theme.colors.welcomeBg }]}>
                            -{Math.round(discount)}%
                        </Text>
                    </View>
                    <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.finalPrice, { color: theme.colors.text }]}>
                        ${finalPrice.toFixed(2)}
                    </Text>
                </View>
                {/* button to display, no cart functionality yet. */}
                <Pressable
                    disabled
                    accessibilityRole="button"
                    accessibilityLabel="Add to cart (coming soon)"
                    accessibilityState={{ disabled: true }}
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
