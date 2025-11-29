/**
 * CLUES Property Dashboard - Desktop Header
 * With user info and logout
 */

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  Building2,
  PlusCircle,
  Search,
  GitCompare,
  Settings,
  LogOut,
  Shield,
  User,
  LayoutDashboard,
  Sparkles,
} from 'lucide-react';
import { useAuthStore, useCurrentUser, useIsAdmin } from '@/store/authStore';

const navItems = [
  { path: '/', icon: Home, label: 'Home/Property Analytics' },
  { path: '/properties', icon: Building2, label: 'My Saved Properties' },
  { path: '/search', icon: Search, label: 'Search Property' },
  { path: '/add', icon: PlusCircle, label: 'Add Property' },
  { path: '/compare', icon: GitCompare, label: 'Advanced Comparison Analytics' },
  { path: '/broker', icon: LayoutDashboard, label: 'Broker Executive Dashboard' },
  { path: '/perplexity', icon: Sparkles, label: 'Perplexity Analysis' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const isAdmin = useIsAdmin();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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

            {/* User Info & Logout */}
            <div className="flex items-center gap-3">
              {/* Role Badge */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                isAdmin
                  ? 'bg-quantum-cyan/20 text-quantum-cyan'
                  : 'bg-quantum-purple/20 text-quantum-purple'
              }`}>
                {isAdmin ? (
                  <Shield className="w-4 h-4" />
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span className="text-sm font-semibold">
                  {isAdmin ? 'Admin' : 'User'}
                </span>
              </div>

              {/* User Name */}
              <span className="text-gray-300 text-sm">
                {currentUser?.name}
              </span>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
