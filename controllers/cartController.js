import pool from '../config/db.js';

// @desc    Add a product to user's cart (or increment quantity)
// @route   POST /api/cart
// @access  Private
export const addToCart = async (req, res) => {
  try {
    const userId = req.user;
    const { productId, quantity } = req.body;
    const qty = parseInt(quantity) || 1;

    // 1. Verify product actually exists in the database first
    const productCheck = await pool.query('SELECT * FROM products WHERE id = $1', [productId]);
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // 2. Fetch the user's current cart structure
    const userResult = await pool.query('SELECT cart FROM users WHERE id = $1', [userId]);
    let currentCart = userResult.rows[0].cart || [];

    // 3. Check if product already exists in their current cart array
    const itemIndex = currentCart.findIndex(item => item.productId === parseInt(productId));

    if (itemIndex > -1) {
      // Product exists, increment quantity
      currentCart[itemIndex].quantity += qty;
    } else {
      // Product doesn't exist, push fresh object
      currentCart.push({ productId: parseInt(productId), quantity: qty });
    }

    // 4. Update the JSONB field back inside PostgreSQL
    const updatedUser = await pool.query(
      'UPDATE users SET cart = $1 WHERE id = $2 RETURNING id, name, cart',
      [JSON.stringify(currentCart), userId]
    );

    res.json(updatedUser.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get the logged-in user's complete cart with item details
// @route   GET /api/cart
// @access  Private
export const getCart = async (req, res) => {
  try {
    const userId = req.user;

    const userResult = await pool.query('SELECT cart FROM users WHERE id = $1', [userId]);
    const cartItems = userResult.rows[0].cart || [];

    if (cartItems.length === 0) {
      return res.json({ cart: [], total: "0.00" });
    }

    // Professional Practice: Instead of returning just raw IDs, we enrich the output 
    // by fetching complete details (name, price, image) for each item in the cart.
    const productIds = cartItems.map(item => item.productId);
    const productsResult = await pool.query('SELECT * FROM products WHERE id = ANY($1)', [productIds]);
    const products = productsResult.rows;

    let total = 0;
    const detailedCart = cartItems.map(item => {
      const productInfo = products.find(p => p.id === item.productId);
      const subtotal = productInfo ? parseFloat(productInfo.price) * item.quantity : 0;
      total += subtotal;

      return {
        product: productInfo || null,
        quantity: item.quantity,
        subtotal: subtotal.toFixed(2)
      };
    });

    res.json({
      cart: detailedCart,
      total: total.toFixed(2)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Empty the shopping cart entirely
// @route   DELETE /api/cart
// @access  Private
export const clearCart = async (req, res) => {
  try {
    const userId = req.user;

    await pool.query("UPDATE users SET cart = '[]'::jsonb WHERE id = $1", [userId]);
    res.json({ message: 'Shopping cart cleared completely.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};