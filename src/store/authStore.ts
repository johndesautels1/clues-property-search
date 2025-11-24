/**
 * CLUES Property Dashboard - Authentication Store
 * Two roles: admin (Agent/Broker) and user (Buyer/Seller/Client)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Role types - ONLY 'admin' and 'user' to avoid confusion
export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  email?: string;
  createdAt: string;
}

interface AuthState {
  // Current user
  currentUser: User | null;
  isAuthenticated: boolean;

  // All registered users (localStorage as temp DB)
  users: User[];

  // Actions
  login: (username: string, password: string, role: UserRole) => { success: boolean; error?: string };
  logout: () => void;
  register: (username: string, password: string, name: string, role: UserRole, email?: string) => { success: boolean; error?: string };
  isAdmin: () => boolean;
  isUser: () => boolean;
}

// Demo users for testing
const demoUsers: Array<User & { password: string }> = [
  {
    id: 'admin-1',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    name: 'John Broker',
    email: 'admin@clues.ai',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-1',
    username: 'buyer',
    password: 'buyer123',
    role: 'user',
    name: 'Jane Buyer',
    email: 'buyer@email.com',
    createdAt: new Date().toISOString(),
  },
];

// Store passwords separately (in real app, this would be hashed in DB)
const passwordStore: Record<string, string> = {
  'admin': 'admin123',
  'buyer': 'buyer123',
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      users: demoUsers.map(({ password, ...user }) => user),

      login: (username, password, role) => {
        const storedPassword = passwordStore[username];

        if (!storedPassword) {
          return { success: false, error: 'User not found' };
        }

        if (storedPassword !== password) {
          return { success: false, error: 'Invalid password' };
        }

        const user = get().users.find(u => u.username === username);

        if (!user) {
          return { success: false, error: 'User not found' };
        }

        if (user.role !== role) {
          return { success: false, error: `This account is not registered as ${role === 'admin' ? 'an Admin' : 'a User'}` };
        }

        set({ currentUser: user, isAuthenticated: true });
        return { success: true };
      },

      logout: () => {
        set({ currentUser: null, isAuthenticated: false });
      },

      register: (username, password, name, role, email) => {
        const existingUser = get().users.find(u => u.username === username);

        if (existingUser) {
          return { success: false, error: 'Username already exists' };
        }

        const newUser: User = {
          id: `${role}-${Date.now()}`,
          username,
          role,
          name,
          email,
          createdAt: new Date().toISOString(),
        };

        // Store password (in real app, hash this)
        passwordStore[username] = password;

        set(state => ({
          users: [...state.users, newUser],
          currentUser: newUser,
          isAuthenticated: true,
        }));

        return { success: true };
      },

      isAdmin: () => get().currentUser?.role === 'admin',
      isUser: () => get().currentUser?.role === 'user',
    }),
    {
      name: 'clues-auth-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        users: state.users,
      }),
    }
  )
);

// Selector hooks
export const useCurrentUser = () => useAuthStore(state => state.currentUser);
export const useIsAuthenticated = () => useAuthStore(state => state.isAuthenticated);
export const useIsAdmin = () => useAuthStore(state => state.currentUser?.role === 'admin');
export const useIsUser = () => useAuthStore(state => state.currentUser?.role === 'user');
