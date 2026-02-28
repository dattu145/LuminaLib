import express from 'express';
import { requireAuth, requireRoles } from '../middleware/authMiddleware.js';
import { listStaff, createLibrarian, toggleUserStatus, getFineConfig, updateFineConfig, exportUsers } from '../controllers/adminController.js';

const router = express.Router();

const adminAuth = [requireAuth, requireRoles(['admin'])];

router.get('/admin/staff', adminAuth, listStaff);
router.post('/admin/staff', adminAuth, createLibrarian);
router.post('/admin/users/:id/toggle', adminAuth, toggleUserStatus);
router.get('/admin/config/fines', adminAuth, getFineConfig);
router.post('/admin/config/fines', adminAuth, updateFineConfig);
router.get('/admin/export/users', adminAuth, exportUsers);

// Note: If toggleUserStatus is also available to librarians, then middleware should apply route by route.
// In Laravel, the group middleware role was 'admin' only.

export default router;
