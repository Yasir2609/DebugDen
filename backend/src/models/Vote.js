import mongoose from 'mongoose';

// Vote model
const voteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'targetType',
    },
    targetType: {
      type: String,
      required: true,
      enum: ['Thread', 'Comment'],
    },
    value: {
      type: Number,
      required: true,
      enum: [1, -1],
    },
  },
  {
    timestamps: true,
  }
);

// One vote per user per target
voteSchema.index({ user: 1, targetId: 1, targetType: 1 }, { unique: true });

const Vote = mongoose.model('Vote', voteSchema);

export default Vote;
