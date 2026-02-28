import express from 'express';
import { requireAuth, requireRoles } from '../middleware/authMiddleware.js';
import { logSession, getLiveStudents, getTodaySessions, getUserSessions, getSessionStats } from '../controllers/sessionController.js';

const router = express.Router();

// Public Kiosk
router.post('/sessions/log', logSession);

// Librarian/Admin
router.get('/sessions/live', requireAuth, requireRoles(['librarian', 'admin']), getLiveStudents);
router.get('/sessions/today', requireAuth, requireRoles(['librarian', 'admin']), getTodaySessions);
router.get('/sessions/stats', requireAuth, requireRoles(['librarian', 'admin']), getSessionStats);

// Student
router.get('/my-sessions', requireAuth, requireRoles(['student']), getUserSessions);

export default router;
