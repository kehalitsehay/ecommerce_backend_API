// routes/paymentRoutes.js
import express from 'express';
import { createCheckoutSession } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// The checkout endpoint must be secured by our token validation gateway
router.post('/checkout', protect, createCheckoutSession);

export default router;