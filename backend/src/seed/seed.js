import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Thread from '../models/Thread.js';
import Comment from '../models/Comment.js';
import Vote from '../models/Vote.js';

// Load environment variables
dotenv.config();

// Seed data: 8 users
const users = [
  { username: 'admin', email: 'admin@debugden.com', password: 'password123' },
  { username: 'moderator', email: 'mod@debugden.com', password: 'password123' },
  { username: 'developer', email: 'dev@debugden.com', password: 'password123' },
  { username: 'sarah_dev', email: 'sarah@debugden.com', password: 'password123' },
  { username: 'alex_ops', email: 'alex@debugden.com', password: 'password123' },
  { username: 'mike_ui', email: 'mike@debugden.com', password: 'password123' },
  { username: 'priya_db', email: 'priya@debugden.com', password: 'password123' },
  { username: 'james_sec', email: 'james@debugden.com', password: 'password123' },
];

// Seed data: 15 threads across various topics
const threads = [
  { title: 'How to center a div in CSS?', body: 'I have been trying to center a div both horizontally and vertically but nothing seems to work. I tried margin auto, flexbox, and grid. What is the best modern approach?', tags: ['css', 'html', 'flexbox'] },
  { title: 'Node.js async/await best practices', body: 'What are the recommended patterns for handling async/await in Node.js? Should I always use try/catch? How do I handle multiple concurrent async operations efficiently?', tags: ['javascript', 'node.js', 'async'] },
  { title: 'React useEffect cleanup function', body: 'My useEffect is causing a memory leak. I know I need a cleanup function but I am not sure when to use it. Can someone explain the return function in useEffect?', tags: ['react', 'javascript', 'hooks'] },
  { title: 'MongoDB aggregation pipeline tutorial', body: 'I need to create a complex report using MongoDB aggregation. Can someone walk me through the basic stages like $match, $group, and $lookup with practical examples?', tags: ['mongodb', 'database', 'node.js'] },
  { title: 'REST API vs GraphQL: When to use which?', body: 'I am building a new project and trying to decide between REST and GraphQL. What are the key factors to consider? When does GraphQL shine over REST?', tags: ['api', 'graphql', 'rest'] },
  { title: 'Git rebase vs merge: What is the difference?', body: 'I keep hearing that rebase is better than merge but I do not understand why. When should I use rebase? What are the risks of rewriting history?', tags: ['git', 'version-control'] },
  { title: 'TypeScript generics for beginners', body: 'I understand basic TypeScript types but generics confuse me. Can someone explain with simple examples why generics are useful and when to use them?', tags: ['typescript', 'javascript'] },
  { title: 'Docker basics for Node.js applications', body: 'I want to containerize my Node.js app with Docker. What should my Dockerfile look like? How do I handle environment variables and multi-stage builds?', tags: ['docker', 'node.js', 'devops'] },
  { title: 'JWT refresh token implementation', body: 'I am implementing JWT authentication and need to understand refresh tokens. How should I store them? What is the recommended rotation strategy?', tags: ['javascript', 'authentication', 'security'] },
  { title: 'Tailwind CSS vs custom CSS', body: 'Should I use Tailwind CSS or write custom CSS? I have heard Tailwind is great for rapid development but worried about HTML bloat. What is your experience?', tags: ['css', 'tailwind', 'frontend'] },
  { title: 'How to handle errors in Express.js?', body: 'I keep getting unhandled promise rejections in my Express routes. What is the proper way to handle errors in Express? Should I use a global error handler?', tags: ['node.js', 'express', 'error-handling'] },
  { title: 'React state management in 2024', body: 'There are so many state management options now — Redux, Zustand, Jotai, React Context, TanStack Query. Which one should I use for a medium-sized app?', tags: ['react', 'state-management', 'javascript'] },
  { title: 'PostgreSQL vs MongoDB for a new project', body: 'I am starting a new SaaS project and trying to choose between PostgreSQL and MongoDB. The data is mostly relational but I also have some document-like structures.', tags: ['postgresql', 'mongodb', 'database'] },
  { title: 'How to implement rate limiting in Node.js?', body: 'My API is getting hammered by bots. I need to add rate limiting but there are so many options. What is the best approach for a production Node.js API?', tags: ['node.js', 'security', 'api'] },
  { title: 'Vercel vs Railway for deployment', body: 'I have a full-stack app with a React frontend and Node.js backend. Which platform is better for deployment? I care about ease of use, pricing, and performance.', tags: ['deployment', 'devops', 'hosting'] },
];

