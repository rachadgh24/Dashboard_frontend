'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissionsStore } from '@/store/permissionsState';
import { getLandingRoute } from '@/lib/landingRoute';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const go = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.replace('/logIn');
        return;
      }

      await usePermissionsStore.getState().fetchPermissions();
      const landing = getLandingRoute(usePermissionsStore.getState().hasClaim);
      router.replace(landing);
    };
    go();
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50">
      <p className="text-slate-700 text-sm">Loading…</p>
    </main>
  );
}