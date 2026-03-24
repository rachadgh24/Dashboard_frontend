'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaChevronDown, FaChevronUp, FaTrophy, FaPlus, FaCar, FaNewspaper, FaUserPlus } from 'react-icons/fa';
import { usePermissionsStore } from '@/store/permissionsState';
import { apiFetch } from '@/lib/apiClient';
import { getLandingRoute } from '@/lib/landingRoute';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://localhost:7190';

type Car = { id: number; model: string; maxSpeed: number; customerId?: number };

type Stats = {
  totalUsers?: number | null;
  totalCars: number;
  totalCustomers: number;
  topCustomer: { name: string; carCount: number; cars: Car[] } | null;
};

export default function HomePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const permissionsLoaded = usePermissionsStore((s) => s.loaded);
  const hasClaim = usePermissionsStore((s) => s.hasClaim);
  const canAccessDashboard = hasClaim('ViewDashboard');
  const canAccessUsers = hasClaim('ViewUsers');
  const canAccessCars = hasClaim('ViewCars');
  const canAccessCustomers = hasClaim('ViewCustomers');
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topExpanded, setTopExpanded] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!permissionsLoaded) return;
    if (!canAccessDashboard) {
      router.replace(getLandingRoute(hasClaim));
      return;
    }
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const data = await apiFetch<Stats>(`${API_BASE}/Dashboard/stats`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [permissionsLoaded, canAccessDashboard, canAccessCustomers, canAccessCars, canAccessUsers, router]);

  if (!permissionsLoaded || !canAccessDashboard) {
    return (
      <main className="min-h-full bg-transparent">
        <p className="text-slate-800">Loading...</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-full bg-transparent">
        <p className="text-slate-800">{mounted ? t('loading') : 'Loading...'}</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-full bg-transparent">
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  const s = stats ?? { totalUsers: 0, totalCars: 0, totalCustomers: 0, topCustomer: null };

  const metrics = [
    ...(canAccessUsers && s.totalUsers != null ? [{ label: mounted ? t('users') : 'Users', value: s.totalUsers, href: '/users', accent: 'from-amber-500 to-amber-600' }] : []),
    ...(canAccessCars ? [{ label: mounted ? t('cars') : 'Cars', value: s.totalCars, href: '/sales', accent: 'from-sky-500 to-sky-600' }] : []),
    ...(canAccessCustomers ? [{ label: mounted ? t('customers') : 'Customers', value: s.totalCustomers, href: '/customers', accent: 'from-emerald-500 to-emerald-600' }] : []),
  ];

  const quickActions = [
    ...(hasClaim('CreateCustomer') ? [{ label: mounted ? t('createCustomer') : 'Create customer', href: '/customers', icon: FaPlus, key: 'createCustomer' }] : []),
    ...(hasClaim('CreateCar') ? [{ label: mounted ? t('addCar') : 'Add car', href: '/sales', icon: FaCar, key: 'addCar' }] : []),
    ...(hasClaim('CreatePost') ? [{ label: mounted ? t('createPost') : 'Create a post', href: '/posts', icon: FaNewspaper, key: 'createPost' }] : []),
    ...(hasClaim('CreateUser') ? [{ label: mounted ? t('createUser') : 'Create a user', href: '/users', icon: FaUserPlus, key: 'createUser' }] : []),
  ];

  return (
    <main className="min-h-full bg-transparent">
      <div className="mx-auto max-w-5xl space-y-10">
        <section className={`grid gap-4 ${metrics.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
          {metrics.map(({ label, value, href, accent }) => (
            <Link
              key={href}
              href={href}
              className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60 transition-all duration-200 hover:shadow-lg hover:ring-slate-300"
            >
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    {label}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-900 tabular-nums">
                    {value}
                  </p>
                </div>
                <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500 transition-colors group-hover:bg-slate-100">
                  →
                </span>
              </div>
            </Link>
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          {s.topCustomer && (
            <section className="lg:col-span-2">
              <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-white to-amber-50/50 shadow-sm ring-1 ring-amber-200/40">
                <div className="flex flex-col items-center px-8 py-8 text-center sm:flex-row sm:items-center sm:text-left sm:gap-6">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg">
                    <FaTrophy className="text-white" size={36} />
                  </div>
                  <div className="mt-4 sm:mt-0 sm:flex-1">
                    <span className="inline-block rounded-full bg-amber-200/80 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-800">
                      #1 {mounted ? t('topPerformer') : 'Top performer'}
                    </span>
                    <h2 className="mt-2 text-xl font-bold text-slate-900">
                      {s.topCustomer.name}
                    </h2>
                    <p className="text-sm text-slate-600">
                      {mounted ? t('carsCount', { count: s.topCustomer.carCount }) : `${s.topCustomer.carCount} cars`}
                    </p>
                  </div>
                </div>

                {s.topCustomer.cars.length > 0 && (
                  <div className="border-t border-amber-200/40 px-6 pb-6">
                    <button
                      type="button"
                      onClick={() => setTopExpanded((e) => !e)}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100/50"
                    >
                      {topExpanded ? (
                        <>
                          <FaChevronUp size={14} />
                          {mounted ? t('collapse') : 'Collapse'}
                        </>
                      ) : (
                        <>
                          <FaChevronDown size={14} />
                          {mounted ? t('expand') : 'Expand'} {mounted ? t('cars') : 'cars'}
                        </>
                      )}
                    </button>

                    {topExpanded && (
                      <ul className="mt-3 space-y-2">
                        {s.topCustomer.cars.map((car) => (
                          <li
                            key={car.id}
                            className="flex items-center justify-between rounded-lg bg-white/80 px-4 py-2.5 text-sm ring-1 ring-amber-200/30"
                          >
                            <span className="font-medium text-slate-800">{car.model}</span>
                            <span className="text-slate-500">{car.maxSpeed} km/h</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          <section>
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/60">
              <h3 className="text-sm font-semibold text-slate-800">
                {mounted ? t('quickActions') : 'Quick actions'}
              </h3>
              <div className="mt-4 space-y-2">
                {quickActions.map(({ label, href, icon: Icon, key: actionKey }) => (
                  <Link
                    key={actionKey}
                    href={href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <Icon className="text-slate-400" size={16} />
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
