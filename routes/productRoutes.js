// routes/productRoutes.js
import express from 'express';
import { createProduct, getProducts } from '../controllers/productController.js';

const router = express.Router();

router.route('/')
  .post(createProduct) // Seed or make products
  .get(getProducts);   // Open client visibility

export default router;