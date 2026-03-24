'use client';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import Image from 'next/image';
import { FaUsers, FaSalesforce, FaUserCog, FaNewspaper, FaHome } from 'react-icons/fa';
import { usePermissionsStore } from '@/store/permissionsState';

const SideBar = () => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const fetchPermissions = usePermissionsStore((s) => s.fetchPermissions);
  const hasClaim = usePermissionsStore((s) => s.hasClaim);

  const showDashboard = hasClaim('ViewDashboard');
  const showCustomers = hasClaim('ViewCustomers');
  const showCars = hasClaim('ViewCars');
  const showUsers = hasClaim('ViewUsers');
  const showPosts = hasClaim('ViewPosts');

  useEffect(() => {
    setMounted(true);
    fetchPermissions();
  }, [fetchPermissions]);

  const linkBase =
    'flex flex-row items-center justify-center md:justify-start gap-0 md:gap-3 rounded-lg px-2 md:px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer';

  return (
    <div className="flex h-full flex-col justify-between p-2 md:p-4 text-slate-50" suppressHydrationWarning>
      <div>
        <div className="flex items-center justify-center md:justify-start gap-0 md:gap-2 mb-6 md:mb-8 px-0 md:px-2">
          <Image
            src="/logo.png"
            alt={mounted ? t('logo') : 'Logo'}
            width={32}
            height={32}
            className="rounded-md border border-slate-700 shrink-0"
          />
          <div className="hidden md:flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {mounted ? t('admin') : 'Admin'}
            </span>
            <span className="text-sm font-semibold text-slate-50">
              {mounted ? t('userAndCars') : 'User & Cars'}
            </span>
          </div>
        </div>

        <nav className="space-y-1 text-sm">
          <p className="hidden md:block px-2 mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            {mounted ? t('main') : 'Main'}
          </p>

          {showDashboard && (
            <Link href="/home" className="block w-full" title={mounted ? t('home') : 'Home'}>
              <div
                className={`${linkBase} ${pathname === '/home'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-800 text-slate-100 shrink-0">
                  <FaHome size={16} />
                </span>
                <span className="hidden md:inline">{mounted ? t('home') : 'Home'}</span>
              </div>
            </Link>
          )}

          {showCustomers && (
            <Link href="/customers" className="block w-full" title={mounted ? t('customers') : 'Customers'}>
              <div
                className={`${linkBase} ${pathname.includes('customers')
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-200 hover:bg-slate-800'
                  }`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-800 text-slate-100 shrink-0">
                  <FaUsers size={16} />
                </span>
                <span className="hidden md:inline">{mounted ? t('customers') : 'Customers'}</span>
              </div>
            </Link>
          )}

          {showCars && (
            <Link href="/sales" className="block w-full" title={mounted ? t('cars') : 'Cars'}>
              <div
                className={`${linkBase} ${pathname.includes('sales')
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-200 hover:bg-slate-800'
                  }`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-800 text-sky-300 shrink-0">
                  <FaSalesforce size={16} />
                </span>
                <span className="hidden md:inline">{mounted ? t('cars') : 'Cars'}</span>
              </div>
            </Link>
          )}

          {showUsers && (
            <Link href="/users" className="block w-full" title={mounted ? t('users') : 'Users'}>
              <div
                className={`${linkBase} ${pathname.includes('users')
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-200 hover:bg-slate-800'
                  }`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-800 text-amber-300 shrink-0">
                  <FaUserCog size={16} />
                </span>
                <span className="hidden md:inline">{mounted ? t('users') : 'Users'}</span>
              </div>
            </Link>
          )}

          {showPosts && (
            <Link href="/posts" className="block w-full" title={mounted ? t('posts') : 'Posts'}>
              <div
                className={`${linkBase} ${pathname.includes('posts')
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-800 text-emerald-300 shrink-0">
                  <FaNewspaper size={16} />
                </span>
                <span className="hidden md:inline">{mounted ? t('posts') : 'Posts'}</span>
              </div>
            </Link>
          )}
        </nav>
      </div>

      <div className="hidden md:block mt-4 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-[11px] text-slate-200">
        <p className="font-semibold text-slate-50 mb-1">{mounted ? t('hint') : 'Hint'}</p>
        <p className="text-slate-300">
          {mounted ? t('hintText') : 'Switch between customers, cars, and posts.'}
        </p>
      </div>
    </div>
  );
};

export default SideBar;