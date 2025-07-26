import express from 'express';
import { getPerformanceReviews, createPerformanceReview } from '../controllers/performanceReviewsController';

const router = express.Router();

// GET /api/performance-reviews
router.get('/', getPerformanceReviews);

// POST /api/performance-reviews
router.post('/', createPerformanceReview);

export default router;
