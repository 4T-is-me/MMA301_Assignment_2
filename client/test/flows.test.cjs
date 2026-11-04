/**
 * Author: trangtttce191027
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHooks, loadModule } = require('./harness.cjs');
const colors = { primary: '#765EFF', text: '#111', subText: '#777', card: '#FFF' };
const theme = { colors, dark: false };
const styles = new Proxy({}, { get: () => ({}) });
const native = Object.fromEntries(['View', 'Text', 'Image', 'TextInput', 'Pressable', 'TouchableOpacity', 'ScrollView', 'FlatList', 'ActivityIndicator', 'RefreshControl', 'Button'].map(name => [name, name]));
native.Keyboard = { dismiss() {} };
native.StyleSheet = { create: value => value };
const themeMock = { useTheme: () => ({ theme }) };
const phone = { id: 1, title: 'Phone A', category: 'smartphones', price: 100, stock: 5, rating: 4, discountPercentage: 10, quantity: 1 };
const walk = tree => !tree || typeof tree !== 'object' ? [] : Array.isArray(tree) ? tree.flatMap(walk) : [tree, ...walk(tree.props?.children)];
const find = (tree, type) => walk(tree).find(node => node.type === type);
const textContent = tree => walk(tree).filter(node => node.type === 'Text').map(node => node.props.children.flat(Infinity).join('')).join(' ');

test('catalog screen: search hit/miss, pagination guard/end, category change, refresh and navigation', async () => {
    const hooks = createHooks();
    const calls = [];
    const navigation = { navigate: (...args) => calls.push(['navigate', ...args]) };
    const { default: Screen } = loadModule('src/screens/ProductListScreen.jsx', {
        react: hooks.react, 'react-native': native, '@expo/vector-icons': { Ionicons: 'Icon' },
        'react-native-toast-message': { show() {} }, '../components/ProductCard': 'ProductCard',
        '../contexts/ThemeContext': themeMock, '../styles/ProductListStyles': { styles },
        '../constants/theme': { COLORS: { dark: { text: '#FFF' } } },
        '../constants/constants': { Constants: { PAGE_SIZE: 2, CATEGORIES: [{ value: 'all', label: 'All' }, { value: 'smartphones', label: 'Smartphones' }] } },
        '../services/productService': { ProductService: { getProducts: async options => {
            calls.push(options);
            return { products: options.skip ? [{ ...phone, id: 3 }] : [phone, { ...phone, id: 2, title: 'Phone B' }], skip: options.skip, total: 3 };
        } } },
    });
    hooks.mount(Screen, { navigation }); await hooks.settle();
    let list = find(hooks.tree, 'FlatList');
    assert.equal(list.props.data.length, 1);
    const search = find(hooks.tree, 'TextInput');
    search.props.onChangeText('not-a-product'); await hooks.settle();
    assert.equal(find(hooks.tree, 'FlatList').props.data.length, 0);
    search.props.onChangeText('Phone A'); await hooks.settle();
    assert.equal(find(hooks.tree, 'FlatList').props.data[0].products.length, 1);
    search.props.onChangeText(''); await hooks.settle();
    list = find(hooks.tree, 'FlatList');
    list.props.onEndReached(); list.props.onEndReached(); await hooks.settle();
    assert.equal(calls.filter(call => call.skip === 2).length, 1);
    find(hooks.tree, 'FlatList').props.onEndReached(); await hooks.settle();
    assert.equal(calls.filter(call => call.skip === 2).length, 1);
    find(hooks.tree, 'FlatList').props.refreshControl.props.onRefresh(); await hooks.settle();
    assert.equal(calls.filter(call => call.skip === 0).length, 2);
    const category = walk(hooks.tree).find(node => node.type === 'Pressable' && textContent(node) === 'Smartphones');
    category.props.onPress(); await hooks.settle();
    assert.equal(calls.at(-1).category, 'smartphones');
    walk(hooks.tree).find(node => node.props?.accessibilityLabel === 'Find products with AI').props.onPress();
    assert.deepEqual(calls.at(-1), ['navigate', 'AIRecommendation']);
    hooks.unmount();
});

test('detail: aborted old request cannot replace the new product', async () => {
    const hooks = createHooks();
    const requests = new Map();
    const { default: Screen } = loadModule('src/screens/ProductDetailScreen.jsx', {
        react: hooks.react, 'react-native': native, '../styles/ProductDetailStyles': { styles },
        '../contexts/ThemeContext': themeMock, 'react-native-toast-message': { show() {} }, '@expo/vector-icons': { Ionicons: 'Icon' },
        '../components/ReviewCard': 'ReviewCard', '../utils/ratingStars': { default: () => [], __esModule: true },
        'react-native-image-viewing': 'ImageViewing', '../components/ImageViewerHeader': 'Header',
        'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) },
        '../constants/constants': { Constants: { TAB_PRODUCT: [] } }, '../contexts/CartContext': { useCart: () => ({ addToCart() {} }) },
        '../contexts/WishlistContext': { useWishlist: () => ({ isFavorite: () => false }) }, '../utils/formatCurrency': { formatCurrency: String },
        '../services/productService': { ProductService: { getProductById: (id, signal) => new Promise(resolve => requests.set(id, { signal, resolve })) } },
    });
    const navigation = { goBack() {}, navigate() {} };
    hooks.mount(Screen, { route: { params: { productId: 1 } }, navigation });
    hooks.updateProps({ route: { params: { productId: 2 } }, navigation });
    assert.equal(requests.get(1).signal.aborted, true);
    requests.get(2).resolve({ ...phone, id: 2, title: 'NEW PRODUCT' }); await hooks.settle();
    requests.get(1).resolve({ ...phone, title: 'STALE PRODUCT' }); await hooks.settle();
    assert.match(textContent(hooks.tree), /NEW PRODUCT/);
    assert.doesNotMatch(textContent(hooks.tree), /STALE PRODUCT/);
    hooks.unmount();
});

test('checkout: saved mock order survives notification denial and uses nested Orders navigation', async t => {
    t.mock.method(console, 'warn', () => {});
    t.mock.method(console, 'error', () => {});
    const hooks = createHooks();
    const events = [];
    let failSave = false;
    let alert;
    const { default: Screen } = loadModule('src/screens/CheckoutScreen.jsx', {
        react: hooks.react, 'react-native': { ...native, Alert: { alert: (...args) => { alert = args; } } },
        '@expo/vector-icons': { Ionicons: 'Icon' }, '../styles/CheckoutStyles': { styles }, '../contexts/ThemeContext': themeMock,
        '../contexts/CartContext': { useCart: () => ({ cartItems: [phone], itemCount: 1, total: 100, totalPrice: 90, clearCart: () => events.push('clear') }) },
        '../contexts/OrderContext': { useOrder: () => ({ placeOrder: async () => { if (failSave) throw Error('mock disk full'); events.push('saved'); return { id: 'test-order' }; } }) },
        '../services/notificationService': { NotificationService: { sendOrderNotification: async () => { events.push('notification'); throw Object.assign(Error('denied'), { code: 'PERMISSION_DENIED' }); } } },
        '../utils/formatCurrency': { formatCurrency: String }, '../components/CartCheckout': 'CartCheckout',
    });
    const navigation = { navigate: (...args) => events.push(args) };
    hooks.mount(Screen, { navigation });
    await find(hooks.tree, 'TouchableOpacity').props.onPress(); await hooks.settle();
    assert.deepEqual(events, ['saved', 'clear', 'notification']);
    assert.match(alert[1], /disabled/);
    alert[2][0].onPress();
    assert.equal(events.at(-1)[0], 'MainTabs');
    assert.equal(events.at(-1)[1].screen, 'Orders');
    events.length = 0; failSave = true;
    await find(hooks.tree, 'TouchableOpacity').props.onPress(); await hooks.settle();
    assert.deepEqual(events, []);
    assert.equal(alert[0], 'Payment failed');
});

test('product service: pagination metadata, missing detail ID, invalid response and API failure', async () => {
    let response = { data: { products: [phone], total: 2, skip: 0, limit: 1 } };
    const calls = [];
    const { ProductService } = loadModule('src/services/productService.js', { axios: { get: async (...args) => { calls.push(args); if (response instanceof Error) throw response; return response; } } });
    assert.equal((await ProductService.getProducts({ category: 'smartphones', limit: 1 })).total, 2);
    assert.match(calls[0][0], /category\/smartphones$/);
    await assert.rejects(ProductService.getProductById(), /required/);
    response = { data: { products: null } };
    await assert.rejects(ProductService.getProducts(), /Invalid products/);
    response = new Error('mock offline');
    await assert.rejects(ProductService.getProducts(), /offline/);
});

test('theme: toggle light/dark and restore preference on mock remount', async () => {
    const storage = new Map();
    const make = () => {
        const hooks = createHooks();
        const { ThemeProvider } = loadModule('src/contexts/ThemeContext.js', {
            react: hooks.react,
            '@react-native-async-storage/async-storage': { getItem: async key => storage.get(key) ?? null, setItem: async (key, value) => storage.set(key, value) },
            '@react-navigation/native': { DefaultTheme: { colors: {} }, DarkTheme: { colors: {} } },
            '../constants/theme': { COLORS: { primary: '#765EFF', light: { background: '#FFF' }, dark: { background: '#111' } } },
        });
        hooks.mount(ThemeProvider); return hooks;
    };
    const first = make(); await first.settle();
    assert.equal(first.value.theme.dark, false);
    first.value.toggleTheme(); await first.settle();
    assert.equal(first.value.theme.dark, true);
    first.unmount();
    const second = make(); await second.settle();
    assert.equal(second.value.theme.dark, true);
});

test('AI client: successful array, malformed items, network error, timeout and cancellation', async t => {
    const original = process.env.EXPO_PUBLIC_AI_API_URL;
    process.env.EXPO_PUBLIC_AI_API_URL = 'http://test.invalid';
    t.after(() => { if (original === undefined) delete process.env.EXPO_PUBLIC_AI_API_URL; else process.env.EXPO_PUBLIC_AI_API_URL = original; });
    let result = { data: { data: { recommendations: [{ product: phone, reason: 'match' }] } } };
    const { AIRecommendationService } = loadModule('src/services/aiRecommendationService.js', {
        axios: { post: async () => { if (result instanceof Error) throw result; return result; }, isCancel: error => error.code === 'ERR_CANCELED' },
    });
    assert.equal((await AIRecommendationService.getRecommendations('phone')).length, 1);
    result = { data: { data: { recommendations: [null] } } };
    await assert.rejects(AIRecommendationService.getRecommendations('phone'), /Invalid/);
    result = new Error('network');
    await assert.rejects(AIRecommendationService.getRecommendations('phone'), /Cannot connect/);
    result = Object.assign(new Error('timeout'), { code: 'ECONNABORTED' });
    await assert.rejects(AIRecommendationService.getRecommendations('phone'), /timed out/);
    result = Object.assign(new Error('cancelled'), { code: 'ERR_CANCELED' });
    await assert.rejects(AIRecommendationService.getRecommendations('phone'), error => error === result);
});

test('Firebase wishlist service: optional missing fields are omitted; save/read/remove stay user scoped', async () => {
    let record;
    const pathCalls = [];
    const { WishlistService } = loadModule('src/services/wishlistService.js', {
        '../config/firebase': { db: 'mock-db' },
        'firebase/firestore': {
            collection: (...args) => { pathCalls.push(args); return 'mock-collection'; },
            doc: (collection, id) => id,
            setDoc: async (id, value) => { assert.equal(id, '1'); assert.ok(!Object.values(value).includes(undefined)); record = value; },
            getDocs: async () => ({ docs: [{ id: '1', data: () => record }] }),
            deleteDoc: async id => { assert.equal(id, '1'); },
        },
    });
    await WishlistService.addToWishlist('mock-user', phone);
    assert.equal((await WishlistService.getWishlist('mock-user'))[0].id, 1);
    await WishlistService.removeFromWishlist('mock-user', 1);
    assert.ok(pathCalls.every(args => args[2] === 'mock-user' && args[3] === 'wishlist'));
    await assert.rejects(WishlistService.getWishlist(), /authentication/);
});

test('Firebase auth: existing session avoids sign-in; failed anonymous sign-in exposes error', async t => {
    t.mock.method(console, 'error', () => {});
    const hooks = createHooks();
    let listener;
    let signIns = 0;
    let stopped = false;
    const { AuthProvider } = loadModule('src/contexts/AuthContext.js', {
        react: hooks.react, '../config/firebase': { auth: {} },
        'firebase/auth': {
            onAuthStateChanged: (auth, callback) => { listener = callback; return () => { stopped = true; }; },
            signInAnonymously: async () => { signIns++; throw Error('mock auth offline'); },
        },
    });
    hooks.mount(AuthProvider);
    await listener({ uid: 'mock-user' }); await hooks.settle();
    assert.equal(hooks.value.user.uid, 'mock-user');
    assert.equal(signIns, 0);
    await listener(null); await hooks.settle();
    assert.equal(hooks.value.loading, false);
    assert.equal(hooks.value.error, 'mock auth offline');
    assert.equal(hooks.value.user, null);
    hooks.unmount(); assert.equal(stopped, true);
});

test('order card: line prices use the same discount as checkout and stored total', () => {
    const hooks = createHooks();
    const { default: Card } = loadModule('src/components/OrderCard.jsx', {
        react: hooks.react, 'react-native': native,
        '../styles/OrdersStyles': { styles }, '../contexts/ThemeContext': themeMock,
        '../utils/formatCurrency': { formatCurrency: String }, './CartCheckout': 'CartCheckout',
    });
    hooks.mount(Card, { item: { id: 'mock-order', status: 'Paid', createdAt: '2026-10-17T00:00:00Z', items: [phone], totalPrice: 90 } });
    assert.equal(find(hooks.tree, 'CartCheckout').props.finalPrice, 90);
});
