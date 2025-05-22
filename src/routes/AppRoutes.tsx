import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Layouts
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminLeads from '../pages/admin/AdminLeads';
import AdminReports from '../pages/admin/AdminReports';
import AdminCalendar from '../pages/admin/AdminCalendar';

// BDA Pages
import BdaDashboard from '../pages/bda/BdaDashboard';
import BdaLeads from '../pages/bda/BdaLeads';
import BdaCalendar from '../pages/bda/BdaCalendar';
import BdaListPage from '../pages/bda/BdaListPage';   

// Protected route wrapper component
interface ProtectedRouteProps {
  children: JSX.Element;
  requiredRole?: 'admin' | 'bda' | 'any';
}

const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-100">
    <div className="text-center">
      <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600 font-medium">Loading your dashboard...</p>
    </div>
  </div>
);

const UnauthorizedPage = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-100">
    <div className="text-center">
      <h1 className="text-2xl font-semibold text-gray-800 mb-2">Unauthorized Access</h1>
      <p className="text-gray-600">You do not have permission to access this page.</p>
    </div>
  </div>
);

const NotFoundPage = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-100">
    <div className="text-center">
      <h1 className="text-2xl font-semibold text-gray-800 mb-2">404 - Page Not Found</h1>
      <p className="text-gray-600">The page you are looking for does not exist.</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children, requiredRole = 'any' }: ProtectedRouteProps) => {
  const { isAuthenticated, isAdmin, isBDA, loading } = useAuth();
  
  console.log('🔒 ProtectedRoute: Checking auth state...', {
    isAuthenticated,
    isAdmin,
    isBDA,
    loading,
    requiredRole,
    currentPath: window.location.pathname,
  });

  if (loading) {
    console.log('🔒 ProtectedRoute: Still loading, showing LoadingScreen');
    return <LoadingScreen />;
  }
  
  if (!isAuthenticated) {
    console.log('🔒 ProtectedRoute: User not authenticated, redirecting to /login');
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole === 'admin' && !isAdmin) {
    console.log('🔒 ProtectedRoute: User is not admin, redirecting to /unauthorized');
    return <Navigate to="/unauthorized" replace />;
  }
  
  if (requiredRole === 'bda' && !isBDA) {
    console.log('🔒 ProtectedRoute: User is not BDA, redirecting to /unauthorized');
    return <Navigate to="/unauthorized" replace />;
  }
  
  console.log('🔒 ProtectedRoute: Access granted, rendering children');
  return children;
};

const AppRoutes = () => {
  const { isAuthenticated, isAdmin, isBDA, loading } = useAuth();
  
  console.log('🛤️ AppRoutes: Rendering with auth state...', {
    isAuthenticated,
    isAdmin,
    isBDA,
    loading,
    currentPath: window.location.pathname,
  });

  if (loading) {
    console.log('🛤️ AppRoutes: Still loading, showing LoadingScreen');
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Redirect from root based on auth status and role */}
      <Route 
        path="/" 
        element={
          (() => {
            console.log('🛤️ Route: / - Determining redirect...');
            if (isAuthenticated) {
              if (isBDA) {
                console.log('🛤️ Route: / - User is BDA, redirecting to /bda/dashboard');
                return <Navigate to="/bda/dashboard" replace />;
              }
              if (isAdmin) {
                console.log('🛤️ Route: / - User is admin, redirecting to /admin/dashboard');
                return <Navigate to="/admin/dashboard" replace />;
              }
              console.log('🛤️ Route: / - User has no specific role, redirecting to /unauthorized');
              return <Navigate to="/unauthorized" replace />;
            }
            console.log('🛡️ Route: / - User not authenticated, redirecting to /login');
            return <Navigate to="/login" replace />;
          })()
        } 
      />
      
      {/* Unauthorized route */}
      <Route 
        path="/unauthorized" 
        element={
          (() => {
            console.log('🛡️ Route: /unauthorized - Rendering UnauthorizedPage');
            return <UnauthorizedPage />;
          })()
        } 
      />
      
      {/* Auth routes */}
      <Route 
        path="/login" 
        element={
          (() => {
            console.log('🛤️ Route: /login - Rendering LoginPage');
            return (
              <AuthLayout>
                <LoginPage />
              </AuthLayout>
            );
          })()
        } 
      />
      
      {/* Admin routes */}
      <Route 
        path="/admin/dashboard" 
        element={
          <ProtectedRoute requiredRole="admin">
            <DashboardLayout>
              <AdminDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin/leads" 
        element={
          <ProtectedRoute requiredRole="admin">
            <DashboardLayout>
              <AdminLeads />
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin/reports" 
        element={
          <ProtectedRoute requiredRole="admin">
            <DashboardLayout>
              <AdminReports />
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin/calendar" 
        element={
          <ProtectedRoute requiredRole="admin">
            <DashboardLayout>
              <AdminCalendar />
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      
      {/* BDA routes */}
      <Route 
        path="/bda/dashboard" 
        element={
          <ProtectedRoute requiredRole="bda">
            <DashboardLayout>
              <BdaDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/bda/leads" 
        element={
          <ProtectedRoute requiredRole="bda">
            <DashboardLayout>
              <BdaLeads />
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/bda/calendar" 
        element={
          <ProtectedRoute requiredRole="bda">
            <DashboardLayout>
              <BdaCalendar />
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/bda/list" 
        element={
          <ProtectedRoute requiredRole="bda">
            <DashboardLayout>
              <BdaListPage />
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      
      {/* Catch-all route */}
      <Route 
        path="*" 
        element={
          (() => {
            console.log('🛤️ Route: * - No matching route, rendering NotFoundPage');
            return <NotFoundPage />;
          })()
        } 
      />
    </Routes>
  );
};

export default AppRoutes;