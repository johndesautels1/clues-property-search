/**
 * CLUES Property Dashboard - Login Page
 * Admin (Agent/Broker) and User (Buyer/Seller) authentication
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  User,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { useAuthStore, type UserRole } from '@/store/authStore';

type AuthMode = 'login' | 'register';

export default function Login() {
  const navigate = useNavigate();
  const { login, register } = useAuthStore();

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (!selectedRole) {
      setError('Please select a role');
      setIsLoading(false);
      return;
    }

    if (authMode === 'login') {
      const result = login(username, password, selectedRole);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'Login failed');
      }
    } else {
      if (!name) {
        setError('Please enter your name');
        setIsLoading(false);
        return;
      }
      const result = register(username, password, name, selectedRole, email || undefined);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'Registration failed');
      }
    }

    setIsLoading(false);
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError('');
  };

  return (
    <div className="min-h-screen bg-quantum-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-quantum-cyan/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-quantum-purple/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-quantum-cyan to-quantum-purple mb-4"
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-quantum-cyan to-quantum-purple bg-clip-text text-transparent">
            CLUES™
          </h1>
          <p className="text-gray-400 mt-2">Quantum Property Intelligence</p>
        </div>

        {/* Role Selection */}
        <AnimatePresence mode="wait">
          {!selectedRole ? (
            <motion.div
              key="role-select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <p className="text-center text-gray-300 mb-6">Select your account type</p>

              {/* Admin Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRoleSelect('admin')}
                className="w-full p-6 glass-card border-2 border-transparent hover:border-quantum-cyan transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-quantum-cyan/20 text-quantum-cyan group-hover:bg-quantum-cyan group-hover:text-quantum-black transition-colors">
                    <Shield className="w-8 h-8" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-white">Admin</h3>
                    <p className="text-gray-400 text-sm">Agent / Broker Access</p>
                  </div>
                </div>
                <p className="text-gray-500 text-xs mt-3 text-left">
                  Full access to all 138 fields, data sources, and analytics
                </p>
              </motion.button>

              {/* User Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRoleSelect('user')}
                className="w-full p-6 glass-card border-2 border-transparent hover:border-quantum-purple transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-quantum-purple/20 text-quantum-purple group-hover:bg-quantum-purple group-hover:text-white transition-colors">
                    <User className="w-8 h-8" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-white">User</h3>
                    <p className="text-gray-400 text-sm">Buyer / Seller Access</p>
                  </div>
                </div>
                <p className="text-gray-500 text-xs mt-3 text-left">
                  Search properties and view all 138 data fields
                </p>
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="auth-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Back Button & Role Badge */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setSelectedRole(null)}
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  ← Change Role
                </button>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  selectedRole === 'admin'
                    ? 'bg-quantum-cyan/20 text-quantum-cyan'
                    : 'bg-quantum-purple/20 text-quantum-purple'
                }`}>
                  {selectedRole === 'admin' ? 'Admin' : 'User'}
                </div>
              </div>

              {/* Auth Mode Tabs */}
              <div className="flex rounded-xl overflow-hidden border border-white/10 mb-6">
                <button
                  onClick={() => setAuthMode('login')}
                  className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                    authMode === 'login'
                      ? 'bg-white/10 text-white'
                      : 'text-gray-500 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setAuthMode('register')}
                  className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                    authMode === 'register'
                      ? 'bg-white/10 text-white'
                      : 'text-gray-500 hover:text-white'
                  }`}
                >
                  Register
                </button>
              </div>

              {/* Login/Register Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {authMode === 'register' && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Smith"
                        className="input-glass pl-11"
                        required={authMode === 'register'}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Username</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={authMode === 'login' ? 'admin or buyer' : 'Choose a username'}
                      className="input-glass pl-11"
                      required
                    />
                  </div>
                </div>

                {authMode === 'register' && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Email (Optional)</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="input-glass pl-11"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={authMode === 'login' ? 'admin123 or buyer123' : 'Create a password'}
                      className="input-glass pl-11 pr-11"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-xl"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-4 rounded-xl font-semibold transition-all ${
                    selectedRole === 'admin'
                      ? 'bg-gradient-to-r from-quantum-cyan to-quantum-blue text-quantum-black hover:shadow-lg hover:shadow-quantum-cyan/30'
                      : 'bg-gradient-to-r from-quantum-purple to-quantum-pink text-white hover:shadow-lg hover:shadow-quantum-purple/30'
                  } disabled:opacity-50`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
                      />
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      {authMode === 'login' ? 'Sign In' : 'Create Account'}
                      <CheckCircle className="w-5 h-5" />
                    </span>
                  )}
                </button>
              </form>

              {/* Demo Credentials Hint */}
              {authMode === 'login' && (
                <div className="mt-6 p-4 bg-white/5 rounded-xl text-center">
                  <p className="text-gray-500 text-xs mb-2">Demo Credentials</p>
                  <p className="text-gray-400 text-sm">
                    Admin: <code className="text-quantum-cyan">admin / admin123</code>
                  </p>
                  <p className="text-gray-400 text-sm">
                    User: <code className="text-quantum-purple">buyer / buyer123</code>
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
