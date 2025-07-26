import express from 'express';
import { getPerformanceReviews, createPerformanceReview } from '../controllers/performanceReviews.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// GET /api/performance-reviews
router.get('/', getPerformanceReviews);

// POST /api/performance-reviews
router.post('/', createPerformanceReview);

export default router;
