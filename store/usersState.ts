import { create } from 'zustand';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://localhost:7190';
const USERS_API = `${API_BASE}/Users`;

const getAuthHeaders = () => {
  const headers: Record<string, string> = {};
  if (typeof window === 'undefined') return headers;
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

export type UserRole = 'Admin' | 'SocialMediaManager' | 'GeneralManager';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  name?: string;
  lastName?: string;
  city?: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserPayload {
  email?: string;
  name?: string;
  lastName?: string;
  city?: string;
}

interface UserStore {
  users: User[];
  filteredUsers: User[];
  query: string;
  setQuery: (q: string) => void;
  setSelectedUser: (user: User) => void;
  fetchUsers: (role?: string) => Promise<void>;
  fetchUser: (id: string) => Promise<User | null>;
  createUser: (payload: CreateUserPayload) => Promise<void>;
  updateUser: (id: number, payload: UpdateUserPayload) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
  changeRole: (id: number, role: UserRole) => Promise<void>;
}

function filterUsersByQuery(users: User[], query: string): User[] {
  const q = query.toLowerCase().trim();
  if (!q) return users;
  return users.filter(
    (u) =>
      u.email?.toLowerCase().includes(q) ||
      u.name?.toLowerCase().includes(q) ||
      u.lastName?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q) ||
      u.city?.toLowerCase().includes(q)
  );
}

export const useUserStore = create<UserStore>((set, get) => ({
  users: [],
  filteredUsers: [],
  query: '',

  setQuery: (q) => {
    const { users } = get();
    set({ query: q, filteredUsers: filterUsersByQuery(users, q) });
  },

  setSelectedUser: (user) => set({}),

  fetchUsers: async (role?: string) => {
    const url = role ? `${USERS_API}?role=${encodeURIComponent(role)}` : USERS_API;
    const res = await fetch(url, {
      cache: 'no-store',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      if (res.status === 401) throw new Error('Unauthorized: please sign in again.');
      throw new Error('Failed to fetch users');
    }
    const data: User[] = await res.json();
    const query = get().query;
    set({ users: data, filteredUsers: filterUsersByQuery(data, query) });
  },

  fetchUser: async (id: string) => {
    const res = await fetch(`${USERS_API}/${id}`, {
      cache: 'no-store',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      if (res.status === 401) throw new Error('Unauthorized: please sign in again.');
      if (res.status === 404) return null;
      throw new Error('Failed to fetch user');
    }
    return res.json();
  },

  createUser: async (payload: CreateUserPayload) => {
    const res = await fetch(USERS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      if (res.status === 401) throw new Error('Unauthorized: please sign in again.');
      throw new Error('Failed to create user');
    }
    const body = await res.json();
    const created: User = body.user ?? body;
    const users = [...get().users, created];
    const query = get().query;
    set({ users, filteredUsers: filterUsersByQuery(users, query) });
  },

  updateUser: async (id, payload) => {
    const res = await fetch(`${USERS_API}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ id, ...payload }),
    });
    if (!res.ok) {
      if (res.status === 401) throw new Error('Unauthorized: please sign in again.');
      throw new Error('Failed to update user');
    }
    const updated: User = await res.json();
    const users = get().users.map((u) => (u.id === id ? updated : u));
    const query = get().query;
    set({ users, filteredUsers: filterUsersByQuery(users, query) });
  },

  deleteUser: async (id) => {
    const res = await fetch(`${USERS_API}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      if (res.status === 401) throw new Error('Unauthorized: please sign in again.');
      throw new Error('Failed to delete user');
    }
    const users = get().users.filter((u) => u.id !== id);
    const query = get().query;
    set({ users, filteredUsers: filterUsersByQuery(users, query) });
  },

  changeRole: async (id, role) => {
    const res = await fetch(`${USERS_API}/${id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      if (res.status === 401) throw new Error('Unauthorized: please sign in again.');
      throw new Error('Failed to change role');
    }
    const updated: User = await res.json();
    const users = get().users.map((u) => (u.id === id ? updated : u));
    const query = get().query;
    set({ users, filteredUsers: filterUsersByQuery(users, query) });
  },
}));
