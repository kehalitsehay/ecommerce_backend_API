// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

export const protect = async (req, res, next) => {
  let token;

  // 1. Check for token in the Authorization Header (Format: Bearer <token>)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract token from string
      token = req.headers.authorization.split(' ')[1];

      // 2. Verify token validity
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Verify user still exists in the PostgreSQL database
      const userCheck = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [decoded.id]);
      
      if (userCheck.rows.length === 0) {
        return res.status(401).json({ message: 'Not authorized, user no longer exists' });
      }

      // 4. Attach the user's ID to the request object for downstream routes to use
      req.user = userCheck.rows[0].id;
      
      // Move to the next controller function
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed or expired' });
    }
  }

  // If no token exists at all
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};