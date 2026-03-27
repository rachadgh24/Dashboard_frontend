import { create } from 'zustand';
import { API_BASE } from '@/lib/apiBase';

export type ClaimDto = { id: number; name: string; category: string };

type PermissionsCache = {
  token: string;
  claims: ClaimDto[];
  savedAt: number;
};

type PermissionsState = {
  claims: ClaimDto[];
  loaded: boolean;
  hydrateFromCache: () => void;
  fetchPermissions: () => Promise<void>;
  canAccessSection: (category: string) => boolean;
  hasClaim: (claimName: string) => boolean;
};

const PERMISSIONS_CACHE_KEY = 'permissions_cache_v1';

function readPermissionsCache(): PermissionsCache | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PERMISSIONS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PermissionsCache;
    if (!parsed || !Array.isArray(parsed.claims) || typeof parsed.token !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writePermissionsCache(cache: PermissionsCache): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PERMISSIONS_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Best-effort cache only.
  }
}

function clearPermissionsCache(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PERMISSIONS_CACHE_KEY);
  } catch {
    // no-op
  }
}

export const usePermissionsStore = create<PermissionsState>((set, get) => ({
  claims: [],
  loaded: false,

  hydrateFromCache: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    if (!token) {
      clearPermissionsCache();
      set({ claims: [], loaded: true });
      return;
    }
    const cache = readPermissionsCache();
    if (!cache || cache.token !== token) return;
    set({ claims: cache.claims, loaded: true });
  },

  fetchPermissions: async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    if (!token) {
      clearPermissionsCache();
      set({ claims: [], loaded: true });
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/Auth/me/permissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        clearPermissionsCache();
        set({ claims: [], loaded: true });
        return;
      }
      const json = (await res.json()) as { data?: { claims?: ClaimDto[] }; Data?: { Claims?: ClaimDto[] } };
      const claims = json?.data?.claims ?? json?.Data?.Claims ?? [];
      writePermissionsCache({ token, claims, savedAt: Date.now() });
      set({ claims, loaded: true });
    } catch {
      set({ claims: [], loaded: true });
    }
  },

  canAccessSection: (category: string) => {
    const { claims } = get();
    return claims.some((c) => c.category === category);
  },

  hasClaim: (claimName: string) => {
    const { claims } = get();
    return claims.some((c) => c.name === claimName);
  },
}));
