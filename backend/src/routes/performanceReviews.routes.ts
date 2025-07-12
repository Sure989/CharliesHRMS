import express from 'express';
import { getPerformanceReviews } from '../controllers/performanceReviews.controller';

const router = express.Router();

// GET /api/performance-reviews
router.get('/', getPerformanceReviews);

export default router;
