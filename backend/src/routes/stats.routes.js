import express from 'express';
import { getStats } from '../controllers/stats.controller.js';

const router = express.Router();

// GET /api/v1/stats — public, no auth required
router.get('/', getStats);

export default router;
