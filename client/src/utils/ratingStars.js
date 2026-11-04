/**
 * Author: trangtttce191027
 */
export default function ratingStars(rating = 0) {
    // Giới hạn điểm trong khoảng 0–5, kể cả khi dữ liệu bị thiếu.
    const score = Number.isFinite(rating) ? Math.max(0, Math.min(5, rating)) : 0;

    // Mốc 0.25 và 0.75 quyết định sao rỗng, nửa sao hoặc sao đầy.
    return Array.from({ length: 5 }, (_, index) => {
        const star = index + 1;
        if (score >= star - 0.25) return 'star';
        if (score >= star - 0.75) return 'star-half';
        return 'star-outline';
    });
}
