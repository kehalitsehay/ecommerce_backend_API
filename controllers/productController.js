
import pool from '../config/db.js';

// @desc    Create a new product (Admin feature / Catalog building)
// @route   POST /api/products
// @access  Public (for easy development setup)
export const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, image, stock, category } = req.body;

    const newProduct = await pool.query(
      'INSERT INTO products (name, description, price, image, stock, category) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, description, price, image, stock, category]
    );

    res.status(201).json(newProduct.rows[0]);
  } catch (error) {
    next(error)
  }
};

// @desc    Get all products with optional category filtering
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM products';
    let queryParams = [];

    if (category) {
      query += ' WHERE category = $1';
      queryParams.push(category);
    }

    query += ' ORDER BY id ASC';

    const products = await pool.query(query, queryParams);
    res.json(products.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};