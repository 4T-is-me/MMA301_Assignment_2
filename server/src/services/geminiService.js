
import { GoogleGenAI } from '@google/genai';
import { getAllProducts } from './productService.js';

const getTimeoutMs = () => {
    const timeout = Number(process.env.GEMINI_TIMEOUT_MS ?? 60000);
    if (!Number.isInteger(timeout) || timeout < 1000 || timeout > 120000) {
        throw Object.assign(new Error('GEMINI_TIMEOUT_MS must be between 1000 and 120000.'), { code: 'GEMINI_CONFIG' });
    }
    return timeout;
};

const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw Object.assign(new Error('Missing GEMINI_API_KEY'), { code: 'GEMINI_CONFIG' });
    return new GoogleGenAI({ apiKey });
};

export const getAIRecommendation = async (userPrompt) => {
    const products = await getAllProducts();
    const catalog = products.map(({ id, title, price, category, brand, description, rating, stock }) => ({
        id, title, price, category, brand, description, rating, stock,
    }));

    const prompt = `
        You are a product recommendation assistant for TechStore.
        Recommend up to 3 products based ONLY on the catalog below.

        Customer request: ${JSON.stringify(userPrompt)}

        Product catalog:
        ${JSON.stringify(catalog)}

        Rules:
        - Only recommend products from the provided catalog.
        - Return only valid JSON, without Markdown.
        - Use the exact product IDs from the catalog.
        - Respect the customer's budget and preferences.
        - Do not recommend out-of-stock products.
        - If nothing matches, return an empty recommendations array.
        - Keep each reason short.

        Response format:
        {"recommendations":[{"productId":1,"reason":"Why this product matches"}]}
    `;

    const ai = getGeminiClient();
    const timeoutMs = getTimeoutMs();
    const signal = AbortSignal.timeout(timeoutMs);

    let response;
    try {
        response = await ai.models.generateContent({
            model: process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash-lite',
            contents: prompt,
            config: {
                abortSignal: signal,
                httpOptions: { timeout: timeoutMs, retryOptions: { attempts: 1 } },
                responseMimeType: 'application/json',
                maxOutputTokens: 1024,
            },
        });
    } catch (error) {
        if (signal.aborted || error.name === 'AbortError' || error.name === 'TimeoutError'
            || error.status === 408 || error.status === 504) {
            throw Object.assign(new Error('Gemini request timed out.'), { code: 'GEMINI_TIMEOUT', cause: error });
        }
        throw error;
    }

    if (!response.text?.trim()) throw new Error('Gemini returned an empty response.');

    const result = JSON.parse(response.text);
    if (!Array.isArray(result.recommendations)) throw new Error('Invalid Gemini response format.');

    const productMap = new Map(products.map(product => [product.id, product]));
    const seen = new Set();

    const recommendations = result.recommendations
        .filter(item => {
            const product = productMap.get(item.productId);
            if (!product || product.stock <= 0 || seen.has(item.productId)) return false;
            if (typeof item.reason !== 'string' || !item.reason.trim()) return false;
            seen.add(item.productId);
            return true;
        })
        .slice(0, 3)
        .map(item => ({
            product: productMap.get(item.productId),
            reason: item.reason.trim(),
        }));

    return recommendations;
};
