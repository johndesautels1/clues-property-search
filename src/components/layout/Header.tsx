/**
 * CLUES Property Dashboard - Desktop Header
 * Only visible on larger screens
 */

import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  Building2,
  PlusCircle,
  GitCompare,
  Settings,
  Menu,
} from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: 'Dashboard' },
  { path: '/properties', icon: Building2, label: 'Properties' },
  { path: '/add', icon: PlusCircle, label: 'Add Property' },
  { path: '/compare', icon: GitCompare, label: 'Compare' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Header() {
  const location = useLocation();

  return (
    <header className="hidden md:block sticky top-0 z-50">
      <div className="glass-card border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <motion.div
                className="w-12 h-12 rounded-xl bg-gradient-quantum flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-quantum-black font-orbitron font-black text-xl">C</span>
              </motion.div>
              <div>
                <h1 className="font-orbitron font-bold text-xl text-gradient-quantum">
                  CLUES
                </h1>
                <p className="text-xs text-gray-500 uppercase tracking-widest">
                  Property Dashboard
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative px-4 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 ${
                      isActive
                        ? 'text-quantum-cyan'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="headerNavIndicator"
                        className="absolute inset-0 rounded-xl bg-quantum-cyan/10 border border-quantum-cyan/30"
                        initial={false}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                    <Icon className="w-5 h-5 relative z-10" />
                    <span className="relative z-10 font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User/Actions */}
            <div className="flex items-center gap-3">
              <button className="btn-glass px-4 py-2 text-sm">
                Connect to CLUES
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
