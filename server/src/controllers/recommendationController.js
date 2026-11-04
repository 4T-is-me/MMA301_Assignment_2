/**
 * Account: trangtttce191027
 * Author: Tô Thị Thảo Trang (CE191027)
 * Issue / UC: UC06 - AI Recommendation Controller
 * Purpose: Controller tiếp nhận request từ client, kiểm tra độ dài prompt, gọi Gemini service và trả về mã lỗi HTTP có kiểm soát.
 */

import { getAIRecommendation } from '../services/geminiService.js';

export const recommendProducts = async (req, res) => {
    try {
        const { prompt } = req.body || {};

        if (typeof prompt !== 'string' || !prompt.trim()) {
            return res.status(400).json({ message: 'Prompt is required.' });
        }

        if (prompt.length > 1000) {
            return res.status(400).json({ message: 'Prompt must not exceed 1000 characters.' });
        }

        const recommendations = await getAIRecommendation(prompt.trim());

        return res.status(200).json({
            success: true,
            data: { recommendations },
        });
    } catch (error) {
        const timedOut = error.code === 'GEMINI_TIMEOUT' || error.code === 'CATALOG_TIMEOUT';
        const unavailable = error.status === 429 || error.status === 503;
        const configurationError = error.code === 'GEMINI_CONFIG';
        const status = timedOut ? 504 : unavailable ? 503 : configurationError ? 500 : 502;
        console.error('Gemini recommendation error:', { code: error.code, status: error.status, name: error.name });
        return res.status(status).json({
            success: false,
            message: timedOut ? 'AI recommendations took too long. Please try again.'
                : unavailable ? 'AI service is busy. Please try again later.'
                : 'Unable to generate recommendations. Please try again.',
        });
    }
};
