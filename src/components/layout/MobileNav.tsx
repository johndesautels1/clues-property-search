/**
 * CLUES Property Dashboard - Mobile Bottom Navigation
 * Touch-friendly, haptic feedback enabled
 */

import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  Building2,
  Search,
  GitCompare,
  User,
} from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

interface NavItem {
  path: string;
  icon: typeof Home;
  label: string;
}

const navItems: NavItem[] = [
  { path: '/', icon: Home, label: 'Home/Property Analytics' },
  { path: '/properties', icon: Building2, label: 'My Saved Properties' },
  { path: '/search', icon: Search, label: 'Search' },
  { path: '/compare', icon: GitCompare, label: 'Advanced Comparison Analytics' },
  { path: '/settings', icon: User, label: 'Account' },
];

export default function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavClick = async (path: string) => {
    // Haptic feedback on native platforms
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (e) {
        // Haptics not available
      }
    }
    navigate(path);
  };

  return (
    <nav className="nav-mobile md:hidden">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className={`nav-item flex-1 ${isActive ? 'active' : 'text-gray-500'}`}
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="relative"
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="navIndicator"
                    className="absolute -inset-2 rounded-xl bg-quantum-cyan/10"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}

                <Icon
                  className={`nav-icon w-6 h-6 relative z-10 transition-colors ${
                    isActive ? 'text-quantum-cyan' : ''
                  }`}
                />
              </motion.div>

              <span className={`text-xs font-medium mt-1 ${
                isActive ? 'text-quantum-cyan' : ''
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
