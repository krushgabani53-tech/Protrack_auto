# ProTrack-Auto — Academic Project Lifecycle Management

A full-stack role-based ERP for engineering students that replaces physical project diaries with digital workflows.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS |
| State | Zustand, React Router |
| UI | Radix UI, Recharts, Framer Motion |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL |
| Auth | JWT (7-day expiry), bcryptjs |

---

## Roles

| Role | Access |
|------|--------|
| `STUDENT` | Create groups, submit logbooks, view proposals |
| `GUIDE` | Approve/reject logbook entries |
| `COORDINATOR` | Manually assign guides to groups |
| `COMMITTEE` | View evaluations and reports |

**Business Rules:**
- A faculty guide can mentor a **maximum of 4 groups**
- A student group must have **3–4 members** (one group per student)
- Logbook entries are **locked permanently** once marked `APPROVED`

---

## Quick Start

### Prerequisites
- Node.js 16+
- PostgreSQL 12+

### 1. Install Dependencies
```bash
npm run setup
```

### 2. Set Up PostgreSQL
```bash
# macOS
brew install postgresql@15 && brew services start postgresql@15

# Create the database
psql -U postgres -c "CREATE DATABASE protrack_auto;"
```

### 3. Configure Environment

**Root `.env`** (frontend):
```
VITE_API_URL=http://localhost:5000/api
```

**`backend/.env`**:
```
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
DB_HOST=localhost
DB_PORT=5432
DB_NAME=protrack_auto
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your_secret_key_here
```

### 4. Initialize Database Schema
```bash
cd backend && npm run db:init
```

### 5. Seed Test Users (Optional)
```bash
cd backend && npm run db:seed
```

| Role | Email | Password |
|------|-------|----------|
| STUDENT | student1@example.com | Student@123 |
| STUDENT | student2@example.com | Student@123 |
| GUIDE | guide1@example.com | Guide@123 |
| GUIDE | guide2@example.com | Guide@123 |
| COORDINATOR | coordinator@example.com | Coordinator@123 |
| COMMITTEE | committee@example.com | Committee@123 |

### 6. Start Development Servers
```bash
# Both frontend + backend together
npm run dev

# Or separately
npm run dev:frontend   # http://localhost:5173
npm run dev:backend    # http://localhost:5000
```

---

## API Reference

**Base URL:** `http://localhost:5000/api`

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login, returns JWT |

**Login Request:**
```json
{ "email": "user@example.com", "password": "SecurePass123" }
```
**Login Response:**
```json
{ "user_id": "uuid", "email": "...", "role": "STUDENT", "token": "jwt..." }
```

**Using the token:**
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:5000/api/...
```

### Groups & Proposals *(Student)*
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/groups` | Create a group |
| POST | `/groups/:id/members` | Add member via PRN |
| POST | `/groups/:id/proposals` | Submit project proposal |

### Guide Allocation *(Coordinator)*
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/allocation/pending` | Groups needing a guide |
| POST | `/allocation/assign` | Assign guide to group |

### Logbooks *(Guide & Student)*
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/groups/:id/logbooks` | Student submits entry |
| PATCH | `/logbooks/:id` | Guide approves/rejects |

### Health Check
```bash
curl http://localhost:5000/api/health
# { "status": "OK", "timestamp": "..." }
```

---

## npm Scripts

### Root (Frontend)
```bash
npm run setup      # Install all dependencies (frontend + backend)
npm run dev        # Start both servers concurrently
npm run build      # Production build
npm run lint       # Run ESLint
npm run preview    # Preview production build
```

### Backend (`cd backend`)
```bash
npm run dev        # Dev server with ts-node
npm run build      # Compile TypeScript
npm run start      # Run production build
npm run db:init    # Initialize DB schema
npm run db:seed    # Seed test users
```

---

## Database Management

```bash
# Reset database (deletes all data)
psql -U postgres -d protrack_auto -f backend/src/db/init.sql

# Backup
pg_dump -U postgres protrack_auto > backup.sql

# Restore
psql -U postgres -d protrack_auto < backup.sql
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS error | Ensure `CORS_ORIGIN` in `backend/.env` matches `http://localhost:5173` |
| Backend not connecting | Check `VITE_API_URL` in root `.env` |
| Port already in use | `lsof -i :5000 \| grep LISTEN \| awk '{print $2}' \| xargs kill -9` |
| DB connection failed | Verify PostgreSQL is running and credentials in `backend/.env` are correct |

---

## License

MIT
