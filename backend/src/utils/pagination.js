// Encode a cursor (typically a document _id) to a URL-safe base64 string
export const encodeCursor = (id) => {
  return Buffer.from(id.toString()).toString('base64url');
};

// Decode a base64url cursor back to an ObjectId-compatible string
export const decodeCursor = (cursor) => {
  return Buffer.from(cursor, 'base64url').toString('utf-8');
};

// Map frontend sort keys to MongoDB sort objects
const SORT_OPTIONS = {
  all: { createdAt: -1 },
  newest: { createdAt: -1 },
  unanswered: { commentCount: 1 },
  votes: { voteCount: -1 },
};

// Sort options that require an additional filter (not just a sort key)
export const SORT_FILTERS = {
  unanswered: { commentCount: 0 },
};

// Parse common query params for pagination and sorting
export const parsePaginationQuery = (query) => {
  const limit = Math.min(parseInt(query.limit) || 10, 50); // Max 50 per page
  const cursor = query.cursor ? decodeCursor(query.cursor) : null;
  const sort = SORT_OPTIONS[query.sort] || SORT_OPTIONS.newest; // Default: newest first

  return { limit, cursor, sort };
};
