# CampusFlow

CampusFlow is a full-stack, role-based campus queue management platform that helps students avoid standing in physical lines for routine campus services.

Students can browse available services, join a queue remotely, receive a token, and track their position. Staff members operate the queue lifecycle, while administrators manage services and counters and monitor platform analytics.

> **Project status:** CampusFlow currently runs locally and is not deployed yet.

## Repository

```bash
git clone https://github.com/omicoded19/CampusFlow.git
cd CampusFlow
```

## Features

### Student Portal

* Register and sign in as a student
* Browse campus services
* View service availability, active counters, queue length, and estimated wait time
* Select a reason and join a queue remotely
* Receive a unique queue token
* Track the currently serving token, people ahead, and queue progress
* Leave an active queue
* View completed, skipped, and cancelled queue history
* Access notifications, profile, and settings pages

### Staff Portal

CampusFlow currently uses a simplified shared-staff workflow for local testing and demonstrations.

The shared staff account can:

* View active queue entries from every campus service
* Filter queue entries by service
* Call the next waiting token
* Start serving a called token
* Complete a service request
* Mark a token as skipped or no-show
* Transfer an active token to another available service
* View current queues and recent queue history

### Admin Portal

* View dashboard statistics and queue analytics
* Monitor service usage and wait-time trends
* View service distribution and peak-hour charts
* Review departments
* Open or close services
* Activate or deactivate service counters
* Review system activity logs
* Access admin profile and settings pages

## Technology Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* React Router
* Lucide React

### Backend

* Node.js
* Express.js
* TypeScript
* JWT authentication
* HTTP-only cookies
* bcrypt password hashing

### Database

* PostgreSQL
* Prisma ORM

## Application Roles

CampusFlow supports three user roles.

| Role    | Account creation                  | Main responsibility                             |
| ------- | --------------------------------- | ----------------------------------------------- |
| Student | Registers through the application | Joins and tracks campus service queues          |
| Staff   | Created through the database seed | Operates queue entries across services          |
| Admin   | Created through the database seed | Manages services, counters, analytics, and logs |

## Local Demo Accounts

Student accounts are created from the registration page.

The Staff and Admin accounts are generated from values in `server/.env` when the database seed runs.

Suggested local demo values:

```env
DEMO_STAFF_EMAIL="staff@campusflow.local"
DEMO_STAFF_PASSWORD="CampusFlow123!"

DEMO_ADMIN_EMAIL="admin@campusflow.local"
DEMO_ADMIN_PASSWORD="CampusFlowAdmin123!"
```

With those values, use:

### Shared Staff

```text
Email: staff@campusflow.local
Password: CampusFlow123!
```

### Admin

```text
Email: admin@campusflow.local
Password: CampusFlowAdmin123!
```

These credentials are intended only for local development. Use different secure credentials for any hosted environment.

## Prerequisites

Install the following before running CampusFlow:

* Node.js 20 or newer
* npm
* PostgreSQL
* Git

## Local Installation

### 1. Clone the repository

```bash
git clone https://github.com/omicoded19/CampusFlow.git
cd CampusFlow
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Install backend dependencies

```bash
cd server
npm install
cd ..
```

## Environment Configuration

### Frontend environment

Create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:4000
```

### Backend environment

Create `server/.env`:

```env
PORT=4000
CLIENT_URL=http://localhost:5173
NODE_ENV=development

DATABASE_URL="postgresql://POSTGRES_USER:POSTGRES_PASSWORD@localhost:5432/campusflow?schema=public"

JWT_SECRET="replace-this-with-a-long-random-secret-of-at-least-32-characters"

DEMO_STAFF_EMAIL="staff@campusflow.local"
DEMO_STAFF_PASSWORD="CampusFlow123!"

DEMO_ADMIN_EMAIL="admin@campusflow.local"
DEMO_ADMIN_PASSWORD="CampusFlowAdmin123!"
```

Replace:

* `POSTGRES_USER` with your PostgreSQL username
* `POSTGRES_PASSWORD` with your PostgreSQL password
* `5432` with your PostgreSQL port when it is different
* `JWT_SECRET` with a new secure random value

Do not commit either `.env` file.

## Database Setup

Create a PostgreSQL database named `campusflow`.

You can use pgAdmin or run:

```bash
createdb campusflow
```

Then prepare and seed the database:

```bash
cd server

npx prisma generate
npx prisma migrate deploy
npm run db:seed
```

The seed creates:

