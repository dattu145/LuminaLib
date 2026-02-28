import express from 'express';
import { login, register, logout, me, updatePassword } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);

// Protected routes
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, me);
router.post('/update-password', requireAuth, updatePassword);

export default router;
