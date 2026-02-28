import express from 'express';
import { requireAuth, requireRoles } from '../middleware/authMiddleware.js';
import { getAnalytics } from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/analytics', requireAuth, requireRoles(['librarian', 'admin']), getAnalytics);

export default router;
