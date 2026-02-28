import express from 'express';
import { requireAuth, requireRoles } from '../middleware/authMiddleware.js';
import { index, getStats, store, getByCode } from '../controllers/bookController.js';

const router = express.Router();

router.get('/books', index);
router.get('/books/stats', getStats);
router.get('/books/lookup/:book_code', requireAuth, getByCode);
router.post('/books', requireAuth, requireRoles(['librarian', 'admin']), store);

export default router;
