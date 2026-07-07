// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { initializeTables } from './config/initDb.js';
import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutes.js'
import cartRoutes from './routes/cartRoutes.js'
import productRoutes from './routes/productRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'
import {errorHandler, notFound } from './middleware/errorMiddleware.js'
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { handleStripeWebhook } from './controllers/webhookController.js';

dotenv.config();

// Verify connection and create tables
await connectDB();
await initializeTables();

const app = express();


// 1. Initialize Helmet to shield HTTP response headers 
app.use(helmet());

// 2. Define API Request Rate Limiting rules
const apiLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes window scale
  limit: 10, // Limit each individual IP address to 10 requests per window
  standardHeaders: 'draft-7', // Return standard rate limit info headers
  legacyHeaders: false, // Disable the X-RateLimit-* legacy headers
  message: {
    message: 'Too many requests generated from this IP network connection. Please try again in 2 minutes.'
  }
});

// Apply rate limiting rule universally to all endpoints starting with /api
app.use('/api', apiLimiter);


app.use(cors({
  origin: '*', // Allows development ports like 5173, 5176, etc. to call endpoints seamlessly
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// CRITICAL: Webhook route MUST sit right here, before express.json()
// We pass express.raw({type: 'application/json'}) to preserve the exact payload bytes
app.post('/api/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes)
app.use('/api/carts', cartRoutes)
app.use('/api/products', productRoutes)
app.use('/api/payment', paymentRoutes)

// app.get('/', (req, res) => {
//   res.send('SQL API Engine is running smoothly...');
// });


app.use(notFound);
app.use(errorHandler);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Express server alive on port ${PORT}`));