import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useCart } from "../contexts/CartContext";

export default function CartItem({ product }) {
    const { theme } = useTheme();
    const { removeItem, updateCartItem, addToCart } = useCart();

    const imageUri = product.thumbnail || product.image || product.images?.[0];
    const finalPrice = product.price * (1 - product.discountPercentage / 100);
    return (
        <View style={[styles.cartItem, { backgroundColor: theme.colors.card }]}>
            {/* hình ảnh */}
            <View style={[styles.cartItemImageContainer]}>
                <Image source={{ uri: imageUri}} style={[styles.cartItemImage, { borderColor: theme.colors.border, borderWidth: 1 }]} />
            </View>

            {/* thông tin bên phải */}
            <View style={styles.cartItemInfoContainer}>
                {/* dòng 1 */}
                <View style={styles.cartItemInfoFirstRow}>
                    <View style={styles.cartInfoLeft}>
                        {/* title */}
                        <Text style={[styles.cartItemTitle, { color: theme.colors.text }]} numberOfLines={2}>{product.title}</Text>
                            
                        {/* brand + stock */}
                        <View style={styles.cartBrandContainer}>
                            {/* brand */}
                            <View style={styles.cartItemBrandWrapper}>
                                <Text style={[styles.cartItemBrand, { color: theme.colors.subText }]}>{product.brand}</Text>
                            </View>
                            {/* stock */}
                            <View style={styles.cartItemStock}>
                                <Text style={styles.stock}>Stock: {product.stock}</Text>
                            </View>
                        </View>
                    </View>

                    {/* button xóa */}
                    <TouchableOpacity style={styles.cartItemRemoveButton} onPress={() => removeItem(product.id)}>
                        <Ionicons name="trash" size={20} color={'#d9534f'} />
                    </TouchableOpacity>
                </View>

                {/* dòng 2 */}
                <View style={styles.cartItemInfoSecondRow}>

                    {/* quantities */}
                    <View style={styles.cartItemQuantityWrapper}>
                        <TouchableOpacity disabled={product.quantity <= 1} onPress={() => updateCartItem(product.id, product.quantity - 1)} style={[styles.cartItemQuantityButton, { backgroundColor: theme.colors.primaryLight }]}>
                            <Ionicons name="remove" size={20} color={theme.colors.primary} />
                        </TouchableOpacity>

                        <Text style={[styles.cartItemQuantity, {  color: theme.colors.text,  textAlignVertical: 'center' }  ]} >
                            {product.quantity}
                        </Text>

                        <TouchableOpacity disabled={product.quantity >= product.stock} onPress={() => updateCartItem(product.id, product.quantity + 1)} style={[styles.cartItemQuantityButton, { backgroundColor: theme.colors.primaryLight }]}>
                            <Ionicons name="add" size={20} color={theme.colors.primary} />
                        </TouchableOpacity>
                    </View>


                    <View style={styles.cartItemPriceWrapper}>
                        <Text  style={[  styles.cartItemPrice,  { color: theme.colors.primary } ]}  >
                            ${finalPrice.toFixed(2)}
                        </Text>

                        {product.discountPercentage > 0 && (
                            <Text style={{ color: theme.colors.subText,  textDecorationLine: 'line-through' }} >
                                ${product.price.toFixed(2)}
                            </Text>
                        )}
                    </View>

                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    cartItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        elevation: 2,
        borderRadius: 8,
        marginBottom: 16,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    cartItemImageContainer: {
        width: 140,
        height: 150,
        flexShrink: 0,
        marginRight: 16,
        borderRadius: 8,
    },
    cartItemImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
        resizeMode: 'contain',
    },
    cartItemInfoContainer: {
        flex: 1,
        minWidth: 0,
    },
    cartItemInfoFirstRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
    },
    cartItemTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    cartBrandContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    cartInfoLeft: {
        flex: 1,
        minWidth: 0,
        gap: 8,
        marginBottom: 8,
    },
    cartItemInfoSecondRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cartItemRemoveButton: {
        flexShrink: 0,
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#ffebee'
    },
    cartItemQuantityWrapper : {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    cartItemQuantity: {
        width: 35,
        height: 35,
        borderRadius: 8,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
        backgroundColor: '#fff',
    },
    cartItemQuantityButton: {
        width:35,
        height: 35,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cartItemPrice: {
        fontSize: 16,
        fontWeight: '700',
    },
    cartItemPriceWrapper : {
        marginTop: 8,
        alignItems: 'center',
    }
    
})
