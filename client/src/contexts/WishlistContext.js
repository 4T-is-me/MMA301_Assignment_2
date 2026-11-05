/**
 * Account: trangtttce191027
 * Author: trangtttce191027
 * Issue / UC: UC03 - Wishlist State Management
 * Purpose: Quản lý trạng thái danh sách yêu thích toàn cục, đồng bộ hai chiều với Firebase Firestore.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { WishlistService } from '../services/wishlistService';

const WishlistContext = createContext();

export const WishlistProvider =({children}) => {
    const { user, loading: authLoading } = useAuth();
    const userId = user?.uid;
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);
    const reloadWishlist = () => setReloadKey(key => key + 1);

    useEffect(()=> {
        let active = true;
        const loadWishlist = async () => {
            if(authLoading) return;
                if(!userId) {
                    setWishlist([]);
                    setError(null);
                    setLoading(false);
                    return;
                }
            try {
                setLoading(true);
                setError(null);
                setWishlist([]);
                const wishlistData = await WishlistService.getWishlist(userId);
                if(active) {
                    setWishlist(wishlistData);
                }

            } catch (error) {
                if(active) {
                    setError(error.message);
                    console.error("Error loading wishlist", error);
                }
            }finally {
                if(active) {
                    setLoading(false);
                }
            }
        }
        loadWishlist();
        return () => {
            active = false;
        }
    }, [userId, authLoading, reloadKey])

    //add item to wishlist
    const addItem = async(product)=> {
        if(!user) throw new Error('User is not authenticated!');
        try {
            setError(null);
            await WishlistService.addToWishlist(user.uid, product);
            const wishlistData = await WishlistService.getWishlist(user.uid);
            setWishlist(wishlistData);
        } catch (error) {
            setError(error.message);
            throw error;
        }
    }
    // remove item from wishlist
    const removeItem = async (productId) => {
        if(!user) throw new Error('User is not authenticated!');
        try {
            setError(null);
            await WishlistService.removeFromWishlist(user.uid, productId);
            const wishlistData = await WishlistService.getWishlist(user.uid);
            setWishlist(wishlistData);
        } catch (error) {
            setError(error.message);
            throw error;
        }
    }

    // Kiểm tra sản phẩm đã được yêu thích chưa
    const isFavorite = (productId) => {
        return wishlist.some((item) => item.id === productId);
    }

    return(
        <WishlistContext.Provider value={{wishlist, loading, error, addItem, removeItem, isFavorite, reloadWishlist}}>
            {children}
        </WishlistContext.Provider>
    )
}

export const useWishlist = () => useContext(WishlistContext);
