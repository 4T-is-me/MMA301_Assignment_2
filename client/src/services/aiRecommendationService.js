/**
 * Account: trangtttce191027
 * Author: trangtttce191027
 * Issue / UC: UC06 - AI Recommendation API Client Service
 * Purpose: Dịch vụ gửi truy vấn prompt từ ứng dụng React Native lên Backend Express trung gian.
 */

import axios, { isCancel } from 'axios';

const API_URL = process.env.EXPO_PUBLIC_AI_API_URL;

export const AIRecommendationService = {
    getRecommendations: async (prompt, signal) => {
        if (!API_URL) throw new Error('AI API URL is not configured.');

        let response;
        try {
            response = await axios.post(
                `${API_URL.replace(/\/+$/, '')}/api/recommendations`,
                { prompt },
                { signal, timeout: 90000 }
            );
        } catch (error) {
            if (!error.response && !isCancel(error)) {
                throw new Error(error.code === 'ECONNABORTED'
                    ? 'AI request timed out. Please try again.'
                    : 'Cannot connect to the AI server. Check that the backend is running and reachable from this device.');
            }
            throw error;
        }

        const recommendations = response.data?.data?.recommendations;
        if (!Array.isArray(recommendations) || recommendations.some(item =>
            !item || !item.product || !Number.isInteger(item.product.id)
            || typeof item.product.title !== 'string' || !Number.isFinite(item.product.price)
            || item.product.price < 0 || typeof item.reason !== 'string')) {
            throw new Error('Invalid AI recommendations response.');
        }

        return recommendations;
    },
};
