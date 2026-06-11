# ProTrack-Auto Setup Instructions

## ✅ Setup Complete!

Your ProTrack-Auto application has been properly configured and is ready to use.

## 🎯 Quick Start Guide

### 1. Start the Application

The application consists of two parts - backend and frontend. You can start both with:

```bash
npm run dev
```

This will start:
- **Backend**: http://localhost:5001
- **Frontend**: http://localhost:5173

### 2. Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

### 3. Login Credentials

Use these demo accounts to test different roles:

#### Student Account
- **Email**: student1@example.com
- **Password**: Student@123

#### Faculty Guide Account
- **Email**: guide1@example.com
- **Password**: Guide@123

#### Coordinator Account
- **Email**: coordinator@example.com
- **Password**: Coordinator@123

#### Committee Member Account
- **Email**: committee@example.com
- **Password**: Committee@123

## 🔧 Troubleshooting

### Blank Page Issue

If you see a blank page, try these steps:

1. **Clear Browser Cache**
   - Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
   - Clear cached images and files
   - Restart your browser

2. **Hard Refresh**
   - Press `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)

3. **Check Browser Console**
   - Press `F12` to open Developer Tools
   - Click on the "Console" tab
   - Look for any error messages (red text)
   - If you see errors, share them for further assistance

4. **Verify Servers are Running**
   - Backend should be at: http://localhost:5001/api/health
   - Frontend should be at: http://localhost:5173
   - You should see output in your terminal for both services

5. **Check PostgreSQL Database**
   - Ensure PostgreSQL is running on your system
   - Database name: `protrack_auto`
   - Username: `postgres`
   - Password: Check your `backend/.env` file

### Database Issues

If you encounter database connection errors:

```bash
# Reinitialize the database
cd backend
npm run db:init

# Seed with demo data
npm run db:seed
```

### Port Conflicts

If ports 5001 or 5173 are already in use:

1. **Backend**: Edit `backend/.env` and change `PORT=5001` to another port
2. **Frontend**: Edit `vite.config.ts` and add:
   ```typescript
   server: {
     port: 3000, // or any other available port
     // ... existing config
   }
   ```

## 📱 Browser Compatibility

ProTrack-Auto works best on:
- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari
- ⚠️ Internet Explorer (Not supported)

## 🎨 Features Overview

After logging in, you'll have access to:

### Students
- Create and join project groups
- Submit weekly logbooks
- Track project progress
- View guide feedback
- Submit peer evaluations

### Faculty Guides
- Review student logbooks
- Approve/reject proposals
- Provide feedback to groups
- Track guide workload

### Coordinators
- Manage all users
- Allocate guides to groups
- View analytics dashboard
- Configure system settings
- Export reports

### Committee Members
- Evaluate final projects
- View project history
- Access rubric-based grading
- Generate evaluation reports

## 🚀 Next Steps

1. Log in with one of the demo accounts
2. Explore the dashboard
3. Try different features for each role
4. Create your own data (groups, proposals, logbooks)

## ⚡ Performance Tips

- The application uses React Query for data caching
- Most data refreshes automatically
- For real-time updates, refresh the page
- Enable browser hardware acceleration for smooth animations

## 📞 Support

If you continue to experience issues:

1. Check the console logs in your terminal
2. Check browser Developer Tools (F12) → Console tab
3. Verify all dependencies are installed: `npm install`
4. Ensure PostgreSQL is running and accessible
5. Try restarting both backend and frontend servers

---

**Note**: This is a development build. For production deployment, run `npm run build` and deploy the `dist` folder with appropriate environment configurations.
