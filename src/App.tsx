/**
 * CLUES Property Dashboard - Main App Component
 * Mobile-first routing with authentication
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AnimatePresence } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { useIsAuthenticated } from '@/store/authStore';

// Lazy load pages for code splitting
const Login = lazy(() => import('@/pages/Login'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const PropertyList = lazy(() => import('@/pages/PropertyList'));
const PropertyDetail = lazy(() => import('@/pages/PropertyDetail'));
const AddProperty = lazy(() => import('@/pages/AddProperty'));
const SearchProperty = lazy(() => import('@/pages/SearchProperty'));
const Compare = lazy(() => import('@/pages/Compare'));
const Settings = lazy(() => import('@/pages/Settings'));

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useIsAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public route wrapper (redirects to home if already logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useIsAuthenticated();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  const isAuthenticated = useIsAuthenticated();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Public Route - Login */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          {/* Protected Routes - Wrapped in Layout */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/properties" element={<PropertyList />} />
                    <Route path="/property/:id" element={<PropertyDetail />} />
                    <Route path="/add" element={<AddProperty />} />
                    <Route path="/search" element={<SearchProperty />} />
                    <Route path="/compare" element={<Compare />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

export default App;
