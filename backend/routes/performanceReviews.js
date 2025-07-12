import express from 'express';
import { getPerformanceReviews } from '../controllers/performanceReviewsController';

const router = express.Router();

// GET /api/performance-reviews
router.get('/', getPerformanceReviews);

export default router;
