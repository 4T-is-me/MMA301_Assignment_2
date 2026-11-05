/**
 * Author: trangtttce191027
 */
//category
const CATEGORIES = [
    { value: 'all', label: 'All' },
    { value: 'smartphones', label: 'Smartphones' },
    { value: 'laptops', label: 'Laptops' },
    { value: 'tablets', label: 'Tablets' },
    { value: 'mobile-accessories', label: 'Accessories' },
    { value: 'mens-watches', label: "Men's Watches" },
    { value: 'womens-watches', label: "Women's Watches" },
];
const BANNER_URI = 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80';
const TAB_PRODUCT = [
                    { id: 'description', label: 'Description', icon: 'information-circle-outline' },
                    { id: 'reviews', label: 'Reviews', icon: 'chatbox-ellipses-outline' },
                    { id: 'shipping', label: 'Shipping', icon: 'cube-outline' },
                ]

export const Constants = {
    CATEGORIES,
    BANNER_URI,
    PAGE_SIZE: 20,
    TAB_PRODUCT
}
