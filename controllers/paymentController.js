import Stripe from 'stripe';
import pool from '../config/db.js';

// Initialize stripe with your secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCheckoutSession = async (req, res) => {
  try {
    const userId = req.user;

    // 1. Fetch user's current cart items from PostgreSQL
    const userResult = await pool.query('SELECT cart FROM users WHERE id = $1', [userId]);
    const cartItems = userResult.rows[0].cart || [];

    if (cartItems.length === 0) {
      return res.status(400).json({ message: 'Your shopping cart is empty' });
    }

    // 2. Fetch full product details from database for items present in the cart
    const productIds = cartItems.map(item => item.productId);
    const productsResult = await pool.query('SELECT * FROM products WHERE id = ANY($1)', [productIds]);
    const products = productsResult.rows;

    // 3. Map the database items into the structured layout Stripe requires
    const lineItems = cartItems.map(item => {
      const productInfo = products.find(p => p.id === item.productId);
      
      if (!productInfo) {
        throw new Error(`Product with ID ${item.productId} no longer exists in catalog.`);
      }

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: productInfo.name,
            description: productInfo.description,
            images: [productInfo.image], // Optional item display picture URL
          },
          // Stripe calculates money in CENTS (e.g., $59.99 must be written as 5999)
          unit_amount: Math.round(parseFloat(productInfo.price) * 100),
        },
        quantity: item.quantity,
      };
    });

    // 4. Create the secure Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      // Dynamic callbacks to frontend routing surfaces
      success_url: `${process.env.CLIENT_URL}checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}carts`,
      metadata: {
        userId: userId.toString(), // Optional metadata to link this transaction back to your user ID
      },
    });

    // 5. Return the payment URLs to the frontend/Postman client
    res.json({ 
      id: session.id,
      url: session.url // This is the crucial URL the user opens to pay
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};