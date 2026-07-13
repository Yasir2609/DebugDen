import User from '../models/User.js';
import Thread from '../models/Thread.js';
import Comment from '../models/Comment.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

export const getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      createdAt: user.createdAt,
    },
  });
});

export const updateUser = catchAsync(async (req, res, next) => {
  // Only allow updating bio and avatar
  const { bio, avatar } = req.body;
  const updateData = {};

  if (bio !== undefined) updateData.bio = bio;
  // Handle avatar: null/empty clears it, object sets it
  if (avatar !== undefined) {
    updateData.avatar = avatar || { url: '', publicId: '' };
  }

  const user = await User.findByIdAndUpdate(req.user._id, updateData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
    },
  });
});

export const getUserProfile = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ username: req.params.username });

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const threadCount = await Thread.countDocuments({ author: user._id, isDeleted: { $ne: true } });
  const commentCount = await Comment.countDocuments({ author: user._id, isDeleted: { $ne: true } });

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
      threadCount,
      commentCount,
      createdAt: user.createdAt,
    },
  });
});

export const getUserThreads = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ username: req.params.username });
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const threads = await Thread.find({ author: user._id, isDeleted: { $ne: true } })
    .sort('-createdAt')
    .populate('author', 'username avatar');

  res.status(200).json({
    success: true,
    results: threads.length,
    threads,
  });
});
