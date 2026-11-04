/**
 * Author: trangtttce191027
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadModule, createHooks } = require('./harness.cjs');

const product = { id: 1, title: 'Phone', price: 100, stock: 5, discountPercentage: 10 };
function cart(storage = new Map()) {
    const hooks = createHooks();
    const AsyncStorage = {
        async getItem(key) { return storage.get(key) ?? null; },
        async setItem(key, value) { storage.set(key, value); },
    };
    const { CartProvider } = loadModule('src/contexts/CartContext.js', { react: hooks.react, '@react-native-async-storage/async-storage': AsyncStorage });
    hooks.mount(CartProvider);
    return hooks;
}

test('cart: independent items, string quantity, stock clamps, totals, update, remove, clear', async () => {
    const hooks = cart(); await hooks.settle();
    hooks.value.addToCart(product, '2');
    hooks.value.addToCart({ ...product, id: 2 }, 1);
    await hooks.settle();
    assert.equal(hooks.value.itemCount, 3);
    assert.equal(hooks.value.totalPrice, 270);
    hooks.value.addToCart(product, '1'); await hooks.settle();
    assert.equal(hooks.value.cartItems[0].quantity, 3);
    assert.equal(hooks.value.cartItems[1].quantity, 1);
    hooks.value.updateCartItem(1, 999); await hooks.settle();
    assert.equal(hooks.value.cartItems[0].quantity, 5);
    hooks.value.updateCartItem(1, 0); await hooks.settle();
    assert.equal(hooks.value.cartItems.length, 1);
    assert.equal(hooks.value.cartItems[0].id, 2);
    assert.equal(hooks.value.itemCount, 1);
    assert.equal(hooks.value.total, 100);
    assert.equal(hooks.value.totalPrice, 90);
    hooks.value.removeItem(2); await hooks.settle();
    assert.equal(hooks.value.itemCount, 0);
    hooks.value.clearCart(); await hooks.settle();
    assert.equal(hooks.value.totalPrice, 0);
    assert.equal(hooks.value.cartItems.length, 0);
});

test('cart item: decrement from one removes the item and persists empty cart with zero totals', async () => {
    const storage = new Map();
    const cartHooks = cart(storage); await cartHooks.settle();
    cartHooks.value.addToCart(product); await cartHooks.settle();
    const hooks = createHooks();
    const { default: CartItem } = loadModule('src/components/CartItem.jsx', {
        react: hooks.react,
        'react-native': { Image: 'Image', Text: 'Text', TouchableOpacity: 'TouchableOpacity', View: 'View', StyleSheet: { create: value => value } },
        '@expo/vector-icons': { Ionicons: 'Icon' },
        '../contexts/ThemeContext': { useTheme: () => ({ theme: { colors: {} } }) },
        '../contexts/CartContext': { useCart: () => cartHooks.value },
        '../utils/formatCurrency': { formatCurrency: String },
    });
    hooks.mount(CartItem, { product: cartHooks.value.cartItems[0] });
    const walk = tree => !tree || typeof tree !== 'object' ? [] : Array.isArray(tree) ? tree.flatMap(walk) : [tree, ...walk(tree.props?.children)];
    const decrement = walk(hooks.tree).find(node => node.type === 'TouchableOpacity'
        && walk(node.props.children).some(child => child.props?.name === 'remove'));
    assert.ok(decrement);
    assert.notEqual(decrement.props.disabled, true);
    decrement.props.onPress(); await cartHooks.settle();
    assert.equal(cartHooks.value.cartItems.length, 0);
    assert.equal(cartHooks.value.itemCount, 0);
    assert.equal(cartHooks.value.total, 0);
    assert.equal(cartHooks.value.totalPrice, 0);
    assert.equal(storage.get('@techstore_cart'), '[]');
    hooks.unmount(); cartHooks.unmount();
});

test('cart: mock storage save/remount restores without overwriting before hydration', async () => {
    const storage = new Map();
    const first = cart(storage); await first.settle();
    first.value.addToCart(product, 2); await first.settle(); first.unmount();
    const second = cart(storage); await second.settle();
    assert.equal(second.value.itemCount, 2);
    assert.equal(second.value.totalPrice, 180);
});

test('cart: malformed array entries do not crash startup or poison totals', async () => {
    const hooks = cart(new Map([['@techstore_cart', JSON.stringify([null, { ...product, quantity: 2 }, { ...product, id: 3, quantity: 'bad' }])]]));
    await hooks.settle();
    assert.equal(hooks.value.itemCount, 2);
    assert.equal(hooks.value.totalPrice, 180);
});

test('wishlist: failed add/remove preserves original error and exposes error state', async () => {
    const hooks = createHooks();
    const failure = new Error('permission-denied: mock Firestore');
    const { WishlistProvider } = loadModule('src/contexts/WishlistContext.js', {
        react: hooks.react,
        './AuthContext': { useAuth: () => ({ user: { uid: 'test-user' }, loading: false }) },
        '../services/wishlistService': { WishlistService: {
            getWishlist: async () => [],
            addToWishlist: async () => { throw failure; },
            removeFromWishlist: async () => { throw failure; },
        } },
    });
    hooks.mount(WishlistProvider); await hooks.settle();
    for (const action of [() => hooks.value.addItem(product), () => hooks.value.removeItem(1)]) {
        await assert.rejects(action(), error => error === failure);
        await hooks.settle();
        assert.equal(hooks.value.error, failure.message);
    }
});

test('notification: Expo Go bypass, one-second delay, denied permission, duplicate suppression', async () => {
    const sent = [];
    let allowed = true;
    const { NotificationService } = loadModule('src/services/notificationService.js', {
        'react-native': { Platform: { OS: 'android' } },
        expo: { isRunningInExpoGo: () => true },
        './localNotifications': {
            setNotificationHandler() {},
            getPermissionsAsync: async () => ({ granted: allowed, canAskAgain: false }),
            requestPermissionsAsync: async () => { throw Error('Must not re-prompt'); },
            setNotificationChannelAsync: async () => { throw Error('Must not create channel in Expo Go'); },
            SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval' },
            scheduleNotificationAsync: async value => { sent.push(value); return 'mock-id'; },
        },
    });
    await Promise.all([NotificationService.sendOrderNotification('test-1'), NotificationService.sendOrderNotification('test-1')]);
    assert.equal(sent.length, 1);
    assert.equal(sent[0].trigger.seconds, 1);
    assert.equal(sent[0].trigger.channelId, undefined);
    allowed = false;
    await assert.rejects(NotificationService.sendOrderNotification('test-2'), { code: 'PERMISSION_DENIED' });
    assert.equal(sent.length, 1);
});

test('orders: two calls from the same render preserve both orders and storage failures reject', async () => {
    const hooks = createHooks();
    let stored;
    let fail = false;
    const { OrderProvider } = loadModule('src/contexts/OrderContext.js', {
        react: hooks.react,
        '@react-native-async-storage/async-storage': {
            getItem: async () => null,
            setItem: async (key, value) => { if (fail) throw Error('mock disk full'); stored = value; },
        },
    });
    hooks.mount(OrderProvider); await hooks.settle();
    const placeOrder = hooks.value.placeOrder;
    await Promise.all([placeOrder([{ ...product, quantity: 1 }], 90), placeOrder([{ ...product, id: 2, quantity: 1 }], 90)]);
    await hooks.settle();
    assert.equal(hooks.value.orders.length, 2);
    assert.equal(JSON.parse(stored).length, 2);
    fail = true;
    await assert.rejects(hooks.value.placeOrder([{ ...product, quantity: 1 }], 90), /disk full/);
    await hooks.settle();
    assert.equal(hooks.value.orders.length, 2);
});
