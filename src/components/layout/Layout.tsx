/**
 * CLUES Property Dashboard - Main Layout
 * Mobile-first with bottom navigation
 */

import { ReactNode } from 'react';
import MobileNav from './MobileNav';
import CluesHeader from './CluesHeader';
import CluesFooter from './CluesFooter';
import QuantumBackground from '@/components/ui/QuantumBackground';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Quantum animated background */}
      <QuantumBackground />

      {/* CLUES Company Header */}
      <CluesHeader />

      {/* Main content area */}
      <main className="relative z-10 pb-20 md:pb-0 pt-safe flex-1">
        <div className="min-h-[calc(100dvh-80px)] md:min-h-screen">
          {children}
        </div>
      </main>

      {/* CLUES Company Footer */}
      <CluesFooter />

      {/* Mobile bottom navigation */}
      <MobileNav />
    </div>
  );
}
