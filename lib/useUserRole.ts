import { useEffect, useState } from 'react';

export type UserRole = 'admin' | 'socialmediamanager' | 'generalmanager' | null;

export function getUserRole(): UserRole {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const claims = JSON.parse(json) as Record<string, unknown>;
    const roleKeys = [
      'role',
      'Role',
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
    ];
    const normalize = (value: unknown): UserRole => {
      const v = String(value).toLowerCase().replace(/\s/g, '');
      if (v === 'admin') return 'admin';
      if (v === 'socialmediamanager') return 'socialmediamanager';
      if (v === 'generalmanager') return 'generalmanager';
      return null;
    };
    for (const key of roleKeys) {
      const val = claims[key];
      if (typeof val === 'string') {
        const role = normalize(val);
        if (role) return role;
      }
      if (Array.isArray(val)) {
        for (const r of val) {
          const role = normalize(r);
          if (role) return role;
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

/** Returns true if admin, false if not admin, null while still determining (avoids redirect race). */
export function useIsAdmin(): boolean | null {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    setIsAdmin(getUserRole() === 'admin');
  }, []);

  return isAdmin;
}
