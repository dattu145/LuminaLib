import express from 'express';
import { requireAuth, requireRoles } from '../middleware/authMiddleware.js';
import { issueBook, returnBook, returnBookById, getStudentCirculationProfile, getActiveIssues, getBorrowingHistory, getUnpaidFines, adjustFine } from '../controllers/bookIssueController.js';

const router = express.Router();

// Librarian/Admin actions
router.post('/books/issue', requireAuth, requireRoles(['librarian', 'admin']), issueBook);
router.post('/books/return', requireAuth, requireRoles(['librarian', 'admin']), returnBook);
router.post('/books/return-by-id', requireAuth, requireRoles(['librarian', 'admin']), returnBookById);
router.get('/books/issued-active', requireAuth, requireRoles(['librarian', 'admin']), getActiveIssues);
router.get('/books/fines-unpaid', requireAuth, requireRoles(['librarian', 'admin']), getUnpaidFines);
router.post('/books/fine-adjust', requireAuth, requireRoles(['librarian', 'admin']), adjustFine);
router.get('/circulation/student/:register_number', requireAuth, requireRoles(['librarian', 'admin']), getStudentCirculationProfile);

// Student actions
router.get('/my-issues', requireAuth, requireRoles(['student']), getActiveIssues);
router.get('/my-history', requireAuth, requireRoles(['student']), getBorrowingHistory);

export default router;
