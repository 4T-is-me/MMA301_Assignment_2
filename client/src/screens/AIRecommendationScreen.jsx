
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/elements';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { AIRecommendationService } from '../services/aiRecommendationService';
import ProductCard from '../components/ProductCard';
import { styles } from '../styles/AIRecommendationStyles';

export default function AIRecommendationScreen() {
    const navigation = useNavigation();
    const headerHeight = useHeaderHeight();
    const { theme } = useTheme();
    const [prompt, setPrompt] = useState('');
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searched, setSearched] = useState(false);
    const requestController = useRef(null);

    useEffect(() => () => requestController.current?.abort(), []);

    const handleRecommend = async () => {
        const query = prompt.trim();
        if (!query || requestController.current) return;

        Keyboard.dismiss();
        const controller = new AbortController();
        requestController.current = controller;
        setLoading(true);
        setError('');
        setRecommendations([]);
        setSearched(false);

        try {
            const results = await AIRecommendationService.getRecommendations(query, controller.signal);
            if (!controller.signal.aborted) {
                setRecommendations(results);
                setSearched(true);
            }
        } catch (err) {
            if (!controller.signal.aborted) {
                console.error('AI recommendation error:', err);
                setError(err.response?.data?.message || err.message || 'Unable to get recommendations. Please try again.');
            }
        } finally {
            if (requestController.current === controller) {
                requestController.current = null;
                if (!controller.signal.aborted) setLoading(false);
            }
        }
    };

    const handleProductPress = (productId) => {
        navigation.getParent()?.navigate('ProductDetail', { productId });
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={headerHeight}
        >
            <FlatList
                style={styles.results}
                data={recommendations}
                keyExtractor={(item) => String(item.product.id)}
                numColumns={2}
                columnWrapperStyle={styles.productRow}
                contentContainerStyle={[styles.listContent, recommendations.length === 0 && styles.emptyList]}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={recommendations.length > 0 ? (
                    <View style={styles.resultsHeader}>
                        <View style={styles.headingRow}>
                            <Ionicons name="sparkles" size={18} color={theme.colors.primary} />
                            <Text style={[styles.resultsTitle, { color: theme.colors.text }]}>Picked for you</Text>
                        </View>
                        <Text style={[styles.resultCount, { color: theme.colors.subText }]}>{recommendations.length} matches</Text>
                    </View>
                ) : null}
                ListEmptyComponent={
                    <View style={styles.emptyContent}>
                        <View style={[styles.heroIcon, { backgroundColor: theme.colors.welcomeBg }]}>
                            {loading ? <ActivityIndicator size="large" color={theme.colors.primary} /> : <Ionicons name={error ? 'cloud-offline-outline' : 'color-wand-outline'} size={36} color={theme.colors.primary} />}
                        </View>
                        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                            {loading ? 'Finding your next favorite' : error ? 'Let’s try that again' : searched ? 'No matches this time' : 'Find your perfect match'}
                        </Text>
                        <Text style={[styles.emptyDescription, { color: theme.colors.subText }]} accessibilityLiveRegion="polite">
                            {loading ? 'Matching products to your needs. Just a moment...' : error || (searched ? 'Try a different budget or describe what matters most.' : 'Tell us your budget and what you’re looking for. We’ll find products that fit.')}
                        </Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <View style={styles.productContainer}>
                        <ProductCard product={item.product} onPress={handleProductPress} style={styles.recommendationCard} />
                        <View style={[styles.reasonBox, { backgroundColor: theme.colors.welcomeBg }]}>
                            <Ionicons name="sparkles-outline" size={14} color={theme.colors.primary} />
                            <Text style={[styles.reason, { color: theme.colors.text }]}>{item.reason}</Text>
                        </View>
                    </View>
                )}
            />

            <View style={[styles.composer, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }]}>
                <View style={styles.composerHeading}>
                    <Ionicons name="chatbubble-ellipses-outline" size={16} color={theme.colors.primary} />
                    <Text style={[styles.composerLabel, { color: theme.colors.text }]}>What are you looking for?</Text>
                </View>
                <View style={[styles.inputRow, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border }]}>
                    <TextInput
                        style={[styles.input, { color: theme.colors.text }]}
                        placeholder="A phone under $500 with a great camera..."
                        placeholderTextColor={theme.colors.subText}
                        accessibilityLabel="Describe the products you want"
                        value={prompt}
                        onChangeText={setPrompt}
                        multiline
                        maxLength={1000}
                        editable={!loading}
                    />
                    <Pressable
                        onPress={handleRecommend}
                        disabled={loading || !prompt.trim()}
                        accessibilityRole="button"
                        accessibilityLabel="Get AI recommendations"
                        accessibilityState={{ disabled: loading || !prompt.trim(), busy: loading }}
                        style={({ pressed }) => [styles.sendButton, { backgroundColor: theme.colors.primary, opacity: loading || !prompt.trim() ? 0.45 : pressed ? 0.8 : 1 }]}
                    >
                        {loading ? <ActivityIndicator color="#FFF" size="small" /> : <Ionicons name="arrow-up" size={24} color="#FFF" />}
                    </Pressable>
                </View>
                <View style={styles.composerFooter}>
                    <Text style={[styles.helper, { color: theme.colors.subText }]}>Your needs. Your budget. Your picks.</Text>
                    <Text style={[styles.helper, { color: theme.colors.subText }]}>{prompt.length}/1000</Text>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}