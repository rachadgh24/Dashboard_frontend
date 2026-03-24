import { create } from 'zustand';

export type ClaimDto = { id: number; name: string; category: string };

type PermissionsState = {
  claims: ClaimDto[];
  loaded: boolean;
  fetchPermissions: () => Promise<void>;
  canAccessSection: (category: string) => boolean;
  hasClaim: (claimName: string) => boolean;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://localhost:7190';

export const usePermissionsStore = create<PermissionsState>((set, get) => ({
  claims: [],
  loaded: false,

  fetchPermissions: async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    if (!token) {
      set({ claims: [], loaded: true });
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/Auth/me/permissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        set({ claims: [], loaded: true });
        return;
      }
      const json = (await res.json()) as { data?: { claims?: ClaimDto[] }; Data?: { Claims?: ClaimDto[] } };
      const claims = json?.data?.claims ?? json?.Data?.Claims ?? [];
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
