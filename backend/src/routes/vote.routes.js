import express from 'express';
import { body } from 'express-validator';
import validate from '../middlewares/validate.js';
import { protect } from '../middlewares/auth.js';
import { castVote, getUserVotes } from '../controllers/vote.controller.js';

const router = express.Router();

router.use(protect);

router.post(
  '/',
  [
    body('targetId').notEmpty().withMessage('targetId is required'),
    body('targetType').isIn(['Thread', 'Comment']).withMessage('targetType must be Thread or Comment'),
    body('value').isIn([1, -1]).withMessage('value must be 1 or -1'),
  ],
  validate,
  castVote
);

router.get('/user-votes', getUserVotes);

export default router;
