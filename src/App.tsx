/**
 * CLUES Property Dashboard - Main App Component
 * Mobile-first routing and layout
 */

import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AnimatePresence } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import LoadingScreen from '@/components/ui/LoadingScreen';

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const PropertyList = lazy(() => import('@/pages/PropertyList'));
const PropertyDetail = lazy(() => import('@/pages/PropertyDetail'));
const AddProperty = lazy(() => import('@/pages/AddProperty'));
const Compare = lazy(() => import('@/pages/Compare'));
const Settings = lazy(() => import('@/pages/Settings'));

function App() {
  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/properties" element={<PropertyList />} />
            <Route path="/property/:id" element={<PropertyDetail />} />
            <Route path="/add" element={<AddProperty />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Suspense>
      </AnimatePresence>
    </Layout>
  );
}

export default App;
