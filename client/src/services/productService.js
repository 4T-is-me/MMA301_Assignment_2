/**
 * Account: trangtttce191027
 * Author: Tô Thị Thảo Trang (CE191027)
 * Issue / UC: UC01 / UC02 - Remote Product Data Service
 * Purpose: Dịch vụ kết nối và gọi API DummyJSON (lấy danh sách sản phẩm, phân trang, chi tiết sản phẩm, danh mục).
 */
import axios from 'axios';

const BASE_URL = 'https://dummyjson.com/products';

export const ProductService = {

    /** @param {{ category?: string, limit?: number, skip?: number, signal?: AbortSignal }} options */
    getProducts: async({ category = 'all', limit = 20, skip = 0, signal } = {}) => {
    const url = category === 'all'
        ? BASE_URL
        : `${BASE_URL}/category/${encodeURIComponent(category)}`;
    const response = await axios.get(url, {
        params: { limit, skip },
        signal,
        timeout: 15000,
    })

    const { products, total, skip: responseSkip, limit: responseLimit } = response.data;
    if (!Array.isArray(products) || products.some(product => !product
        || !Number.isInteger(product.id) || product.id <= 0
        || typeof product.title !== 'string' || typeof product.category !== 'string'
        || !Number.isFinite(product.price) || product.price < 0
        || !Number.isInteger(product.stock) || product.stock < 0)
        || !Number.isInteger(total) || total < 0
        || !Number.isInteger(responseSkip) || responseSkip < 0
        || !Number.isInteger(responseLimit) || responseLimit < 0) {
        throw new Error('Invalid products response');
    }

    // Retain metadata so the screen knows the location of the next page and when the data runs out.
    return { products, total, skip: responseSkip, limit: responseLimit };
},

    /** @param {{ productId: string, signal?: AbortSignal }} options */
    getProductById: async (productId, signal) => {
        if (!productId) throw new Error('Product ID is required');
        const response = await axios.get(`${BASE_URL}/${productId}`, {
            signal,
            timeout: 15000,
        });
        const product = response.data;
        if (!product || !product.id) {
            throw new Error('Invalid product detail response');
        }
        return product;
    },
}
