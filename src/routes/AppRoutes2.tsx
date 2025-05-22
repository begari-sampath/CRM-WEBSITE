import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Layouts
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';

// Pages
import LoginPage from '../pages/auth/LoginPage';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminLeads from '../pages/admin/AdminLeads';
import AdminCalendar from '../pages/admin/AdminCalendar';
import BdaDashboard from '../pages/bda/BdaDashboard'; // Using simplified version for debugging
import BdaLeads from '../pages/bda/BdaLeads';
import BdaCalendar from '../pages/bda/BdaCalendar';

import AdminReports from '../pages/admin/AdminReports';

// Simple UnauthorizedPage component
const UnauthorizedPage = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-100">
    <div className="text-center">
      <h1 className="text-2xl font-semibold text-gray-800 mb-2">403 - Unauthorized</h1>
      <p className="text-gray-600">You don't have permission to access this page.</p>
    </div>
  </div>
);

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
  console.log('🚀 AppRoutes: Rendering...');
  const { isAuthenticated, isAdmin, isBDA, loading, role, user } = useAuth();

  // Log the current auth state for debugging
  React.useEffect(() => {
    console.log('🔍 AppRoutes: Auth state updated', {
      isAuthenticated,
      isAdmin,
      isBDA,
      role,
      loading,
      hasUser: !!user,
      currentPath: window.location.pathname,
      timestamp: new Date().toISOString()
    });
  }, [isAuthenticated, isAdmin, isBDA, role, loading, user]);

  console.log('🔄 AppRoutes: Current route state', {
    path: window.location.pathname,
    isAuthenticated,
    isAdmin,
    isBDA,
    role,
    loading
  });

  // Move useMemo before any conditional return
  const rootRedirectElement = React.useMemo(() => {
    console.log('🌐 Root path handler:', { isBDA, isAdmin, role, currentPath: window.location.pathname });
    // If already on a valid dashboard path, render the appropriate dashboard
    if (window.location.pathname.startsWith('/bda/') && isBDA) {
      console.log('Already on BDA dashboard, rendering BdaDashboard');
      return <Navigate to="/bda/dashboard" replace />;
    }
    if (window.location.pathname.startsWith('/admin/') && isAdmin) {
      console.log('Already on admin dashboard, rendering AdminDashboard');
      return <Navigate to="/admin/dashboard" replace />;
    }
    // Redirect based on role
    if (isBDA) {
      console.log('➡️ Redirecting to BDA dashboard');
      return <Navigate to="/bda/dashboard" replace />;
    }
    if (isAdmin) {
      console.log('➡️ Redirecting to Admin dashboard');
      return <Navigate to="/admin/dashboard" replace />;
    }
    console.log('➡️ No valid role, checking authentication...');
    if (isAuthenticated) {
      console.warn('⚠️ Authenticated but no valid role, redirecting to unauthorized');
      return <Navigate to="/unauthorized" replace />;
    }
    console.log('➡️ Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }, [isBDA, isAdmin, isAuthenticated, role]);

  // Use variables for conditional rendering
  let renderContent = null;
  if (loading) {
    console.log('⏳ AppRoutes: Loading - Auth check in progress');
    renderContent = <LoadingScreen />;
  } else if (!user) {
    console.log('🛤️ AppRoutes: Not authenticated (failsafe), showing login');
    renderContent = (
      <Routes>
        <Route path="/login" element={
          <AuthLayout>
            <LoginPage />
          </AuthLayout>
        } />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  } else if (isAuthenticated && !role) {
    console.log('⏳ AppRoutes: Authenticated but role is not loaded yet. Showing loading screen.');
    renderContent = <LoadingScreen />;
  } else if (role !== 'admin' && role !== 'bda') {
    console.warn('⚠️ AppRoutes: Invalid role detected:', role);
    renderContent = <Navigate to="/unauthorized" replace />;
  } else {
    // If authenticated and role is loaded, show protected routes
    console.log('✅ AppRoutes: Rendering protected routes', { 
      isAuthenticated, 
      isAdmin, 
      isBDA, 
      role,
      currentPath: window.location.pathname
    });
    renderContent = (
      <Routes>
        {/* Root route redirects based on role */}
        <Route path="/" element={rootRedirectElement} />
        
        {/* Auth route - redirect to dashboard if already authenticated */}
        <Route path="/login" element={
          isAuthenticated ? (
            isBDA ? (
              <Navigate to="/bda/dashboard" replace />
            ) : isAdmin ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <Navigate to="/unauthorized" replace />
            )
          ) : (
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          )
        } />
        
        {/* Unauthorized route */}
        <Route path="/unauthorized" element={
          <AuthLayout>
            <UnauthorizedPage />
          </AuthLayout>
        } />

        {/* Admin routes */}
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="admin">
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="leads" element={<AdminLeads />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="calendar" element={<AdminCalendar />} />
          {/* <Route path="*" element={<Navigate to="dashboard" replace />} /> */}
        </Route>
        
        {/* BDA routes */}
        <Route path="/bda" element={
          <ProtectedRoute requiredRole="bda">
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<BdaDashboard />} />
          <Route path="leads" element={<BdaLeads />} />
          <Route path="calendar" element={<BdaCalendar />} />
          {/* <Route path="*" element={<Navigate to="dashboard" replace />} /> */}
        </Route>
        
        {/* Catch all other routes */}
        <Route path="*" element={
          isBDA ? (
            <Navigate to="/bda/dashboard" replace />
          ) : isAdmin ? (
            <Navigate to="/admin/dashboard" replace />
          ) : isAuthenticated ? (
            <Navigate to="/unauthorized" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } />
      </Routes>
    );
  }

  return renderContent;
};

// Export the AppRoutes component as default
const ExportedAppRoutes = AppRoutes;
export default ExportedAppRoutes;