// Seed data: rich answer pool
const answers = [
  { body: 'The best modern approach is to use CSS Grid with `display: grid; place-items: center;`. This is a one-liner that centers both horizontally and vertically. Flexbox also works great — just use `align-items: center` and `justify-content: center` on the parent.' },
  { body: 'I recommend using the `display: grid` approach. Here is a minimal example:\n\n```css\n.container {\n  display: grid;\n  place-items: center;\n  min-height: 100vh;\n}\n```\n\nThis works in all modern browsers and is the cleanest solution.' },
  { body: 'For async/await in Node.js, always wrap your awaits in try/catch blocks. Also consider using `Promise.all()` for concurrent operations instead of sequential awaits. This can dramatically improve performance when you have independent async calls.' },
  { body: 'The key pattern I use is:\n\n```js\ntry {\n  const result = await someAsyncOperation();\n  return result;\n} catch (error) {\n  console.error(error);\n  throw error;\n}\n```\n\nAlso, avoid using `.then()` chains when you have async/await — it makes the code much more readable.' },
  { body: 'The useEffect cleanup function runs when the component unmounts OR before the effect re-runs. You need it for subscriptions, timers, event listeners, and any side effect that needs cleanup. Without it, you get memory leaks.' },
  { body: 'For the cleanup function, here is a good pattern:\n\n```js\nuseEffect(() => {\n  const controller = new AbortController();\n  fetchData({ signal: controller.signal });\n  return () => controller.abort();\n}, []);\n```\n\nThis cancels the fetch if the component unmounts.' },
  { body: 'The MongoDB aggregation pipeline is incredibly powerful. Start with `$match` to filter documents, then use `$group` to aggregate. `$lookup` is like a SQL JOIN. The key is to filter early with `$match` to reduce the number of documents processed.' },
  { body: 'For aggregation, think of it as a pipeline where each stage transforms the data:\n\n1. `$match` — filter documents (do this first!)\n2. `$group` — group by a field and compute aggregates\n3. `$sort` — sort the results\n4. `$project` — reshape the output\n\nAlways put `$match` as early as possible for performance.' },
  { body: 'GraphQL shines when you have multiple related resources and want to avoid over-fetching. REST is simpler and more cacheable. For most projects, REST is the right choice. Use GraphQL when your frontend needs flexible queries across many resources.' },
  { body: 'I would go with REST unless you have a specific need for GraphQL. REST is easier to cache, debug, and understand. GraphQL adds complexity but solves the over-fetching problem. For a small to medium project, REST is usually sufficient.' },
  { body: 'Git rebase rewrites history to create a linear commit tree, while merge preserves the original history with merge commits. Use rebase for cleaning up local commits before pushing. Never rebase commits that have been pushed to a shared branch.' },
  { body: 'The golden rule: never rebase commits that others have based work on. Rebase is great for local cleanup — `git rebase -i` lets you squash, edit, and reorder commits. Merge is safer for shared branches because it preserves history.' },
  { body: 'Generics in TypeScript let you write reusable, type-safe code. Instead of using `any`, you can create functions and classes that work with any type while maintaining type safety. Think of them as type parameters.' },
  { body: 'Here is a simple generic example:\n\n```ts\nfunction identity<T>(arg: T): T {\n  return arg;\n}\n\nconst result = identity<string>("hello"); // type is string\nconst num = identity<number>(42); // type is number\n```\n\nGenerics are used heavily in React (useState<T>), arrays (Array<T>), and API responses.' },
  { body: 'For a Node.js Dockerfile, use multi-stage builds to keep the image small. First stage builds the app, second stage copies only the production artifacts. Always use `.dockerignore` and run as a non-root user.' },
  { body: 'Here is a solid Dockerfile pattern:\n\n```dockerfile\nFROM node:20-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --only=production\nCOPY . .\nRUN npm run build\n\nFROM node:20-alpine\nWORKDIR /app\nCOPY --from=builder /app/dist ./dist\nCOPY --from=builder /app/node_modules ./node_modules\nEXPOSE 3000\nCMD ["node", "dist/index.js"]\n```\n\nThis keeps your final image minimal.' },
  { body: 'Store refresh tokens in an httpOnly cookie, not localStorage. This protects against XSS attacks. For rotation, issue a new refresh token on each use and invalidate the old one. Store multiple refresh tokens for multi-device support.' },
  { body: 'The recommended flow is:\n1. On login, issue access token (15min) + refresh token (7 days)\n2. Store refresh token in httpOnly cookie\n3. On 401, call refresh endpoint to get new tokens\n4. On logout, delete the refresh token from DB\n\nNever store tokens in localStorage for production apps.' },
  { body: 'Tailwind CSS is excellent for rapid prototyping and consistent design. The initial learning curve is worth it. HTML bloat is a valid concern but utilities are composable and the CSS output is minimal due to purging. I have used both — Tailwind saves time.' },
  { body: 'I switched from custom CSS to Tailwind and never looked back. The key benefits: no naming conventions to debate, no CSS specificity wars, and everything is co-located with the component. The class names look ugly at first but you get used to it quickly.' },
  { body: 'The proper way to handle errors in Express is with a global error handler middleware. Always call `next(err)` in your route handlers. Create custom AppError classes for operational errors. Use catchAsync wrapper for async routes.' },
  { body: 'Here is the pattern I follow:\n\n1. Create a custom `AppError` class with statusCode\n2. Use a `catchAsync` wrapper: `(fn) => (req, res, next) => fn(req, res, next).catch(next)`\n3. Have a global error handler at the end of your middleware chain\n4. Distinguish between operational errors (bad input) and programming bugs' },
  { body: 'For medium-sized apps in 2024, I recommend:\n- Server state: TanStack Query (formerly React Query)\n- Client state: Zustand (simple, minimal boilerplate)\n- Avoid Redux unless you have very complex state needs\n- React Context is fine for theme/auth but not for frequent updates' },
  { body: 'The modern React stack I use:\n\n1. TanStack Query for server state (API data, caching, mutations)\n2. Zustand for client state (UI state, preferences)\n3. React Context just for auth and theme\n\nThis separation keeps things clean and performant.' },
  { body: 'PostgreSQL is generally the better choice for most SaaS projects. It handles relational data natively, has excellent JSON support for document-like data, and is battle-tested. MongoDB is great for rapid prototyping but you will likely need joins eventually.' },
  { body: 'I would choose PostgreSQL. Here is why:\n- ACID transactions for critical data\n- Foreign keys enforce data integrity\n- JSONB columns handle document-like data\n- Better tooling and ecosystem\n- Easier to hire developers who know SQL' },
  { body: 'For rate limiting in Node.js, I recommend using `express-rate-limit` for simplicity. For distributed systems, use Redis-backed rate limiting with `rate-limit-redis`. Set different limits for different endpoints — stricter for auth, generous for read endpoints.' },
  { body: 'The approach I use:\n\n1. Global rate limiter: 100 requests per 15 minutes\n2. Auth endpoints: 10 requests per 15 minutes\n3. API endpoints: 1000 requests per 15 minutes\n\nUse `express-rate-limit` with a Redis store for production. Always return proper 429 responses with Retry-After headers.' },
  { body: 'For a full-stack app, I recommend Railway. It supports both frontend and backend, has built-in PostgreSQL, and the deployment experience is seamless. Vercel is great for frontend but Railway handles the full stack better.' },
  { body: 'Vercel is excellent for frontend/Next.js apps. For a full-stack app with a separate backend, Railway gives you more flexibility. Railway also has better pricing for always-on services. If your backend needs to stay up 24/7, go with Railway.' },
];

