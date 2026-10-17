
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
                    : 'Cannot connect to the AI server. Check that the server and Android port forwarding are running.');
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
