import mongoose from 'mongoose';

// Thread model
const threadSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    body: {
      type: String,
      required: [true, 'Body is required'],
      maxlength: 50000,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 30,
      },
    ],
    attachments: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    voteCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    isClosed: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    acceptedComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Full-text search index
threadSchema.index({ title: 'text', body: 'text' });

// Filter and sort indexes
threadSchema.index({ tags: 1 });
threadSchema.index({ author: 1 });
threadSchema.index({ createdAt: -1 });
threadSchema.index({ voteCount: -1 });

const Thread = mongoose.model('Thread', threadSchema);

export default Thread;
