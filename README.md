# CampusFlow

CampusFlow is a full-stack campus queue-management platform. Students can create an account, browse live campus services, join one queue remotely, track their token and position, cancel a queue entry, and review queue history. Staff users can operate active queues by calling, serving, completing, or skipping tokens.

## Core features

- Student registration and login with secure HTTP-only cookie sessions
- Role-based student and staff routes
- Live service availability, active-counter counts, queue length, and estimated waiting time
- Persistent queue tokens stored in PostgreSQL
- One-active-queue-per-student enforcement
- Student dashboard, service directory, queue details, history, notifications, profile, and settings
- Staff operations dashboard with controlled queue-status transitions
- Responsive React interface with loading, empty, and error states

## Tech stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router, Lucide React
- Backend: Node.js, Express.js, TypeScript
- Database: PostgreSQL, Prisma ORM
- Authentication: JWT, bcrypt, HTTP-only cookies

## Local setup

### 1. Install dependencies

```bash
npm install
cd server
npm install
```

### 2. Configure environment files

Create `.env` in the project root:

```env
VITE_API_URL=http://localhost:4000
```

Create `server/.env` from `server/.env.example` and provide a PostgreSQL connection string and a JWT secret of at least 32 characters.

### 3. Prepare the database

```bash
cd server
npx prisma migrate deploy
npx prisma generate
npm run db:seed
```

The optional `DEMO_STAFF_EMAIL` and `DEMO_STAFF_PASSWORD` values create a local staff login during seeding.

### 4. Run CampusFlow

Backend terminal:

```bash
cd server
npm run dev
```

Frontend terminal:

```bash
npm run dev
```

## Verification

```bash
npm run lint
npm run build
cd server
npm run build
```

## Main application flow

```text
Student registration/login
→ Campus service directory
→ Service details
→ Join queue
→ Persistent token and live position
→ Staff calls/serves/completes token
→ Student queue history
```
