import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/AuthContext';
import LoginPage from './modules/auth/LoginPage';
import RegisterPage from './modules/auth/RegisterPage';
import Dashboard from './pages/Dashboard';
import LibraryKiosk from './modules/sessions/LibraryKiosk';
import SessionManagement from './modules/sessions/SessionManagement';
import BookCirculation from './modules/issues/BookCirculation';
import FineManagement from './modules/fines/FineManagement';
import StudentSessions from './modules/sessions/StudentSessions';
import StudentLoans from './modules/issues/StudentLoans';
import AnalyticsPage from './modules/analytics/AnalyticsPage';
import AdminManagement from './modules/admin/AdminManagement';
import BookCatalog from './modules/books/BookCatalog';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/books" element={<BookCatalog />} />
          <Route path="/kiosk" element={<LibraryKiosk />} />
          <Route
            path="/sessions"
            element={
              <ProtectedRoute>
                <SessionManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/issues"
            element={
              <ProtectedRoute>
                <BookCirculation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fines"
            element={
              <ProtectedRoute>
                <FineManagement />
              </ProtectedRoute>
            }
          />
          {/* Student Specific Routes */}
          <Route
            path="/student-sessions"
            element={
              <ProtectedRoute>
                <StudentSessions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-loans"
            element={
              <ProtectedRoute>
                <StudentLoans />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminManagement />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
