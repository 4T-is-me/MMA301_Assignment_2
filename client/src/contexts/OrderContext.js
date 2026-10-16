import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OrderContext = createContext();
const ORDER_KEY = '@techstore_order';

export const OrderProvider = ({ children }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadOrders = async () => {
            try {
                const orderData = await AsyncStorage.getItem(ORDER_KEY);
                if (orderData !== null) {
                    const parsedOrder = JSON.parse(orderData);
                    if(Array.isArray(parsedOrder)) {
                        setOrders(parsedOrder);
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
        const updatedOrders = [newOrder, ...orders];

        // Lưu thành công trước khi cập nhật UI
        await AsyncStorage.setItem(
            ORDER_KEY,
            JSON.stringify(updatedOrders)
        );
        setOrders(updatedOrders);

        return newOrder;
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
