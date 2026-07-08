# DebugDen

A Stack Overflow–style Q&A platform for developers. Ask technical questions, answer others, vote on the best content, and mark accepted answers — built on the MERN stack with production-grade auth, atomic voting, and a mobile-first UI.

## Features

- 🔐 **JWT authentication** with access/refresh token rotation and silent frontend refresh
- ✅ **Atomic voting** — upvote/downvote/switch handled in a single MongoDB transaction to prevent race conditions, with optimistic UI updates
- 💬 **Threads & Comments** — ask questions, post answers, mark an answer as accepted
- 🔍 **Full-text search** with relevance ranking
- 🖼️ **Image uploads** via Cloudinary (avatars)
- 📱 **Responsive design** — dedicated mobile navigation and search UI
- ⚡ **Cursor-based pagination** for efficient feed loading

## Tech Stack

**Frontend:** React 19, Vite, TanStack Query, Tailwind CSS, Axios

**Backend:** Node.js, Express, MongoDB, Mongoose, JWT, Cloudinary, Winston/Morgan

## Architecture

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────┐
│   React     │─────▶│  Express API     │─────▶│  MongoDB    │
│  (Vite +    │◀─────│  (JWT + RBAC)    │◀─────│  (Mongoose) │
│  Tailwind)  │      └──────────────────┘      └─────────────┘
└─────────────┘               │
                               ▼
                      ┌──────────────────┐
                      │   Cloudinary     │
                      └──────────────────┘
```

**Domain model:**

```
User ──1:N── Thread ──1:N── Comment
  │                │              │
  └──────1:N───────┴──────────────┘
              Vote (polymorphic: Thread or Comment)
```

## Getting Started

### Prerequisites

- Node.js
- MongoDB (Atlas recommended — voting uses transactions, which require a replica set)
- A Cloudinary account

### Installation

```bash
git clone https://github.com/<your-username>/debugden.git
cd debugden
```

**Backend**
```bash
cd backend
cp .env.example .env   # add MongoDB URI, JWT secrets, Cloudinary credentials
npm install
npm run dev
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

**Seed sample data (optional)**
```bash
cd backend
npm run seed
```
Seeded accounts use the password `password123`.

## API Reference

Base URL: `/api/v1`

| Resource | Endpoint |
|---|---|
| Auth | `POST /auth/register` |
| | `POST /auth/login` |
| | `POST /auth/refresh` |
| | `POST /auth/logout` |
| | `GET /auth/user` |
| Users | `GET /users/user` |
| | `PATCH /users/user` |
| | `GET /users/:username` |
| | `GET /users/:username/threads` |
| Threads | `POST /threads` |
| | `GET /threads` |
| | `GET /threads/:id` |
| | `PATCH /threads/:id` |
| | `DELETE /threads/:id` |
| | `GET /threads/search?q=` |
| Comments | `POST/GET/PATCH/DELETE /threads/:id/comments[/:cid]` |
| Votes | `POST /votes` |
| | `GET /votes/user-votes` |
| Uploads | `POST /uploads` |
| | `DELETE /uploads/:publicId` |

## Project Structure

```
backend/
  src/
    config/
    controllers/
    middlewares/
    models/
    routes/
    seed/
    utils/

frontend/
  src/
    components/
    contexts/
    lib/
    pages/
```

## License

MIT
