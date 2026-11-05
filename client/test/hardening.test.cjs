/**
 * Author: trangtttce191027
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHooks, loadModule } = require('./harness.cjs');
const styles = new Proxy({}, { get: () => ({}) });
const themeMock = { useTheme: () => ({ theme: { colors: {}, dark: true } }) };
const native = Object.fromEntries(['View', 'Text', 'Button', 'FlatList', 'Pressable', 'TouchableOpacity', 'ActivityIndicator', 'RefreshControl', 'TextInput', 'ScrollView', 'Image', 'KeyboardAvoidingView'].map(name => [name, name]));
native.Keyboard = { dismiss() {} };
native.Platform = { OS: 'android' };
const phone = { id: 1, title: 'Phone', category: 'smartphones', price: 100, stock: 5, rating: 4 };
const walk = tree => !tree || typeof tree !== 'object' ? [] : Array.isArray(tree) ? tree.flatMap(walk) : [tree, ...walk(tree.props?.children)];
const find = (tree, type) => walk(tree).find(node => node.type === type);
const retry = tree => walk(tree).find(node => node.props?.accessibilityLabel === 'Retry products'
    || (node.type === 'TouchableOpacity' && JSON.stringify(node.props.children).includes('"Retry"')));

function catalog(getProducts) {
    const hooks = createHooks();
    const { default: Screen } = loadModule('src/screens/ProductListScreen.jsx', {
        react: hooks.react, 'react-native': native, '@expo/vector-icons': { Ionicons: 'Icon' },
        'react-native-toast-message': { show() {} }, '../components/ProductCard': 'ProductCard',
        '../contexts/ThemeContext': themeMock, '../styles/ProductListStyles': { styles },
        '../constants/theme': { COLORS: { dark: {} } },
        '../constants/constants': { Constants: { PAGE_SIZE: 2, CATEGORIES: [{ value: 'all', label: 'All' }, { value: 'smartphones', label: 'Smartphones' }] } },
        '../services/productService': { ProductService: { getProducts } },
    });
    hooks.mount(Screen, { navigation: { navigate() {} } });
    return hooks;
}

test('catalog offline refresh: visible Retry retains loaded list and retries page zero once', async () => {
    let offline = false;
    let resolveRetry;
    const calls = [];
    const hooks = catalog(async options => {
        calls.push(options.skip);
        if (offline) throw Error('offline');
        if (calls.length > 2) return new Promise(resolve => { resolveRetry = resolve; });
        return { products: [phone], skip: 0, total: 3 };
    });
    await hooks.settle();
    const original = find(hooks.tree, 'FlatList').props.data;
    offline = true;
    find(hooks.tree, 'FlatList').props.refreshControl.props.onRefresh(); await hooks.settle();
    assert.deepEqual(find(hooks.tree, 'FlatList').props.data, original);
    // Walk only rendered children: a FlatList footer is not guaranteed to be visible.
    assert.ok(retry(hooks.tree), 'Retry must be outside the scrolling list footer');
    find(hooks.tree, 'FlatList').props.onEndReached(); await hooks.settle();
    assert.equal(calls.length, 2, 'failed refresh must not silently start pagination');
    offline = false;
    const button = retry(hooks.tree);
    button.props.onPress(); button.props.onPress(); await hooks.settle();
    assert.deepEqual(calls, [0, 0, 0]);
    assert.deepEqual(find(hooks.tree, 'FlatList').props.data, original);
    assert.equal(find(hooks.tree, 'FlatList').props.refreshControl.props.refreshing, true);
    resolveRetry({ products: [{ ...phone, title: 'Updated phone' }], skip: 0, total: 1 }); await hooks.settle();
    assert.equal(retry(hooks.tree), undefined);
    assert.equal(find(hooks.tree, 'FlatList').props.data[0].products[0].title, 'Updated phone');
    hooks.unmount();
});

test('catalog first load offline: loading ends, visible Retry recovers, empty success is not error', async () => {
    let offline = true;
    const hooks = catalog(async () => {
        if (offline) throw Error('offline');
        return { products: [], skip: 0, total: 0 };
    });
    assert.ok(find(hooks.tree, 'ActivityIndicator'));
    await hooks.settle();
    assert.ok(retry(hooks.tree));
    offline = false; retry(hooks.tree).props.onPress(); await hooks.settle();
    const list = find(hooks.tree, 'FlatList');
    assert.equal(list.props.data.length, 0);
    assert.equal(retry(hooks.tree), undefined);
    assert.match(JSON.stringify(list.props.ListEmptyComponent), /No products found/);
    hooks.unmount();
});

test('catalog pagination failure: Retry preserves rows and resumes the failed offset', async () => {
    let offline = false;
    const calls = [];
    const hooks = catalog(async options => {
        calls.push(options.skip);
        if (offline) throw Error('offline');
        return { products: [{ ...phone, id: options.skip + 1 }], skip: options.skip, total: 2 };
    });
    await hooks.settle(); offline = true;
    find(hooks.tree, 'FlatList').props.onEndReached(); await hooks.settle();
    assert.equal(find(hooks.tree, 'FlatList').props.data[0].products.length, 1);
    assert.ok(retry(hooks.tree));
    offline = false; retry(hooks.tree).props.onPress(); await hooks.settle();
    assert.deepEqual(calls, [0, 1, 1]);
    assert.equal(find(hooks.tree, 'FlatList').props.data[0].products.length, 2);
    find(hooks.tree, 'FlatList').props.onEndReached(); await hooks.settle();
    assert.equal(calls.length, 3);
    hooks.unmount();
});

test('product service rejects malformed catalog records before grouping/rendering', async () => {
    let products;
    const { ProductService } = loadModule('src/services/productService.js', { axios: { get: async () => ({ data: { products, total: 1, skip: 0, limit: 20 } }) } });
    for (const record of [null, { ...phone, title: null }, { ...phone, category: null }, { ...phone, price: -1 }]) {
        products = [record];
        await assert.rejects(ProductService.getProducts(), /Invalid products response/);
    }
});

test('detail offline: Retry loads the product; failed wishlist action points to the heart', async t => {
    t.mock.method(console, 'error', () => {});
    const hooks = createHooks();
    let offline = true;
    const messages = [];
    const { default: Screen } = loadModule('src/screens/ProductDetailScreen.jsx', {
        react: hooks.react, 'react-native': native, '../styles/ProductDetailStyles': { styles },
        '../contexts/ThemeContext': themeMock, 'react-native-toast-message': { show: value => messages.push(value) },
        '@expo/vector-icons': { Ionicons: 'Icon' }, '../components/ReviewCard': 'ReviewCard',
        '../utils/ratingStars': { default: () => [], __esModule: true }, 'react-native-image-viewing': 'ImageViewing',
        '../components/ImageViewerHeader': 'Header', 'react-native-safe-area-context': { useSafeAreaInsets: () => ({}) },
        '../constants/constants': { Constants: { TAB_PRODUCT: [] } }, '../contexts/CartContext': { useCart: () => ({ addToCart() {} }) },
        '../contexts/WishlistContext': { useWishlist: () => ({ isFavorite: () => false, addItem: async () => { throw Error('offline'); } }) },
        '../utils/formatCurrency': { formatCurrency: String },
        '../services/productService': { ProductService: { getProductById: async () => { if (offline) throw Error('offline'); return phone; } } },
    });
    hooks.mount(Screen, { route: { params: { productId: 1 } }, navigation: { goBack() {} } }); await hooks.settle();
    const button = walk(hooks.tree).find(node => node.props?.title === 'Retry');
    assert.ok(button, 'load failure must offer the advertised Retry');
    offline = false; button.props.onPress(); await hooks.settle();
    assert.equal(walk(hooks.tree).some(node => node.props?.title === 'Retry'), false);
    const heart = walk(hooks.tree).find(node => node.props?.accessibilityLabel === 'Add to wishlist');
    assert.ok(heart);
    await heart.props.onPress(); await hooks.settle();
    assert.match(messages.at(-1).text2, /heart again/);
    assert.doesNotMatch(messages.at(-1).text2, /tap Retry/);
    hooks.unmount();
});

test('wishlist context: failed read can be retried without a Firestore mutation', async t => {
    t.mock.method(console, 'error', () => {});
    const hooks = createHooks();
    let offline = true;
    let reads = 0;
    const { WishlistProvider } = loadModule('src/contexts/WishlistContext.js', {
        react: hooks.react, './AuthContext': { useAuth: () => ({ user: { uid: 'mock-user' }, loading: false }) },
        '../services/wishlistService': { WishlistService: { getWishlist: async () => { reads++; if (offline) throw Error('offline'); return [{ id: 1, productId: 1 }]; } } },
    });
    hooks.mount(WishlistProvider); await hooks.settle();
    assert.equal(hooks.value.error, 'offline');
    offline = false; hooks.value.reloadWishlist(); await hooks.settle();
    assert.equal(reads, 2);
    assert.equal(hooks.value.error, null);
    assert.equal(hooks.value.wishlist.length, 1);
    hooks.unmount();
});

test('wishlist screen: product-fetch Retry recovers; context errors retry the context', async () => {
    const hooks = createHooks();
    let offline = true;
    let contextRetries = 0;
    const context = { wishlist: [{ productId: 1 }], loading: false, error: null, reloadWishlist: () => contextRetries++ };
    const { default: Screen } = loadModule('src/screens/WishlistScreen.jsx', {
        react: hooks.react, 'react-native': native, '../styles/WishlistStyles': { styles },
        '../contexts/ThemeContext': themeMock, '../contexts/WishlistContext': { useWishlist: () => context },
        '../components/ProductCard': 'ProductCard', '../services/productService': { ProductService: { getProductById: async () => { if (offline) throw Error('offline'); return phone; } } },
    });
    hooks.mount(Screen, { navigation: { navigate() {} } }); await hooks.settle();
    assert.equal(find(hooks.tree, 'Button').props.title, 'Retry');
    offline = false; find(hooks.tree, 'Button').props.onPress(); await hooks.settle();
    assert.equal(find(hooks.tree, 'FlatList').props.data[0].id, 1);
    context.error = 'mock permission denied'; hooks.render();
    find(hooks.tree, 'Button').props.onPress();
    assert.equal(contextRetries, 1);
    hooks.unmount();
});

test('AI screen: empty input, duplicate submit, error recovery and empty result', async t => {
    t.mock.method(console, 'error', () => {});
    const hooks = createHooks();
    let calls = 0;
    let pending;
    const { default: Screen } = loadModule('src/screens/AIRecommendationScreen.jsx', {
        react: hooks.react, 'react-native': native,
        '@react-navigation/native': { useNavigation: () => ({ getParent: () => ({ navigate() {} }) }) },
        '@react-navigation/elements': { useHeaderHeight: () => 0 }, '@expo/vector-icons': { Ionicons: 'Icon' },
        '../contexts/ThemeContext': themeMock, '../styles/AIRecommendationStyles': { styles }, '../components/ProductCard': 'ProductCard',
        '../services/aiRecommendationService': { AIRecommendationService: { getRecommendations: () => { calls++; return new Promise((resolve, reject) => { pending = { resolve, reject }; }); } } },
    });
    hooks.mount(Screen);
    const send = () => walk(hooks.tree).find(node => node.props?.accessibilityLabel === 'Get AI recommendations');
    assert.equal(send().props.disabled, true);
    await send().props.onPress(); assert.equal(calls, 0);
    find(hooks.tree, 'TextInput').props.onChangeText('phone'); await hooks.settle();
    send().props.onPress(); send().props.onPress(); await hooks.settle();
    assert.equal(calls, 1);
    assert.equal(send().props.disabled, true);
    pending.reject(Error('mock server offline')); await hooks.settle();
    assert.equal(send().props.disabled, false);
    assert.match(JSON.stringify(find(hooks.tree, 'FlatList').props.ListEmptyComponent), /mock server offline/);
    send().props.onPress(); await hooks.settle(); pending.resolve([]); await hooks.settle();
    assert.match(JSON.stringify(find(hooks.tree, 'FlatList').props.ListEmptyComponent), /No matches this time/);
    assert.equal(calls, 2);
    hooks.unmount();
});

test('storage failures: cart remains usable; malformed orders do not render', async t => {
    t.mock.method(console, 'error', () => {});
    const hooks = createHooks();
    const { CartProvider } = loadModule('src/contexts/CartContext.js', {
        react: hooks.react, '@react-native-async-storage/async-storage': {
            getItem: async () => { throw Error('mock read failure'); }, setItem: async () => { throw Error('mock write failure'); },
        },
    });
    hooks.mount(CartProvider); await hooks.settle();
    hooks.value.addToCart(phone); await hooks.settle();
    assert.equal(hooks.value.itemCount, 1);
    assert.equal(hooks.value.totalPrice, 100);
    hooks.unmount();
    const orderHooks = createHooks();
    let writes = 0;
    const { OrderProvider } = loadModule('src/contexts/OrderContext.js', {
        react: orderHooks.react, '@react-native-async-storage/async-storage': {
            getItem: async () => JSON.stringify([null, { id: 'bad', items: [null], totalPrice: 1 }]), setItem: async () => writes++,
        },
    });
    orderHooks.mount(OrderProvider); await orderHooks.settle();
    assert.equal(orderHooks.value.orders.length, 0);
    await assert.rejects(orderHooks.value.placeOrder([], 0), /Cart is empty/);
    await assert.rejects(orderHooks.value.placeOrder([phone], NaN), /Invalid order total/);
    assert.equal(writes, 0);
    orderHooks.unmount();
});

test('notifications: native channel failure and schedule failure reject; retry is possible', async () => {
    let failChannel = true;
    let failSchedule = true;
    let prompts = 0;
    let scheduled = 0;
    const { NotificationService } = loadModule('src/services/notificationService.js', {
        'react-native': { Platform: { OS: 'android' } }, expo: { isRunningInExpoGo: () => false },
        './localNotifications': {
            setNotificationHandler() {}, AndroidImportance: { HIGH: 4 }, SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval' },
            setNotificationChannelAsync: async () => { if (failChannel) throw Error('mock channel unavailable'); },
            getPermissionsAsync: async () => ({ granted: false, canAskAgain: true }),
            requestPermissionsAsync: async () => { prompts++; return { granted: true }; },
            scheduleNotificationAsync: async value => { scheduled++; assert.equal(value.trigger.channelId, 'orders'); if (failSchedule) throw Error('mock native schedule unavailable'); return 'mock-id'; },
        },
    });
    await assert.rejects(NotificationService.sendOrderNotification('mock-order'), /channel unavailable/);
    assert.equal(prompts, 0);
    failChannel = false;
    await assert.rejects(NotificationService.sendOrderNotification('mock-order'), /schedule unavailable/);
    failSchedule = false;
    assert.equal(await NotificationService.sendOrderNotification('mock-order'), 'mock-id');
    assert.equal(scheduled, 2);
    await assert.rejects(NotificationService.sendOrderNotification(''), { code: 'INVALID_ORDER' });
});

test('theme storage failure: load falls back and toggle remains usable in memory', async t => {
    t.mock.method(console, 'error', () => {});
    const hooks = createHooks();
    const { ThemeProvider } = loadModule('src/contexts/ThemeContext.js', {
        react: hooks.react, '@react-native-async-storage/async-storage': {
            getItem: async () => { throw Error('mock storage unavailable'); }, setItem: async () => { throw Error('mock storage unavailable'); },
        },
        '@react-navigation/native': { DefaultTheme: { colors: {} }, DarkTheme: { colors: {} } },
        '../constants/theme': { COLORS: { light: {}, dark: {} } },
    });
    hooks.mount(ThemeProvider); await hooks.settle();
    assert.equal(hooks.value.themeMode, 'light');
    hooks.value.toggleTheme(); await hooks.settle();
    assert.equal(hooks.value.themeMode, 'dark');
    hooks.unmount();
});
