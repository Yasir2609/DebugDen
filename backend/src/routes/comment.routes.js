import express from 'express';
import { body } from 'express-validator';
import validate from '../middlewares/validate.js';
import { protect } from '../middlewares/auth.js';
import {
  createComment,
  getComments,
  updateComment,
  deleteComment,
} from '../controllers/comment.controller.js';

const router = express.Router({ mergeParams: true });

router.get('/', getComments);
router.post(
  '/',
  protect,
  [
    body('body').trim().notEmpty().withMessage('Comment body is required').isLength({ max: 20000 }),
  ],
  validate,
  createComment
);

router.patch(
  '/:cid',
  protect,
  [
    body('body').trim().notEmpty().withMessage('Comment body is required').isLength({ max: 20000 }),
  ],
  validate,
  updateComment
);

router.delete('/:cid', protect, deleteComment);

export default router;
