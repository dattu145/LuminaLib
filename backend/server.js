import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import Routes
import authRoutes from './src/routes/authRoutes.js';
import bookRoutes from './src/routes/bookRoutes.js';
import bookIssueRoutes from './src/routes/bookIssueRoutes.js';
import sessionRoutes from './src/routes/sessionRoutes.js';
import analyticsRoutes from './src/routes/analyticsRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Routes Placeholder
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Node.js Express backend is running smoothly!' });
});

app.use('/api', authRoutes);
app.use('/api', bookRoutes);
app.use('/api', bookIssueRoutes);
app.use('/api', sessionRoutes);
app.use('/api', analyticsRoutes);
app.use('/api', adminRoutes);
app.use('/api', notificationRoutes);

import initCronJobs from './src/services/cronService.js';

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    initCronJobs();
});
