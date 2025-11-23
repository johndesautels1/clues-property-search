/**
 * CLUES Property Dashboard - Main Layout
 * Mobile-first with bottom navigation
 */

import { ReactNode } from 'react';
import MobileNav from './MobileNav';
import Header from './Header';
import QuantumBackground from '@/components/ui/QuantumBackground';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Quantum animated background */}
      <QuantumBackground />

      {/* Header - hidden on mobile, visible on desktop */}
      <Header />

      {/* Main content area */}
      <main className="relative z-10 pb-20 md:pb-0 pt-safe">
        <div className="min-h-[calc(100dvh-80px)] md:min-h-screen">
          {children}
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <MobileNav />
    </div>
  );
}
