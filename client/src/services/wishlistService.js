import {collection, doc, setDoc, getDocs, deleteDoc} from  'firebase/firestore';
import { db } from '../config/firebase';

// Đường dẫn wishlist của từng người dùng
const getWishlistConllection = (userId) => {
    if(!userId) {
        throw new Error('User is not authentication!');
    }
    return collection(db, "users", userId, "wishlist");
}

// Thêm mới một sản phẩm vào wishlist
const addToWishlist = async (userId, product) => {
    const wishlistRef = getWishlistConllection(userId);

    const record = {
        productId: product.id,
        title: product.title,
        price: product.price,
        thumbnail: product.thumbnail,
        discountPercentage: product.discountPercentage,
        brand: product.brand,
        stock: product.stock,
        rating: product.rating,
        addedAt: new Date().toISOString(),
    };
    // DummyJSON omits optional fields (for example brand); Firestore rejects undefined.
    await setDoc(doc(wishlistRef, String(product.id)),
        Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)));
}

//lấy danh sách sản phẩm yêu thích
const getWishlist = async (userId) => {
    const snapshot = await getDocs(getWishlistConllection(userId));

    return snapshot.docs.map((document) => ({
        ...document.data(),
        id: Number(document.id),
    }))
}

//xóa sản phẩm khỏi wishlist
const removeFromWishlist = async (userId, productId) => {
    const wishlistRef = getWishlistConllection(userId);
    await deleteDoc(doc(wishlistRef, String(productId)));
}

export const WishlistService = {
    addToWishlist,
    getWishlist,
    removeFromWishlist,
}
