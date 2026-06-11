import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import { useAuthStore } from './store/authStore';
import { ProtectedRoute } from './components/ProtectedRoute';

// Student
import { StudentDashboardNew } from './pages/Student/StudentDashboardNew';
import { StudentGroups } from './pages/Student/StudentGroups';
import { StudentLogbook } from './pages/Student/StudentLogbook';
import { StudentTasks } from './pages/Student/StudentTasks';
import { StudentPeerEvaluation } from './pages/Student/StudentPeerEvaluation';
import StudentResources from './pages/Student/StudentResources';

// Guide
import { GuideDashboardNew } from './pages/Guide/GuideDashboardNew';
import { GuideGroups } from './pages/Guide/GuideGroups';
import { GuideReviews } from './pages/Guide/GuideReviews';
import { GuideTopicApproval } from './pages/Guide/GuideTopicApproval';

// Coordinator
import { CoordinatorDashboardNew } from './pages/Coordinator/CoordinatorDashboardNew';
import { CoordinatorAllocations } from './pages/Coordinator/CoordinatorAllocations';
import { CoordinatorUsers } from './pages/Coordinator/CoordinatorUsers';
import { CoordinatorRubrics } from './pages/Coordinator/CoordinatorRubrics';
import { CoordinatorSchedules } from './pages/Coordinator/CoordinatorSchedules';
import { CoordinatorAnnouncements } from './pages/Coordinator/CoordinatorAnnouncements';
// import { CoordinatorTopicApproval } from './pages/Coordinator/CoordinatorTopicApproval';

// Committee
import { CommitteeEvaluations } from './pages/Committee/CommitteeEvaluations';
import { CommitteeEvaluationNew } from './pages/Committee/CommitteeEvaluationNew';
import { CommitteeDashboard } from './pages/Committee/CommitteeDashboard';
import { CommitteeResults } from './pages/Committee/CommitteeResults';
import { CommitteeHistoricSearch } from './pages/Committee/CommitteeHistoricSearch';
import { CommitteeTopicApproval } from './pages/Committee/CommitteeTopicApproval';

// Shared Pages
import POPSOMapping from './pages/POPSOMapping';
import DocumentManagement from './pages/DocumentManagement';
import TopicWorkflow from './pages/TopicWorkflow';
import Notifications from './pages/Notifications';

