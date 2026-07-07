// Triggers automatically when a signed cryptographic webhook payload hits /api/payment/webhook
if (event.type === 'checkout.session.completed') {
  const session = event.data.object;
  const userId = session.client_reference_id; // Pass this during checkout initialization

  try {
    // 1. Grab all cart rows for the paying customer before deleting them
    const purchasedItems = await pool.query(
      'SELECT product_id, quantity FROM cart_items WHERE user_id = $1',
      [userId]
    );

    // 2. Loop through and deduct inventory limits safely inside your relational db
    for (let item of purchasedItems.rows) {
      await pool.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }

    // 3. Empty out the user's shopping cart row allocations
    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

    // 4. Spawn a full background fulfillment task record tracking row
    await pool.query(
      "INSERT INTO tasks (user_id, title, description, status) VALUES ($1, $2, $3, 'processing')",
      [userId, 'Order Fulfillment Process Initiated', `Package compilation mapped for customer reference setup.`]
    );

    console.log(`Inventory loop successfully closed for User ID: ${userId}`);
  } catch (err) {
    console.error('Webhook Database Sync Failure:', err);
  }
}