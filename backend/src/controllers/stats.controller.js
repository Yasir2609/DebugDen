import Thread from '../models/Thread.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';
import catchAsync from '../utils/catchAsync.js';

/**
 * GET /api/v1/stats
 * Returns community-wide aggregate counts and top tags.
 * Uses countDocuments() which hits the index, not the collection scan — very efficient.
 */
export const getStats = catchAsync(async (req, res) => {
  const [questions, answers, users, topTags] = await Promise.all([
    Thread.countDocuments({ isDeleted: false }),
    Comment.countDocuments({ isDeleted: false }),
    User.countDocuments({ isActive: true }),
    // Aggregate top 10 tags by usage count across non-deleted threads
    Thread.aggregate([
      { $match: { isDeleted: false, 'tags.0': { $exists: true } } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, name: '$_id', count: 1 } },
    ]),
  ]);

  res.status(200).json({
    success: true,
    stats: { questions, answers, users, topTags },
  });
});