export default function App() {
    const { isAuthenticated, user } = useAuthStore();

    return (
        <BrowserRouter>
            <Routes>
                {/* ── Public ── */}
                <Route
                    path="/"
                    element={
                        isAuthenticated && user
                            ? <Navigate to={`/${user.role.toLowerCase()}/dashboard`} replace />
                            : <LandingPage />
                    }
                />
                <Route
                    path="/login"
                    element={
                        isAuthenticated && user
                            ? <Navigate to={`/${user.role.toLowerCase()}/dashboard`} replace />
                            : <Login />
                    }
                />

                {/* ── Student ── */}
                <Route path="/student/dashboard" element={
                    <ProtectedRoute requiredRoles={['STUDENT']}><StudentDashboardNew /></ProtectedRoute>
                } />
                <Route path="/student/groups" element={
                    <ProtectedRoute requiredRoles={['STUDENT']}><StudentGroups /></ProtectedRoute>
                } />
                <Route path="/student/logbook" element={
                    <ProtectedRoute requiredRoles={['STUDENT']}><StudentLogbook /></ProtectedRoute>
                } />
                <Route path="/student/tasks" element={
                    <ProtectedRoute requiredRoles={['STUDENT']}><StudentTasks /></ProtectedRoute>
                } />
                <Route path="/student/peer-evaluation" element={
                    <ProtectedRoute requiredRoles={['STUDENT']}><StudentPeerEvaluation /></ProtectedRoute>
                } />
                <Route path="/student/resources" element={
                    <ProtectedRoute requiredRoles={['STUDENT']}><StudentResources /></ProtectedRoute>
                } />
                <Route path="/student/topics" element={
                    <ProtectedRoute requiredRoles={['STUDENT']}><TopicWorkflow /></ProtectedRoute>
                } />

                {/* ── Guide ── */}
                <Route path="/guide/dashboard" element={
                    <ProtectedRoute requiredRoles={['GUIDE']}><GuideDashboardNew /></ProtectedRoute>
                } />
                <Route path="/guide/groups" element={
                    <ProtectedRoute requiredRoles={['GUIDE']}><GuideGroups /></ProtectedRoute>
                } />
                <Route path="/guide/reviews" element={
                    <ProtectedRoute requiredRoles={['GUIDE']}><GuideReviews /></ProtectedRoute>
                } />
                <Route path="/guide/topics" element={
                    <ProtectedRoute requiredRoles={['GUIDE']}><GuideTopicApproval /></ProtectedRoute>
                } />

                {/* ── Coordinator ── */}
                <Route path="/coordinator/dashboard" element={
                    <ProtectedRoute requiredRoles={['COORDINATOR']}><CoordinatorDashboardNew /></ProtectedRoute>
                } />
                <Route path="/coordinator/allocations" element={
                    <ProtectedRoute requiredRoles={['COORDINATOR']}><CoordinatorAllocations /></ProtectedRoute>
                } />
                <Route path="/coordinator/users" element={
                    <ProtectedRoute requiredRoles={['COORDINATOR']}><CoordinatorUsers /></ProtectedRoute>
                } />
                <Route path="/coordinator/rubrics" element={
                    <ProtectedRoute requiredRoles={['COORDINATOR']}><CoordinatorRubrics /></ProtectedRoute>
                } />
                <Route path="/coordinator/schedules" element={
                    <ProtectedRoute requiredRoles={['COORDINATOR']}><CoordinatorSchedules /></ProtectedRoute>
                } />
                <Route path="/coordinator/announcements" element={
                    <ProtectedRoute requiredRoles={['COORDINATOR']}><CoordinatorAnnouncements /></ProtectedRoute>
                } />
                <Route path="/coordinator/topics" element={
                    <ProtectedRoute requiredRoles={['COORDINATOR']}>
                        <div style={{ padding: '50px', color: 'white', background: '#1a1a2e' }}>
                            <h1>Topic Approval - Under Maintenance</h1>
                            <p>This feature is temporarily disabled.</p>
                        </div>
                    </ProtectedRoute>
                } />
                <Route path="/coordinator/po-pso" element={
                    <ProtectedRoute requiredRoles={['COORDINATOR']}><POPSOMapping /></ProtectedRoute>
                } />
                <Route path="/coordinator/documents" element={
                    <ProtectedRoute requiredRoles={['COORDINATOR']}><DocumentManagement /></ProtectedRoute>
                } />

                {/* ── Committee ── */}
                <Route path="/committee/dashboard" element={
                    <ProtectedRoute requiredRoles={['COMMITTEE']}><CommitteeDashboard /></ProtectedRoute>
                } />
                <Route path="/committee/evaluations" element={
                    <ProtectedRoute requiredRoles={['COMMITTEE']}><CommitteeEvaluations /></ProtectedRoute>
                } />
                <Route path="/committee/results" element={
                    <ProtectedRoute requiredRoles={['COMMITTEE']}><CommitteeResults /></ProtectedRoute>
                } />
                <Route path="/committee/history" element={
                    <ProtectedRoute requiredRoles={['COMMITTEE']}><CommitteeHistoricSearch /></ProtectedRoute>
                } />
                <Route path="/committee/topics" element={
                    <ProtectedRoute requiredRoles={['COMMITTEE']}><CommitteeTopicApproval /></ProtectedRoute>
                } />

                {/* ── Shared (All Roles) ── */}
                <Route path="/notifications" element={
                    <ProtectedRoute requiredRoles={['STUDENT', 'GUIDE', 'COORDINATOR', 'COMMITTEE']}><Notifications /></ProtectedRoute>
                } />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
