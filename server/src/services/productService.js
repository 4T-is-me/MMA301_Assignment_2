const API_URL = 'https://dummyjson.com/products';

export const getAllProducts = async () => {
    const response = await fetch(`${API_URL}?limit=0`, {
        signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) throw new Error('Failed to fetch products from DummyJSON.');

    const data = await response.json();
    return data.products || [];
};