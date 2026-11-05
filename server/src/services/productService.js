/**
 * Author: trangtttce191027
 */
const API_URL = 'https://dummyjson.com/products';

export const getAllProducts = async (signal) => {
    let response;
    try {
        response = await fetch(`${API_URL}?limit=0`, {
            signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),
        });
    } catch (error) {
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
            throw Object.assign(new Error('Product catalog request timed out.'), { code: 'CATALOG_TIMEOUT', cause: error });
        }
        throw error;
    }

    if (!response.ok) throw new Error('Failed to fetch products from DummyJSON.');

    const data = await response.json();
    if (!Array.isArray(data?.products) || data.products.some(product =>
        !product || !Number.isInteger(product.id) || typeof product.title !== 'string'
        || !Number.isFinite(product.price) || product.price < 0
        || !Number.isInteger(product.stock) || product.stock < 0)) {
        throw new Error('Invalid product catalog response.');
    }
    return data.products;
};
