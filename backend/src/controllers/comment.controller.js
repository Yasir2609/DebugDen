import Comment from '../models/Comment.js';
import Thread from '../models/Thread.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

export const createComment = catchAsync(async (req, res, next) => {
  const { body } = req.body;
  const threadId = req.params.id;

  const thread = await Thread.findOne({ _id: threadId, isDeleted: false });
  if (!thread) {
    return next(new AppError('Thread not found', 404));
  }

  const comment = await Comment.create({
    body,
    author: req.user._id,
    thread: threadId,
  });

  await Thread.findByIdAndUpdate(threadId, { $inc: { commentCount: 1 } });

  await comment.populate('author', 'username avatar');

  res.status(201).json({ success: true, comment });
});

export const getComments = catchAsync(async (req, res, next) => {
  // Fetch the thread to know which comment is accepted
  const thread = await Thread.findById(req.params.id).select('acceptedComment');

  const comments = await Comment.find({
    thread: req.params.id,
    isDeleted: false,
  })
    .sort('-voteCount')
    .populate('author', 'username avatar');

  // Pin accepted answer to the top, then sort the rest by vote count
  if (thread?.acceptedComment) {
    const acceptedId = thread.acceptedComment.toString();
    const accepted = comments.filter((c) => c._id.toString() === acceptedId);
    const rest = comments.filter((c) => c._id.toString() !== acceptedId);
    comments.length = 0;
    comments.push(...accepted, ...rest);
  }

  res.status(200).json({
    success: true,
    results: comments.length,
    comments,
  });
});

export const updateComment = catchAsync(async (req, res, next) => {
  const comment = await Comment.findOne({
    _id: req.params.cid,
    thread: req.params.id,
    isDeleted: false,
  });

  if (!comment) {
    return next(new AppError('Comment not found', 404));
  }

  if (comment.author.toString() !== req.user._id.toString()) {
    return next(new AppError('You can only edit your own comments', 403));
  }

  comment.body = req.body.body;
  await comment.save();

  res.status(200).json({ success: true, comment });
});

export const deleteComment = catchAsync(async (req, res, next) => {
  const comment = await Comment.findOne({
    _id: req.params.cid,
    thread: req.params.id,
    isDeleted: false,
  });

  if (!comment) {
    return next(new AppError('Comment not found', 404));
  }

  if (comment.author.toString() !== req.user._id.toString()) {
    return next(new AppError('You do not have permission to delete this comment', 403));
  }

  await Comment.findByIdAndUpdate(req.params.cid, { isDeleted: true });
  await Thread.findByIdAndUpdate(req.params.id, { $inc: { commentCount: -1 } });

  res.status(200).json({ success: true, message: 'Comment deleted successfully' });
});
