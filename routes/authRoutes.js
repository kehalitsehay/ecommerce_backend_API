// routes/authRoutes.js
import express from 'express';
import { register, login, getAllUsers, getUserById } from '../controllers/authController.js';

const router = express.Router();

// Define routes and attach controller logic
router.post('/register', register);
router.post('/login', login);
router.get('/users', getAllUsers)
router.get('/users/:id', getUserById)

export default router;