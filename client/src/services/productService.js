import axios from 'axios';

/** @param {{ limit?: number, skip?: number, signal?: AbortSignal }} options */
export async function getProducts({ limit = 20, skip = 0, signal } = {}) {
    const response = await axios.get('https://dummyjson.com/products', {
        params: { limit, skip },
        signal,
        timeout: 15000,
    });

    if (!Array.isArray(response.data.products)) {
        throw new Error('Invalid products response');
    }

    return response.data.products;
}
