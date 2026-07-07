import Thread from '../models/Thread.js';
import Comment from '../models/Comment.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { encodeCursor, parsePaginationQuery, SORT_FILTERS } from '../utils/pagination.js';

export const searchThreads = catchAsync(async (req, res, next) => {
  const { q } = req.query;

  // Guard: mongoSanitize may convert `q[$regex]=.*` into `q = {}` (an object).
  // Calling .trim() on a non-string throws TypeError → return a clean 400.
  if (!q || typeof q !== 'string' || q.trim().length === 0) {
    return next(new AppError('Please provide a search query', 400));
  }

  const threads = await Thread.find(
    { $text: { $search: q }, isDeleted: false },
    { score: { $meta: 'textScore' } } // Include relevance score
  )
    .sort({ score: { $meta: 'textScore' } }) // Sort by relevance
    .limit(20)
    .populate('author', 'username avatar');

  res.status(200).json({
    success: true,
    results: threads.length,
    threads,
  });
});

export const createThread = catchAsync(async (req, res, next) => {
  const { title, body, tags, attachments } = req.body;

  const processedTags = tags
    ? tags.slice(0, 5).map((t) => t.trim().toLowerCase())
    : [];

  const thread = await Thread.create({
    title,
    body,
    tags: processedTags,
    attachments: attachments || [],
    author: req.user._id,
  });

  await thread.populate('author', 'username avatar');

  res.status(201).json({ success: true, thread });
});

export const getThreads = catchAsync(async (req, res, next) => {
  const { limit, cursor, sort } = parsePaginationQuery(req.query);
  const { tag, author, sort: sortKey } = req.query;

  const filter = { isDeleted: false };
  if (tag) filter.tags = tag.toLowerCase();
  if (author) filter.author = author;

  const sortFilter = SORT_FILTERS[sortKey];
  if (sortFilter) Object.assign(filter, sortFilter);

  if (cursor) {
    filter._id = { $lt: cursor };
  }

  const threads = await Thread.find(filter)
    .sort(sort)
    .limit(limit + 1)
    .populate('author', 'username avatar');

  const hasMore = threads.length > limit;
  const items = hasMore ? threads.slice(0, limit) : threads;

  const nextCursor = hasMore ? encodeCursor(items[items.length - 1]._id) : null;

  res.status(200).json({
    success: true,
    results: items.length,
    threads: items,
    nextCursor,
  });
});

export const getThread = catchAsync(async (req, res, next) => {
  const thread = await Thread.findOne({ _id: req.params.id, isDeleted: false })
    .populate('author', 'username avatar');

  if (!thread) {
    return next(new AppError('Thread not found', 404));
  }

  // Increment view count (fire and forget)
  Thread.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }).exec();

  res.status(200).json({ success: true, thread });
});

export const updateThread = catchAsync(async (req, res, next) => {
  const thread = await Thread.findOne({ _id: req.params.id, isDeleted: false });

  if (!thread) {
    return next(new AppError('Thread not found', 404));
  }

  if (thread.author.toString() !== req.user._id.toString()) {
    return next(new AppError('You can only edit your own threads', 403));
  }

  const { title, body, tags } = req.body;
  const updateData = {};

  if (title) updateData.title = title;
  if (body) updateData.body = body;
  if (tags) updateData.tags = tags.slice(0, 5).map((t) => t.trim().toLowerCase());

  const updated = await Thread.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  }).populate('author', 'username avatar');

  res.status(200).json({ success: true, thread: updated });
});

export const deleteThread = catchAsync(async (req, res, next) => {
  const thread = await Thread.findOne({ _id: req.params.id, isDeleted: false });

  if (!thread) {
    return next(new AppError('Thread not found', 404));
  }

  if (thread.author.toString() !== req.user._id.toString()) {
    return next(new AppError('You do not have permission to delete this thread', 403));
  }

  await Thread.findByIdAndUpdate(req.params.id, { isDeleted: true });

  res.status(200).json({ success: true, message: 'Thread deleted successfully' });
});

export const acceptComment = catchAsync(async (req, res, next) => {
  const thread = await Thread.findOne({ _id: req.params.id, isDeleted: false });

  if (!thread) {
    return next(new AppError('Thread not found', 404));
  }

  if (thread.author.toString() !== req.user._id.toString()) {
    return next(new AppError('Only the thread author can accept an answer', 403));
  }

  const { cid } = req.params;

  // If already accepted, toggle it off (unaccept)
  if (thread.acceptedComment && thread.acceptedComment.toString() === cid) {
    thread.acceptedComment = null;
    await thread.save();
    return res.status(200).json({ success: true, thread, action: 'removed' });
  }

  // Verify the comment exists on this thread
  const comment = await Comment.findOne({ _id: cid, thread: thread._id, isDeleted: false });
  if (!comment) {
    return next(new AppError('Comment not found', 404));
  }

  thread.acceptedComment = cid;
  await thread.save();

  await thread.populate('author', 'username avatar');

  res.status(200).json({ success: true, thread, action: 'accepted' });
});
