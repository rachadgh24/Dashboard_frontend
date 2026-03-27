import { create } from 'zustand';
import { API_BASE } from '@/lib/apiBase';
import { apiFetch } from '@/lib/apiClient';
const NOTIFICATIONS_API = `${API_BASE}/notifications`;

const getAuthHeaders = () => {
  const headers: Record<string, string> = {};
  if (typeof window === 'undefined') return headers;
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

export function normalizeCreatedAt(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return new Date(value).getTime();
  return Date.now();
}

export interface Notification {
  id: number;
  message: string;
  createdAt: number;
  name?: string;
  role?: string;
}

interface NotificationsStore {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  upsertNotification: (n: Notification) => void;
  removeNotificationLocal: (id: number) => void;
  clearNotificationsLocal: () => void;
  removeNotification: (id: number) => Promise<void>;
  clearAll: () => Promise<void>;
}

export const useNotificationStore = create<NotificationsStore>((set) => ({
  notifications: [],
  loading: false,
  error: null,

  fetchNotifications: async () => {
    set({ loading: true, error: null });
    try {
      const raw = await apiFetch<unknown[]>(NOTIFICATIONS_API, { cache: 'no-store', headers: getAuthHeaders() });
      const notifications: Notification[] = (raw || []).map((item) => {
        const obj = item as Record<string, unknown>;
        return {
          id: Number((obj as { id?: number }).id),
          message: String((obj as { message?: string }).message ?? ''),
          createdAt: normalizeCreatedAt((obj as { createdAt?: unknown }).createdAt),
          name: (obj as { name?: string }).name,
          role: (obj as { role?: string }).role,
        };
      });
      set({ notifications, loading: false, error: null });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch notifications',
      });
    }
  },

  upsertNotification: (n: Notification) => {
    set((state) => {
      const next = state.notifications.filter((x) => x.id !== n.id);
      next.push(n);
      next.sort((a, b) => b.createdAt - a.createdAt || b.id - a.id);
      return { notifications: next };
    });
  },

  removeNotificationLocal: (id: number) => {
    set((state) => ({
      notifications: state.notifications.filter((x) => x.id !== id),
    }));
  },

  clearNotificationsLocal: () => set({ notifications: [] }),

  removeNotification: async (id: number) => {
    try {
      await apiFetch<null>(`${NOTIFICATIONS_API}/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    } catch {
      // leave state unchanged on failure
    }
  },

  clearAll: async () => {
    try {
      await apiFetch<null>(NOTIFICATIONS_API, { method: 'DELETE', headers: getAuthHeaders() });
      set({ notifications: [] });
    } catch {
      // leave state unchanged on failure
    }
  },
}));