* Campus departments
* Campus services
* Service reasons
* Service counters
* Shared Staff account
* Admin account

To inspect the database visually:

```bash
npx prisma studio
```

## Running CampusFlow

CampusFlow requires two terminals.

### Terminal 1: Backend

From the cloned project:

```bash
cd CampusFlow/server
npm run dev
```

The API normally runs at:

```text
http://localhost:4000
```

### Terminal 2: Frontend

```bash
cd CampusFlow
npm run dev
```

Vite normally opens the frontend at:

```text
http://localhost:5173
```

When port `5173` is already in use, Vite may select another port. Update `CLIENT_URL` in `server/.env` to match the frontend URL and restart the backend.

## How to Use CampusFlow

### Student Workflow

1. Open `http://localhost:5173/register`.
2. Create a student account using a name, email, student ID, and password.
3. Sign in and open **Services**.
4. Select an available service.
5. Choose a reason and join the queue.
6. Open **My Queue** to view:

   * Token number
   * Currently serving token
   * People ahead
   * Estimated wait time
   * Queue progress
7. Wait for Staff to call and process the token.
8. Open **History** after the request is completed, skipped, or cancelled.

A student can have only one active queue entry at a time.

### Staff Workflow

1. Open `http://localhost:5173/login?role=staff`.
2. Sign in using the shared Staff credentials.
3. Open the Staff Console.
4. Click **Refresh** after a student joins a queue.
5. Process the token through the following lifecycle:

```text
WAITING → CALLED → SERVING → COMPLETED
```

Staff can also mark a waiting or called token as `SKIPPED` or transfer an active token to another available service.

The shared Staff account can view and operate queues across all services.

### Admin Workflow

1. Open `http://localhost:5173/login?role=staff`.
2. Sign in using the Admin credentials.
3. The application redirects the Admin user to `/admin`.
4. Use the Admin portal to:

   * Review analytics
   * Open or close services
   * Activate or deactivate counters
   * Review departments
   * Inspect system logs

## Service Availability Rule

A service is available for students only when:

```text
The service is open
AND
At least one counter for the service is active
```

When a service is closed or has no active counter, it remains visible but students cannot join its queue.

Administrators can change these states from:

```text
/admin/services
/admin/counters
```

## Important Routes

### Public Routes

```text
/
/login
/register
/api-status
```

### Student Routes

```text
/dashboard
/services
/services/:serviceId
/dashboard/queue
/dashboard/history
/dashboard/notifications
/dashboard/profile
/dashboard/settings
```

### Staff Routes

```text
/staff
/staff/current
/staff/queues
/staff/history
/staff/transfers
/staff/announcements
/staff/profile
```

### Admin Routes

```text
/admin
/admin/departments
/admin/services
/admin/counters
/admin/analytics
/admin/logs
/admin/settings
/admin/profile
```

## Recommended End-to-End Demo

Use separate browser sessions so each role remains signed in:

* Student: Incognito window or a separate browser
* Staff: Normal browser window
* Admin: Another browser profile

Run this workflow:

```text
Student registers and joins a queue
→ Staff refreshes the queue dashboard
→ Staff calls the token
→ Staff starts the service
→ Staff completes the request
→ Student history updates
→ Admin analytics and system logs reflect the activity
```

## Build Verification

Run these commands before committing changes.

### Frontend

```bash
npm run lint
npm run build
```

### Backend

```bash
cd server
npm run build
```

## Project Structure

```text
CampusFlow/
├── src/
│   ├── api/                # Frontend API request helpers
│   ├── components/         # Reusable interface components
│   ├── pages/              # Student, Staff, Admin, and authentication pages
│   └── types/              # Shared frontend TypeScript types
├── server/
│   ├── prisma/             # Prisma schema, migrations, and database seed
│   └── src/                # Express API, middleware, and routes
├── public/
├── .env.example
├── package.json
└── README.md
```

## Current Limitations

* CampusFlow is currently intended for local development and demonstration.
* The frontend, backend, and PostgreSQL database must all be running.
* Queue updates use API refreshes rather than WebSocket-based real-time updates.
* Demo Staff and Admin credentials must be changed before production use.

## Security Notes

* Never commit `.env` or `server/.env`.
* Never publish your PostgreSQL password or JWT secret.
* Use new database credentials and secret values for deployment.
* Replace all demo passwords before hosting the application publicly.

## Author

Built by [omicoded19](https://github.com/omicoded19).
