import { Router } from 'express';
import { isDbConnected } from '../config/db.js';
import authRoutes from './auth.routes.js';
import userRoutes from './users.routes.js';
import categoryRoutes from './categories.routes.js';
import transactionRoutes from './transactions.routes.js';
import budgetRoutes from './budgets.routes.js';
import statsRoutes from './stats.routes.js';

const router = Router();

// Health endpoint per doc 04 §4.1
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    db: isDbConnected() ? 'connected' : 'disconnected',
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/transactions', transactionRoutes);
router.use('/budgets', budgetRoutes);
router.use('/stats', statsRoutes);

export default router;
