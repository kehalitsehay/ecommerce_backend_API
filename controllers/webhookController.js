import Stripe from 'stripe';
import pool from '../config/db.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Construct the verified secure event structure using the raw raw request body buffer
    event = stripe.webhooks.constructEvent(
      req.body, 
      sig, 
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`❌ Webhook Signature Verification Failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the specific payment success event trigger
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Retrieve the metadata we appended to the checkout session in paymentController
    const userId = session.metadata.userId;

    console.log(`🔔 Payment Confirmed for User ID: ${userId}. Running database fulfillment automated scripts...`);

    try {
      // 1. Professional Automation Task: Update task tracking order row automatically
      await pool.query(
        "INSERT INTO tasks (user_id, title, description, category, status) VALUES ($1, $2, $3, $4, $5)",
        [
          userId, 
          `Order Tracking for Session ${session.id.slice(-6).toUpperCase()}`, 
          `Payment successfully cleared via Stripe. Package preparing for dispatch management. Total: $${(session.amount_total / 100).toFixed(2)}`,
          'shipping',
          'processing'
        ]
      );

      // 2. Clear out the User's database shopping cart layout since they have completed purchase
      await pool.query("UPDATE users SET cart = '[]'::jsonb WHERE id = $1", [userId]);
      
      console.log(`📦 Database updated: Order logged and shopping cart cleared for user ${userId}.`);
    } catch (dbError) {
      console.error(`❌ Webhook database operations error: ${dbError.message}`);
      return res.status(500).send('Internal Server Processing Error');
    }
  }

  // Return a 200 OK status to Stripe to acknowledge successful receipt of the webhook event
  res.json({ received: true });
};