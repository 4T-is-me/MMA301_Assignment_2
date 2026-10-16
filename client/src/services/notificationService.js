import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import * as Notifications from './localNotifications';

const CHANNEL_ID = "orders";
let permissionRequest;
const pendingOrders = new Map();

const notificationError = (code, message) => Object.assign(new Error(message), { code });


//quy định cách hiển thị thông báo khi ứng dụng đang mở.
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true, //Cho phép hiện banner
        shouldShowList: true, //Cho phép hiện trong danh sách thông báo.
        shouldPlaySound: true, //Cho phép phát âm thanh.
        shouldSetBadge: false, //Không cập nhật số trên icon ứng dụng.
    }),
});

//kiểm tra và yêu cầu quyền thông báo. Trên Android, mình tạo notification channel trước khi yêu cầu quyền.
const ensurePermission = async () => {
    if (Platform.OS === 'web') {
        throw notificationError('UNSUPPORTED_PLATFORM', 'Please test notifications on Android or iOS.');
    }
    // Expo Go owns its channels; SDK 57.0.9 lacks the custom channel provider.
    if (Platform.OS === 'android' && !isRunningInExpoGo()) {
        await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
            name: 'Order Notifications',
            importance: Notifications.AndroidImportance.HIGH,
            sound: 'default',
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#7C66FF',
        });
    }

    const currentPermission = await Notifications.getPermissionsAsync();

    if (currentPermission.granted) {
        return true;
    }
    if (currentPermission.canAskAgain === false) return false;
    const requestedPermission = await Notifications.requestPermissionsAsync();

    return requestedPermission.granted;
    
}

const requestNotificationPermission = () => {
    if (!permissionRequest) {
        permissionRequest = ensurePermission().finally(() => { permissionRequest = null; });
    }
    return permissionRequest;
};

// Present immediately. Expo Go must use its own default Android channel.
const scheduleOrderNotification = async (orderId) => {
    const granted = await requestNotificationPermission();
    if (!granted) {
        throw notificationError('PERMISSION_DENIED', 'Notifications are disabled. Enable them in your device settings.');
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
            title: '🛍️ Payment successful!',
            body: `Payment for order #${orderId} is complete. Thank you for shopping with us!`,
            sound: 'default',
            color: '#7C66FF',
            data: { orderId, type: 'order-confirmed' },
        },
        trigger:  Platform.OS === 'android' && !isRunningInExpoGo() ? { channelId: CHANNEL_ID } : null,
    });
    return notificationId;
}

const sendOrderNotification = (orderId) => {
    const id = typeof orderId === 'string' || typeof orderId === 'number' ? String(orderId).trim() : '';
    if (!id || id.length > 100) {
        return Promise.reject(notificationError('INVALID_ORDER', 'A valid order ID is required.'));
    }
    if (pendingOrders.has(id)) return pendingOrders.get(id);
    const request = scheduleOrderNotification(id).finally(() => { pendingOrders.delete(id); });
    pendingOrders.set(id, request);
    return request;
};

export const NotificationService = {
    sendOrderNotification,
    requestNotificationPermission,
}
