const db = require('../config/db');

const cartController = {
    // Add to cart
    addToCart: async (req, res) => {
        try {
            const { productId, quantity } = req.body;
            const userId = req.user.userId.toString();

            // Check product availability
            const [product] = await db.query(
                'SELECT * FROM products WHERE id = ? AND quantity >= ?',
                [productId, quantity]
            );

            if (product.length === 0) {
                return res.status(400).json({ message: 'Product not available in requested quantity' });
            }

            // Get or create cart
            let [cart] = await db.query(
                'SELECT * FROM cart WHERE user_id = ?',
                [userId]
            );

            let cartId;
            if (cart.length === 0) {
                const [newCart] = await db.query(
                    'INSERT INTO cart (user_id) VALUES (?)',
                    [userId]
                );
                cartId = newCart.insertId;
            } else {
                cartId = cart[0].id;
            }

            // Add/update cart item
            const [existingItem] = await db.query(
                'SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?',
                [cartId, productId]
            );

            if (existingItem.length > 0) {
                // Update existing item
                await db.query(
                    'UPDATE cart_items SET quantity = quantity + ? WHERE cart_id = ? AND product_id = ?',
                    [quantity, cartId, productId]
                );
            } else {
                // Add new item
                await db.query(
                    'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)',
                    [cartId, productId, quantity]
                );
            }

            res.status(200).json({ message: 'Product added to cart' });
        } catch (error) {
            console.error('Error adding to cart:', error);
            res.status(500).json({ message: 'Error adding to cart' });
        }
    },

    // Get cart
    getCart: async (req, res) => {
        try {
            const userId = req.user.userId.toString();

            const [cartItems] = await db.query(
                `SELECT ci.*, p.name, p.price, p.image_url 
                 FROM cart c 
                 JOIN cart_items ci ON c.id = ci.cart_id 
                 JOIN products p ON ci.product_id = p.id 
                 WHERE c.user_id = ?`,
                [userId]
            );

            res.json(cartItems);
        } catch (error) {
            console.error('Error fetching cart:', error);
            res.status(500).json({ message: 'Error fetching cart' });
        }
    }
};

module.exports = cartController; 