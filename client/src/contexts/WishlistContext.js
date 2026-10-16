import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { WishlistService } from '../services/wishlistService';

const WishlistContext = createContext();

export const WishlistProvider =({children}) => {
    const { user, loading: authLoading } = useAuth();
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(()=> {
        let active = true;
        const loadWishlist = async () => {
            if(authLoading) return;
                if(!user) {
                    setWishlist([]);
                    setLoading(false);
                    return;
                }
            try {
                setLoading(true);
                setError(null);
                const wishlistData = await WishlistService.getWishlist(user.uid);
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
    }, [user?.uid, authLoading])

    //add item to wishlist
    const addItem = async(product)=> {
        if(!user) throw new Error('User is not authenticated!');
        try {
            setError(null);
            await WishlistService.addToWishlist(user.uid, product);
            const wishlistData = await WishlistService.getWishlist(user.uid);
            setWishlist(wishlistData);
        } catch (error) {
            setError(err.message);
            throw err;
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
            setError(err.message);
            throw err;
        }
    }

    // Kiểm tra sản phẩm đã được yêu thích chưa
    const isFavorite = (productId) => {
        return wishlist.some((item) => item.id === productId);
    }

    return(
        <WishlistContext.Provider value={{wishlist, loading, error, addItem, removeItem, isFavorite}}>
            {children}
        </WishlistContext.Provider>
    )
}

export const useWishlist = () => useContext(WishlistContext);