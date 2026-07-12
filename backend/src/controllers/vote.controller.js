import mongoose from 'mongoose';
import Vote from '../models/Vote.js';
import Thread from '../models/Thread.js';
import Comment from '../models/Comment.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const castVote = catchAsync(async (req, res, next) => {
  const { targetId, targetType, value } = req.body;

  if (!['Thread', 'Comment'].includes(targetType)) {
    return next(new AppError('targetType must be "Thread" or "Comment"', 400));
  }

  if (![1, -1].includes(value)) {
    return next(new AppError('Vote value must be 1 (upvote) or -1 (downvote)', 400));
  }

  if (!isValidObjectId(targetId)) {
    return next(new AppError('Invalid targetId', 400));
  }

  const Model = targetType === 'Thread' ? Thread : Comment;

  const session = await mongoose.startSession();
  let action;
  let voteDoc;

  try {
    await session.withTransaction(async () => {
      const target = await Model.findById(targetId).session(session);
      if (!target) {
        throw new AppError('Target not found', 404);
      }

      // Prevent self-voting
      if (target.author.toString() === req.user._id.toString()) {
        throw new AppError('You cannot vote on your own content', 403);
      }

      const existingVote = await Vote.findOne({
        user: req.user._id,
        targetId,
        targetType,
      }).session(session);

      if (!existingVote) {
        // Vote.create with a session needs the array form
        const created = await Vote.create([{ user: req.user._id, targetId, targetType, value }], { session });
        voteDoc = created[0];
        await Model.findByIdAndUpdate(targetId, { $inc: { voteCount: value } }, { session });
        action = 'created';
      } else if (existingVote.value === value) {
        await Vote.deleteOne({ _id: existingVote._id }).session(session);
        await Model.findByIdAndUpdate(targetId, { $inc: { voteCount: -value } }, { session });
        voteDoc = null;
        action = 'retracted';
      } else {
        existingVote.value = value;
        await existingVote.save({ session });
        await Model.findByIdAndUpdate(targetId, { $inc: { voteCount: value * 2 } }, { session });
        voteDoc = existingVote;
        action = 'switched';
      }
    });
  } catch (err) {
    return next(err instanceof AppError ? err : new AppError('Failed to cast vote', 500));
  } finally {
    await session.endSession();
  }

  const statusCode = action === 'created' ? 201 : 200;
  res.status(statusCode).json({ success: true, action, vote: voteDoc });
});

export const getUserVotes = catchAsync(async (req, res, next) => {
  const { targetIds, targetType } = req.query;

  if (!targetIds || !targetType) {
    return next(new AppError('targetIds and targetType are required', 400));
  }

  if (!['Thread', 'Comment'].includes(targetType)) {
    return next(new AppError('targetType must be "Thread" or "Comment"', 400));
  }

  const ids = targetIds
    .split(',')
    .map((id) => id.trim())
    .filter(isValidObjectId);

  if (ids.length === 0) {
    return res.status(200).json({ success: true, votes: {} });
  }

  const votes = await Vote.find({
    user: req.user._id,
    targetId: { $in: ids },
    targetType,
  }).select('targetId value -_id');

  const voteMap = {};
  votes.forEach((v) => {
    voteMap[v.targetId.toString()] = v.value;
  });

  res.status(200).json({ success: true, votes: voteMap });
});
