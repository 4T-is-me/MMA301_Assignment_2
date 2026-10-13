import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import ratingStars from '../utils/ratingStars';
import GetInitials from '../utils/getInitals';

export default function ReviewCard({ review }) {
    const { theme } = useTheme();
    const date = review.date ? new Date(review.date) : null;
    const formattedDate = date && !Number.isNaN(date.getTime())
        ? date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
        : 'Date unavailable';

    return (
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.header}>
                <View style={[styles.avatar, { backgroundColor: theme.colors.welcomeBg }]}>
                    <Text style={[styles.avatarText, { color: theme.colors.primary }]}>{GetInitials(review.reviewerName)}</Text>
                </View>
                <View style={styles.author}>
                    <Text style={[styles.name, { color: theme.colors.text }]}>{review.reviewerName || 'Anonymous'}</Text>
                    <View style={styles.rating}>
                        {ratingStars(review.rating).map((name, index) => (
                            <Ionicons key={index} name={name} size={14} color={theme.colors.primary} />
                        ))}
                    </View>
                </View>
            </View>
            <Text style={[styles.comment, { color: theme.colors.text }]}>{review.comment}</Text>
            <View style={[styles.dateRow, { borderTopColor: theme.colors.border }]}>
                <Ionicons name="calendar-outline" size={13} color={theme.colors.subText} />
                <Text style={[styles.date, { color: theme.colors.subText }]}>{formattedDate}</Text>
            </View>
        </View>
    );
}

export const styles = StyleSheet.create({
    card: { padding: 16, borderRadius: 16, borderWidth: 1, gap: 14 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 15, fontWeight: '700' },
    author: { flex: 1, gap: 6 },
    name: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
    rating: { flexDirection: 'row', gap: 3 },
    comment: { fontSize: 14, lineHeight: 22 },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, paddingTop: 12 },
    date: { fontSize: 12, lineHeight: 18 },
});
