export { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
export {
    addNotificationReceivedListener,
    addNotificationResponseReceivedListener,
    getLastNotificationResponseAsync,
} from 'expo-notifications/build/NotificationsEmitter';
export { getPermissionsAsync, requestPermissionsAsync } from 'expo-notifications/build/NotificationPermissions';
export { setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';
export { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
export {cancelScheduledNotificationAsync} from 'expo-notifications/build/cancelScheduledNotificationAsync';
export { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';
export { SchedulableTriggerInputTypes } from 'expo-notifications/build/Notifications.types';
/*
Thêm localNotifications.js vì import toàn bộ expo-notifications kéo theo phần đăng ký remote push,
khiến Expo Go báo lỗi. File này chỉ lấy các hàm local notification cần dùng,
tránh kích hoạt remote push.
*/
