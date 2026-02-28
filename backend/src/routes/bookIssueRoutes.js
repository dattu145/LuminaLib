import express from 'express';
import { requireAuth, requireRoles } from '../middleware/authMiddleware.js';
import { issueBook, returnBook, getActiveIssues, getBorrowingHistory } from '../controllers/bookIssueController.js';

const router = express.Router();

// Librarian/Admin actions
router.post('/books/issue', requireAuth, requireRoles(['librarian', 'admin']), issueBook);
router.post('/books/return', requireAuth, requireRoles(['librarian', 'admin']), returnBook);
router.get('/books/issued-active', requireAuth, requireRoles(['librarian', 'admin']), getActiveIssues);

// Student actions
router.get('/my-issues', requireAuth, requireRoles(['student']), getActiveIssues);
router.get('/my-history', requireAuth, requireRoles(['student']), getBorrowingHistory);

export default router;
