'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NoAccessPage() {
  const router = useRouter();

  useEffect(() => {
    // If token disappears, send to login
    const token = localStorage.getItem('token');
    if (!token) router.replace('/logIn');
  }, [router]);

  const logout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('admin_phone');
      localStorage.removeItem('admin_name');
    } finally {
      router.replace('/logIn');
    }
  };

  return (
    <main className="flex min-h-full items-center justify-center bg-transparent py-10">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8">
        <h1 className="text-xl font-semibold text-slate-900">No access</h1>
        <p className="mt-2 text-sm text-slate-600">
          Your account is signed in, but your role doesn’t have permission to access any pages.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Contact an admin to assign you a role with at least one of these permissions: ViewDashboard, ViewCustomers,
          ViewCars, ViewPosts, or ViewUsers.
        </p>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={logout}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Logout
          </button>
        </div>
      </div>
    </main>
  );
}

