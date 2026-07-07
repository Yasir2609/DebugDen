import express from 'express';
import { body } from 'express-validator';
import validate from '../middlewares/validate.js';
import { protect } from '../middlewares/auth.js';
import {
  searchThreads,
  createThread,
  getThreads,
  getThread,
  updateThread,
  deleteThread,
  acceptComment,
} from '../controllers/thread.controller.js';

const router = express.Router();

router.get('/search', searchThreads);
router.get('/', getThreads);
router.post(
  '/',
  protect,
  [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
    body('body').trim().notEmpty().withMessage('Body is required').isLength({ max: 50000 }),
    body('tags').optional().isArray({ max: 5 }),
  ],
  validate,
  createThread
);

router.get('/:id', getThread);
router.patch('/:id', protect, updateThread);
router.delete('/:id', protect, deleteThread);
router.patch('/:id/accept/:cid', protect, acceptComment);

export default router;
