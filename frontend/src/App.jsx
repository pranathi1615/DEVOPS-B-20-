import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Layout
import DashboardLayout from './components/layout/DashboardLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import AuditLogs from './pages/admin/AuditLogs';

import CoordinatorDashboard from './pages/coordinator/CoordinatorDashboard';
import ExamManagement from './pages/coordinator/ExamManagement';
import ExamScheduling from './pages/coordinator/ExamScheduling';

import InvigilatorDashboard from './pages/invigilator/InvigilatorDashboard';
import LiveInvigilation from './pages/invigilator/LiveInvigilation';

import StudentDashboard from './pages/student/StudentDashboard';
import StudentExamInterface from './pages/student/StudentExamInterface';
import ExamConfirmation from './pages/student/ExamConfirmation';

import IncidentManagement from './pages/incidents/IncidentManagement';

import ExamSummaryReport from './pages/reports/ExamSummaryReport';
import AttendanceReport from './pages/reports/AttendanceReport';
import IncidentRegisterReport from './pages/reports/IncidentRegisterReport';
import SubmissionStatusReport from './pages/reports/SubmissionStatusReport';

import ProfileSettings from './pages/shared/ProfileSettings';
import NotFound from './pages/NotFound';

// Protected Route Guard
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to user's home dashboard
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'coordinator':
        return <Navigate to="/coordinator/dashboard" replace />;
      case 'invigilator':
        return <Navigate to="/invigilator/dashboard" replace />;
      case 'student':
      default:
        return <Navigate to="/student/dashboard" replace />;
    }
  }

  return children;
};

// Root Redirect Helper
const RootRedirect = () => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'coordinator':
      return <Navigate to="/coordinator/dashboard" replace />;
    case 'invigilator':
      return <Navigate to="/invigilator/dashboard" replace />;
    case 'student':
    default:
      return <Navigate to="/student/dashboard" replace />;
  }
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Login Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Standalone Student Exam Screen (Distraction-free) */}
            <Route
              path="/student/exam/:examId"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentExamInterface />
                </ProtectedRoute>
              }
            />

            {/* Main Application Shell with Sidebar and Navbar */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              {/* Index Redirect */}
              <Route index element={<RootRedirect />} />

              {/* Admin Routes */}
              <Route
                path="admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/users"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/audit-logs"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AuditLogs />
                  </ProtectedRoute>
                }
              />

              {/* Coordinator Routes */}
              <Route
                path="coordinator/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                    <CoordinatorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="coordinator/exams"
                element={
                  <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                    <ExamManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="coordinator/scheduling"
                element={
                  <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                    <ExamScheduling />
                  </ProtectedRoute>
                }
              />

              {/* Invigilator Routes */}
              <Route
                path="invigilator/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['invigilator', 'admin', 'coordinator']}>
                    <InvigilatorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="invigilator/live"
                element={
                  <ProtectedRoute allowedRoles={['invigilator', 'admin', 'coordinator']}>
                    <LiveInvigilation />
                  </ProtectedRoute>
                }
              />

              {/* Student Routes */}
              <Route
                path="student/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="student/exam-confirmation/:sessionId"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <ExamConfirmation />
                  </ProtectedRoute>
                }
              />

              {/* Incidents Module */}
              <Route
                path="incidents"
                element={
                  <ProtectedRoute allowedRoles={['invigilator', 'admin', 'coordinator']}>
                    <IncidentManagement />
                  </ProtectedRoute>
                }
              />

              {/* All 4 Mandatory Reports */}
              <Route
                path="reports/exam-summary"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'coordinator', 'invigilator']}>
                    <ExamSummaryReport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reports/attendance"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'coordinator', 'invigilator']}>
                    <AttendanceReport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reports/incidents"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'coordinator', 'invigilator']}>
                    <IncidentRegisterReport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reports/submissions"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'coordinator', 'invigilator']}>
                    <SubmissionStatusReport />
                  </ProtectedRoute>
                }
              />

              {/* Profile & Settings */}
              <Route path="profile" element={<ProfileSettings />} />

              {/* Fallback Catch-All */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