// Seed function: creates all data
const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding');

    // Clear existing data
    await User.deleteMany({});
    await Thread.deleteMany({});
    await Comment.deleteMany({});
    await Vote.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    const createdUsers = await User.create(users);
    console.log(`Created ${createdUsers.length} users`);

    // Create threads (distribute across users)
    const threadsWithAuthors = threads.map((t, i) => ({
      ...t,
      author: createdUsers[i % createdUsers.length]._id,
    }));
    const createdThreads = await Thread.create(threadsWithAuthors);
    console.log(`Created ${createdThreads.length} threads`);

    // Create comments (3-6 per thread, more varied)
    let totalComments = 0;
    const allComments = [];

    for (const thread of createdThreads) {
      const numComments = 3 + Math.floor(Math.random() * 4); // 3-6 comments
      const threadComments = [];
      const usedAnswers = new Set();

      for (let i = 0; i < numComments; i++) {
        // Pick a unique answer body for variety
        let answerIndex;
        do {
          answerIndex = Math.floor(Math.random() * answers.length);
        } while (usedAnswers.has(answerIndex) && usedAnswers.size < answers.length);
        usedAnswers.add(answerIndex);

        threadComments.push({
          body: answers[answerIndex].body,
          author: createdUsers[(i + 1) % createdUsers.length]._id,
          thread: thread._id,
        });
      }

      const comments = await Comment.create(threadComments);
      allComments.push(...comments);
      totalComments += comments.length;

      // Update thread comment count
      await Thread.findByIdAndUpdate(thread._id, { commentCount: comments.length });
    }
    console.log(`Created ${totalComments} comments`);

    // Create votes on threads (more spread, higher counts)
    let totalVotes = 0;
    for (const thread of createdThreads) {
      const numVotes = 2 + Math.floor(Math.random() * 5); // 2-6 votes per thread
      for (let i = 0; i < numVotes; i++) {
        try {
          await Vote.create({
            user: createdUsers[i % createdUsers.length]._id,
            targetId: thread._id,
            targetType: 'Thread',
            value: Math.random() > 0.25 ? 1 : -1, // 75% upvotes
          });
          totalVotes++;
        } catch (e) {
          // Ignore duplicate vote errors
        }
      }

      // Update thread vote count
      const voteSum = await Vote.aggregate([
        { $match: { targetId: thread._id, targetType: 'Thread' } },
        { $group: { _id: null, total: { $sum: '$value' } } },
      ]);
      const sum = voteSum.length > 0 ? voteSum[0].total : 0;
      await Thread.findByIdAndUpdate(thread._id, { voteCount: sum });
    }

    // Create votes on comments
    for (const comment of allComments) {
      const numVotes = 1 + Math.floor(Math.random() * 3); // 1-3 votes per comment
      for (let i = 0; i < numVotes; i++) {
        try {
          await Vote.create({
            user: createdUsers[i % createdUsers.length]._id,
            targetId: comment._id,
            targetType: 'Comment',
            value: Math.random() > 0.3 ? 1 : -1,
          });
          totalVotes++;
        } catch (e) {
          // Ignore duplicate vote errors
        }
      }

      // Update comment vote count
      const voteSum = await Vote.aggregate([
        { $match: { targetId: comment._id, targetType: 'Comment' } },
        { $group: { _id: null, total: { $sum: '$value' } } },
      ]);
      const sum = voteSum.length > 0 ? voteSum[0].total : 0;
      await Comment.findByIdAndUpdate(comment._id, { voteCount: sum });
    }

    console.log(`Created ${totalVotes} votes`);

    console.log('\n--- Seed Complete ---');
    console.log(`Users: ${createdUsers.length}`);
    console.log(`Threads: ${createdThreads.length}`);
    console.log(`Comments: ${totalComments}`);
    console.log(`Votes: ${totalVotes}`);
    console.log('\nTest accounts (all passwords: password123):');
    createdUsers.forEach((u) => console.log(`  ${u.email}`));

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
