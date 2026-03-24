import { create } from 'zustand';
import { apiFetch } from '@/lib/apiClient';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://localhost:7190';
const USERS_API = `${API_BASE}/Users`;
const ROLES_API = `${API_BASE}/Roles`;

const getAuthHeaders = () => {
  const headers: Record<string, string> = {};
  if (typeof window === 'undefined') return headers;
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

export type UserRole = string;

export interface Role {
  id: number;
  name: string;
}

export interface User {
  id: number;
  phoneNumber: string;
  role: UserRole;
  name?: string;
  lastName?: string;
  city?: string;
}

export interface CreateUserPayload {
  name: string;
  phoneNumber: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserPayload {
  phoneNumber?: string;
  name?: string;
  lastName?: string;
  city?: string;
}

interface UserStore {
  users: User[];
  filteredUsers: User[];
  roles: Role[];
  query: string;
  setQuery: (q: string) => void;
  setSelectedUser: (user: User) => void;
  fetchUsers: (role?: string) => Promise<void>;
  fetchRoles: () => Promise<void>;
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
      u.phoneNumber?.toLowerCase().includes(q) ||
      u.name?.toLowerCase().includes(q) ||
      u.lastName?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q) ||
      u.city?.toLowerCase().includes(q)
  );
}

export const useUserStore = create<UserStore>((set, get) => ({
  users: [],
  filteredUsers: [],
  roles: [],
  query: '',

  setQuery: (q) => {
    const { users } = get();
    set({ query: q, filteredUsers: filterUsersByQuery(users, q) });
  },

  setSelectedUser: (user) => set({}),

  fetchUsers: async (role?: string) => {
    const url = role ? `${USERS_API}?role=${encodeURIComponent(role)}` : USERS_API;
    const data = await apiFetch<User[]>(url, { cache: 'no-store', headers: getAuthHeaders() });
    const query = get().query;
    set({ users: data ?? [], filteredUsers: filterUsersByQuery(data ?? [], query) });
  },

  fetchRoles: async () => {
    const data = await apiFetch<Role[]>(ROLES_API, { cache: 'no-store', headers: getAuthHeaders() });
    set({ roles: data ?? [] });
  },

  fetchUser: async (id: string) => {
    try {
      return await apiFetch<User | null>(`${USERS_API}/${id}`, { cache: 'no-store', headers: getAuthHeaders() });
    } catch {
      return null;
    }
  },

  createUser: async (payload: CreateUserPayload) => {
    const data = await apiFetch<{ user?: User; message?: string }>(USERS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(payload),
    });
    const created: User = data?.user ?? (data as unknown as User);
    const users = [...get().users, created];
    const query = get().query;
    set({ users, filteredUsers: filterUsersByQuery(users, query) });
  },

  updateUser: async (id, payload) => {
    const updated = await apiFetch<User>(`${USERS_API}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ id, ...payload }),
    });
    const users = get().users.map((u) => (u.id === id ? updated : u));
    const query = get().query;
    set({ users, filteredUsers: filterUsersByQuery(users, query) });
  },

  deleteUser: async (id) => {
    await apiFetch<null>(`${USERS_API}/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    const users = get().users.filter((u) => u.id !== id);
    const query = get().query;
    set({ users, filteredUsers: filterUsersByQuery(users, query) });
  },

  changeRole: async (id, role) => {
    const updated = await apiFetch<User>(`${USERS_API}/${id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ role }),
    });
    const users = get().users.map((u) => (u.id === id ? updated : u));
    const query = get().query;
    set({ users, filteredUsers: filterUsersByQuery(users, query) });
  },
}));
