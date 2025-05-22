import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
// Import routing and error boundary
import AppRoutes from './routes/AppRoutes';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  // Smooth scroll behavior
  useEffect(() => {
    document.body.style.scrollBehavior = 'smooth';
  }, []);

  // Loading state for app initialization
  const [isAppLoading, setIsAppLoading] = useState(true);

  useEffect(() => {
    console.log('⏳ Starting app initialization...');
    // Simulate app initialization (e.g., auth check)
    const timer = setTimeout(() => {
      console.log('✅ App initialization complete, setting isAppLoading to false');
      setIsAppLoading(false);
    }, 500); // Adjust delay as needed

    return () => {
      console.log('🛑 Cleaning up app initialization timer');
      clearTimeout(timer);
    };
  }, []);

  return (
    <AuthProvider>
      <Router>
        <ErrorBoundary>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(8px)',
                color: '#1F2937',
                boxShadow:
                  '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                borderRadius: '12px',
                padding: '1rem',
                transition: 'all 0.3s ease',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#FFFFFF',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#FFFFFF',
                },
              },
            }}
          />
          {isAppLoading ? (
            <motion.div
              className="min-h-screen flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-2xl font-semibold text-gray-600">
                Loading...
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="min-h-screen bg-gradient-to-br from-gray-50 to-white"
            >
              <AppRoutes />
            </motion.div>
          )}
        </ErrorBoundary>
      </Router>
    </AuthProvider>
  );
}

export default App;