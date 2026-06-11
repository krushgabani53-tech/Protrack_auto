# Habit Tracking System - Full Stack

A comprehensive student habit tracking and management system with React frontend and Node.js backend.

## Project Structure

```
habit/
├── src/                   # React frontend
│   ├── components/
│   ├── pages/
│   ├── lib/
│   └── store/
├── backend/               # Express.js backend
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── package.json
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 16+ and npm
- Git

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Start development server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory (project root):
```bash
cd ..
```

2. Install dependencies (if not already installed):
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Start development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

### Running Both Together

Open two terminal windows:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```

Then open `http://localhost:5173` in your browser.

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Endpoints

#### Authentication
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user
- `GET /auth/me` - Get current user

#### Students
- `GET /students` - Get all students
- `GET /students/:id` - Get student by ID
- `POST /students` - Create new student
- `PUT /students/:id` - Update student
- `DELETE /students/:id` - Delete student

#### Habits
- `GET /habits` - Get all habits (supports `?studentId` query)
- `GET /habits/:id` - Get habit by ID
- `POST /habits` - Create new habit
- `PUT /habits/:id` - Update habit
- `DELETE /habits/:id` - Delete habit

#### Groups
- `GET /groups` - Get all groups
- `GET /groups/:id` - Get group by ID
- `POST /groups` - Create new group
- `POST /groups/:id/members` - Add member to group
- `DELETE /groups/:id/members` - Remove member from group
- `DELETE /groups/:id` - Delete group

#### Notifications
- `GET /notifications` - Get notifications (requires `?userId`)
- `PUT /notifications/:id/read` - Mark notification as read
- `DELETE /notifications/:id` - Delete notification

## Features

### Frontend
- 📊 Analytics Dashboard
- 👥 Group Management
- 📅 Review Scheduling
- 🏫 Student & Faculty Dashboards
- 📋 Document Management
- 🎯 Topic Workflow Management
- 📱 Notifications System

### Backend
- ✅ RESTful API
- 🔐 Authentication (Mock)
- 📦 Data Models (Users, Students, Habits, Groups)
- 🔄 CORS Support
- 📝 Comprehensive Logging

## Technology Stack

### Frontend
- React 19
- Vite
- TypeScript
- Tailwind CSS
- Zustand (State Management)
- React Router
- Recharts (Charting)
- Radix UI Components

### Backend
- Node.js
- Express.js
- TypeScript
- CORS

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```

### Backend (.env)
```
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

## Development

### Frontend Commands
```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

### Backend Commands
```bash
npm run dev      # Start dev server with ts-node
npm run build    # Build TypeScript to JS
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Mock Data

The backend comes pre-loaded with mock data:
- 3 Users (1 student, 1 faculty, 1 admin)
- 3 Students with enrollment information
- 3 Habits for tracking
- 2 Study/Project Groups
- 2 Sample Notifications

This data is stored in memory and resets when the server restarts.

## Testing the API

Use any of these tools to test the API:
- cURL
- Postman
- Insomnia
- Thunder Client (VS Code extension)

### Example: Get All Students
```bash
curl http://localhost:5000/api/students
```

### Example: Create a Habit
```bash
curl -X POST http://localhost:5000/api/habits \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "1",
    "title": "Morning Workout",
    "description": "30 min cardio",
    "category": "Health",
    "frequency": "daily"
  }'
```

## Future Enhancements

- [ ] Real database (MongoDB/PostgreSQL)
- [ ] JWT authentication
- [ ] User role-based access control
- [ ] Email notifications
- [ ] File upload support
- [ ] Real-time updates with WebSockets
- [ ] Advanced analytics
- [ ] Export reports to PDF
- [ ] Mobile app version

## Troubleshooting

### CORS Issues
Ensure `CORS_ORIGIN` in backend `.env` matches your frontend URL (default: `http://localhost:5173`)

### Backend not connecting
- Check if backend is running on port 5000
- Verify `VITE_API_URL` in frontend `.env`

### Port already in use
```bash
# Kill process on port 5000 (macOS/Linux)
lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Or change PORT in backend/.env
```

## License

MIT

## Support

For issues or questions, please open an issue in the repository.
