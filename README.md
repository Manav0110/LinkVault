# LinkVault

LinkVault is a full-stack temporary sharing app for text snippets and files. Users upload either text or a file, receive a unique link, and share it with others for access until the content expires.

## Tech Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express + Multer
- Database: MongoDB + Mongoose
- Background cleanup: node-cron + MongoDB TTL index

## Features

- Upload text or file (one content type per share)
- Generate unique share link (`/view/:id`)
- Link-only access to shared content
- Expiry controls:
- Date + time-based expiry
- Minute-based expiry
- Default expiry is 10 minutes
- Text view with copy-to-clipboard
- File download flow
- Optional security/management features:
- Password-protected links
- One-time-view links
- Max view count
- Optional account system (register/login)
- User dashboard to list/deactivate own links

## Project Structure

```text
LinkVault/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── jobs/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── uploads/
│   └── server.js
├── frontend/
│   ├── src/
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm
- MongoDB (local or remote)

### 1. Clone and Install

```bash
git clone https://github.com/Manav0110/LinkVault.git

cd LinkVault

cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure Environment Variables

Backend (`backend/.env`)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/linkvault
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
AUTH_SECRET=change-this-secret-in-production
```

Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Run the App

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

App URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`
- Health check: `http://localhost:5000/health`

## API Overview

Base URL: `http://localhost:5000/api`

### Content APIs

1. `POST /upload`
- Purpose: Upload text or file and get share link
- Auth: Optional bearer token (if present, link is tied to user)
- Body (`multipart/form-data`):
- `text` or `file` (exactly one required)
- Optional: `expiryMinutes`, `expiryDate`, `expiryTime`
- Optional: `password`, `oneTimeView`, `maxViews`
- Response: `201 Created` with `uniqueId`, `shareLink`, `expiresAt`, `type`

2. `POST /content/:id`
- Purpose: Resolve link metadata/content for viewer
- Body: optional `{ "password": "..." }`
- Returns:
- Text content directly for text links
- File metadata for file links


3. `GET /download/:id`
- Purpose: Download file payload
- Query: optional `password`
- Errors: similar to content endpoint based on validity/expiry/password

4. `DELETE /content/:id`
- Purpose: Manual delete by ID

### Auth APIs (Bonus Feature)

1. `POST /auth/register`
- Body: `{ "name": "...", "email": "...", "password": "..." }`
- Returns token + user profile

2. `POST /auth/login`
- Body: `{ "email": "...", "password": "..." }`
- Returns token + user profile

3. `GET /auth/me`
- Auth required
- Returns current user profile

### Dashboard APIs (Bonus Feature)

1. `GET /dashboard/links`
- Auth required
- Returns current user link list + counts (`active`, `expired`, `deactivated`)

2. `PATCH /dashboard/links/:id/deactivate`
- Auth required
- Deactivates one owned link
- If file link, server also removes the stored file

## Database Models

### `Content`

- `uniqueId` (String, unique, indexed)
- `type` (`text` | `file`)
- `textContent`
- `fileName`, `fileSize`, `fileType`, `filePath`
- `password` (hashed when set)
- `oneTimeView`, `viewCount`, `maxViews`
- `owner` (ObjectId -> `User`, optional)
- `isActive`, `deactivatedAt`
- `expiresAt` (TTL indexed)
- `createdAt`

TTL index:

- `contentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })`
- MongoDB auto-removes expired documents

### `User`

- `name`
- `email` (unique, lowercase)
- `password` (hashed)
- `createdAt`

## Design Decisions

1. Opaque share IDs
- Uses `nanoid(10)` to generate hard-to-guess link IDs.

2. Dual expiry strategy
- Immediate checks on access (`expiresAt` validation)
- Background cleanup via cron every 5 minutes
- MongoDB TTL index as persistence-level cleanup

3. Flexible ownership
- Upload works with or without login.
- If authenticated, ownership is attached for dashboard management.

4. File lifecycle handling
- Files are stored on local disk (`backend/uploads`).
- Files are deleted on expiry/deactivation/manual delete and one-time flow completion.

5. Security controls
- Optional password hashing using `bcryptjs`
- Max views and one-time-view enforcement
- Token-based protected dashboard/auth routes



## Assumptions and Limitations

1. Storage
- Files are stored on local server disk, not object storage.
- Horizontal scaling would require shared/object storage.

2. Status code interpretation
- Invalid links currently return `404` and expired/deactivated links return `410`.
- (Take-home text mentions `403` for invalid access, but implementation separates these cases.)

3. Access model
- Content is link-access based; anyone with link (and password if set) can view.
- No role-based ACL beyond optional owner dashboard features.

4. Upload constraints
- Max upload size is `100MB` (Multer limit).
- MIME type filtering is permissive (`fileFilter` accepts all types).

5. Cleanup timing
- TTL cleanup in MongoDB is asynchronous and not guaranteed to execute immediately at expiry second.
- Cron cleanup runs every 5 minutes for additional file/doc cleanup.

