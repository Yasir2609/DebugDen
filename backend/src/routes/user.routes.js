import express from 'express';
import { protect } from '../middlewares/auth.js';
import { getUser, updateUser, getUserProfile, getUserThreads } from '../controllers/user.controller.js';

const router = express.Router();

// Private routes — require authentication
router.get('/user', protect, getUser);
router.patch('/user', protect, updateUser);

// Public routes — no authentication required
router.get('/:username', getUserProfile);
router.get('/:username/threads', getUserThreads);

export default router;
