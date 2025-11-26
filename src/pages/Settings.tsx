/**
 * CLUES Property Dashboard - Settings Page
 */

import { motion } from 'framer-motion';
import {
  Database,
  Key,
  Palette,
  Bell,
  Link2,
  ChevronRight,
} from 'lucide-react';

export default function Settings() {
  return (
    <motion.div
      className="px-4 py-6 md:px-8 md:py-10 max-w-2xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="mb-8">
        <h1 className="font-orbitron text-2xl md:text-3xl font-bold text-gradient-quantum mb-2">
          Settings
        </h1>
        <p className="text-gray-400">
          Configure your dashboard
        </p>
      </div>

      <div className="space-y-4">
        {/* Database Connection */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-quantum-cyan/20 flex items-center justify-center">
                <Database className="w-5 h-5 text-quantum-cyan" />
              </div>
              <div>
                <p className="font-semibold text-white">Database</p>
                <p className="text-xs text-gray-500">PostgreSQL connection</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-quantum-green">Connected</span>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </div>
          </div>
        </div>

        {/* API Keys */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-quantum-purple/20 flex items-center justify-center">
                <Key className="w-5 h-5 text-quantum-purple" />
              </div>
              <div>
                <p className="font-semibold text-white">API Keys</p>
                <p className="text-xs text-gray-500">LLM providers</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </div>
        </div>

        {/* CLUES Integration */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-quantum-blue/20 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-quantum-blue" />
              </div>
              <div>
                <p className="font-semibold text-white">CLUES Quantum</p>
                <p className="text-xs text-gray-500">Parent app integration</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-quantum-gold">Not Connected</span>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Theme */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-quantum-pink/20 flex items-center justify-center">
                <Palette className="w-5 h-5 text-quantum-pink" />
              </div>
              <div>
                <p className="font-semibold text-white">Appearance</p>
                <p className="text-xs text-gray-500">Quantum Dark theme</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </div>
        </div>

        {/* Notifications */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-quantum-green/20 flex items-center justify-center">
                <Bell className="w-5 h-5 text-quantum-green" />
              </div>
              <div>
                <p className="font-semibold text-white">Notifications</p>
                <p className="text-xs text-gray-500">Push & email alerts</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Version Info */}
      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>CLUES Property Dashboard v1.0.0</p>
        <p className="text-xs mt-1">Built for CLUES Quantum Intelligence</p>
      </div>
    </motion.div>
  );
}
