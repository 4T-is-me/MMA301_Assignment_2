/**
 * Account: trangtttce191027
 * Author: trangtttce191027
 * Issue / UC: UC02 - Cart State Management & Storage Persistence
 * Purpose: Quản lý trạng thái giỏ hàng toàn cục, tính toán Derived Totals (totalPrice, itemCount), giới hạn tồn kho (stock) và lưu AsyncStorage.
 */
import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CartContext = createContext();
const CART_KEY = "@techstore_cart";

const validProduct = (item) => item && Number.isInteger(item.id) && item.id > 0
    && typeof item.title === 'string' && Number.isFinite(item.price) && item.price >= 0
    && Number.isInteger(item.stock) && item.stock > 0
    && (item.discountPercentage == null || (Number.isFinite(item.discountPercentage)
        && item.discountPercentage >= 0 && item.discountPercentage <= 100));

// Storage can contain old versions or partially corrupted records.
const restoreItems = (items) => {
    const restored = new Map();
    for (const item of items) {
        const quantity = Number(item?.quantity);
        if (!validProduct(item) || !Number.isInteger(quantity) || quantity < 1) continue;
        const previous = restored.get(item.id);
        restored.set(item.id, { ...item, discountPercentage: item.discountPercentage ?? 0,
            quantity: Math.min((previous?.quantity || 0) + quantity, item.stock) });
    }
    return [...restored.values()];
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);

    //read data when app starts
    useEffect(() => {
        const loadCart = async () => {
            try {
                const cartData = await AsyncStorage.getItem(CART_KEY);
                if (cartData !== null) {
                    const parsedCart = JSON.parse(cartData);
                    if(Array.isArray(parsedCart)) {
                        setCartItems(restoreItems(parsedCart));
                    }
                }
            } catch (error) {
                console.error("Error loading cart", error);
            }finally {
                setLoading(false);
            }
        }
        loadCart();
    }, [])

    //save cart data when cart items change
    useEffect(() => {
        if (loading) return;
        const saveCart = async () => {
            try {
                await AsyncStorage.setItem(CART_KEY, JSON.stringify(cartItems));
            } catch (error) {
                console.error("Error saving cart", error);
            }
        }
        saveCart();
    }, [cartItems, loading])

    //add to cart
    const addToCart = (product, quantity = 1) => {
        const amount = Number(quantity);
        if (!validProduct(product)
            || !Number.isInteger(amount) || amount < 1) return;

        setCartItems((prev) => {
            const existingItem = prev.find(
                (item) => item.id === product.id
            );

            if (existingItem) {
                return prev.map((item) =>
                    item.id === product.id
                        ? {
                            ...item,
                            quantity: Math.min(
                                item.quantity + amount,
                                item.stock
                            )
                        }
                        : item
                );
            }

            return [
                ...prev,
                {
                    id: product.id,
                    title: product.title,
                    price: product.price,
                    quantity: Math.min(amount, product.stock),
                    image: product.images?.[0] || product.thumbnail,
                    brand: product.brand,
                    discountPercentage: product.discountPercentage || 0,
                    thumbnail: product.thumbnail,
                    stock: product.stock,
                }
            ];
        });
    };
    //update cart item
    const updateCartItem = (id, quantity) => {
        if (!Number.isInteger(quantity)) return;
        if (quantity <= 0) {
            setCartItems((prev) => prev.filter(item => item.id !== id));
            return;
        }

        setCartItems((prev) =>
            prev.map((item) =>
                item.id === id
                    ? {
                        ...item,
                        quantity: Math.max(
                            1,
                            Math.min(quantity, item.stock)
                        )
                    }
                    : item
            )
        );
    };

    //remove item
    const removeItem = (id) => {
        setCartItems((prev) => prev.filter(item => item.id !== id))
    }

    //clear cart
    const clearCart = () => {
        setCartItems([])
    }
    // count all items
    const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

    //count total price
    const totalPrice = cartItems.reduce((total, item) =>{
            const finalPrice =item.price * (1 - item.discountPercentage/100);
            return total + finalPrice * item.quantity;
    }, 0);

    const total = cartItems.reduce((total, item) => total + item.quantity * item.price, 0);
    
    //avoid presenting cartProvider before data is loaded
    if(loading) {
        return null;
    }

    return (
        <CartContext.Provider value={{ cartItems, addToCart,updateCartItem, removeItem, clearCart, itemCount, totalPrice, total, loading }}>
            {children}
        </CartContext.Provider>
    )

}

export const useCart = () => useContext(CartContext)
