import axios from 'axios';

const BASE_URL = 'https://dummyjson.com/products';
/** @param {{ category?: string, limit?: number, skip?: number, signal?: AbortSignal }} options */
export async function getProducts({ category = 'all', limit = 20, skip = 0, signal } = {}) {
    const url = category === 'all'
        ? BASE_URL
        : `${BASE_URL}/category/${encodeURIComponent(category)}`;
    const response = await axios.get(url, {
        params: { limit, skip },
        signal,
        timeout: 15000,
    });

    const { products, total, skip: responseSkip, limit: responseLimit } = response.data;
    if (!Array.isArray(products) || !Number.isInteger(total) || total < 0
        || !Number.isInteger(responseSkip) || responseSkip < 0
        || !Number.isInteger(responseLimit) || responseLimit < 0) {
        throw new Error('Invalid products response');
    }

    // Retain metadata so the screen knows the location of the next page and when the data runs out.
    return { products, total, skip: responseSkip, limit: responseLimit };
}
