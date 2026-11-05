/**
 * Account: trangtttce191027
 * Author: trangtttce191027
 * Issue / UC: UC04 - Orders State Management & Storage Persistence
 * Purpose: Quản lý danh sách lịch sử đơn hàng, đồng bộ hóa tuần tự (serialized saves) với AsyncStorage (@techstore_order).
 */
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OrderContext = createContext();
const ORDER_KEY = '@techstore_order';

export const OrderProvider = ({ children }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const ordersRef = useRef([]);
    const saveQueue = useRef(Promise.resolve());

    useEffect(() => {
        const loadOrders = async () => {
            try {
                const orderData = await AsyncStorage.getItem(ORDER_KEY);
                if (orderData !== null) {
                    const parsedOrder = JSON.parse(orderData);
                    if(Array.isArray(parsedOrder)) {
                        const restored = parsedOrder.filter(order => order && typeof order.id === 'string'
                            && Array.isArray(order.items) && order.items.every(item => item && Number.isFinite(item.price)
                                && Number.isInteger(item.quantity) && item.quantity > 0)
                            && Number.isFinite(order.totalPrice) && order.totalPrice >= 0);
                        ordersRef.current = restored;
                        setOrders(restored);
                    }
                }
            } catch (error) {
                console.error("Error loading order", error);
            }finally {
                setLoading(false);
            }
        }
        loadOrders();
    }, [])


    const placeOrder = async (cartItems, totalPrice) => {
        if(!Array.isArray(cartItems) || cartItems.length === 0) {
            throw new Error('Cart is empty!');
        }
        if (!Number.isFinite(totalPrice) || totalPrice < 0) {
            throw new Error('Invalid order total!');
        }

        const newOrder = {
            id: `ORD-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            items: cartItems.map(item => ({...item})),
            totalPrice,
            status: 'Paid',
            createdAt: new Date().toISOString(),
        }
        // Serialize saves so concurrent calls cannot overwrite another order.
        const pending = saveQueue.current.then(async () => {
            const updatedOrders = [newOrder, ...ordersRef.current];
            await AsyncStorage.setItem(ORDER_KEY, JSON.stringify(updatedOrders));
            ordersRef.current = updatedOrders;
            setOrders(updatedOrders);
            return newOrder;
        });
        saveQueue.current = pending.catch(() => {});
        return pending;
    }

    if (loading) {
        return null;
    }
    return (
        <OrderContext.Provider value={{orders, loading, placeOrder}}>
            {children}
        </OrderContext.Provider>
    )
}
export const useOrder = () => useContext(OrderContext);
