import Thread from '../models/Thread.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';
import catchAsync from '../utils/catchAsync.js';

/**
 * GET /api/v1/stats
 * Returns community-wide aggregate counts.
 * Uses countDocuments() which hits the index, not the collection scan — very efficient.
 */
export const getStats = catchAsync(async (req, res) => {
  const [questions, answers, users] = await Promise.all([
    Thread.countDocuments({ isDeleted: false }),
    Comment.countDocuments({ isDeleted: false }),
    User.countDocuments({ isActive: true }),
  ]);

  res.status(200).json({
    success: true,
    stats: { questions, answers, users },
  });
});
