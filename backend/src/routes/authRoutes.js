import express from 'express';
import { login, me, updatePassword, logout, requestAccountDetails } from '../controllers/authController.js';
import { requestPasswordUpdate, verifyOtpOnly, verifyAndUpdatePassword } from '../controllers/passwordController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/request-account-details', requestAccountDetails);

// Protected routes
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, me);
router.post('/update-password', requireAuth, updatePassword);

// Password Reset Routes (3-step flow)
router.post('/auth/request-password-update', requestPasswordUpdate);
router.post('/auth/verify-otp', verifyOtpOnly);
router.post('/auth/verify-password-update', verifyAndUpdatePassword);

export default router;
