'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { FaBell, FaUserCircle, FaTimes } from 'react-icons/fa';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useNotificationStore } from '@/store/notificationsState';

type HeaderUser = {
  name: string;
  email: string;
};

type DashboardRole = 'Admin' | 'Social Media Manager' | 'General Manager' | null;

function getDisplayRole(): DashboardRole {
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
    const normalize = (value: unknown): DashboardRole => {
      const raw = String(value).toLowerCase().replace(/\s/g, '');
      if (raw === 'admin') return 'Admin';
      if (raw === 'socialmediamanager') return 'Social Media Manager';
      if (raw === 'generalmanager') return 'General Manager';
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

const ProfileIcon = () => (
  <FaUserCircle size={32} className="text-gray-600" />
);

function formatNotificationTime(ms: number): string {
  const d = new Date(ms);
  const now = Date.now();
  const diff = now - ms;
  if (diff < 60_000) return 'Just now';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return d.toLocaleDateString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

const Header = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<HeaderUser>({ name: '', email: '' });
  const [role, setRole] = useState<DashboardRole>(null);
  const [inboxOpen, setInboxOpen] = useState(false);
  const inboxRef = useRef<HTMLDivElement>(null);

  const notifications = useNotificationStore((s) => s.notifications);
  const loading = useNotificationStore((s) => s.loading);
  const error = useNotificationStore((s) => s.error);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const removeNotification = useNotificationStore((s) => s.removeNotification);
  const clearAll = useNotificationStore((s) => s.clearAll);

  useEffect(() => {
    setMounted(true);
    const name = localStorage.getItem('admin_name') ?? '';
    const email = localStorage.getItem('admin_email') ?? '';
    setCurrentUser({ name, email });
    setRole(getDisplayRole());
  }, []);

  // Fetch notifications when admin lands so the bell badge shows count without opening inbox
  useEffect(() => {
    if (role === 'Admin') fetchNotifications();
  }, [role, fetchNotifications]);

  // Poll so the badge updates when someone else adds something (no need to open inbox)
  useEffect(() => {
    if (role !== 'Admin') return;
    const interval = setInterval(() => fetchNotifications(), 15000);
    return () => clearInterval(interval);
  }, [role, fetchNotifications]);

  useEffect(() => {
    if (inboxOpen) fetchNotifications();
  }, [inboxOpen, fetchNotifications]);

  useEffect(() => {
    if (!inboxOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (inboxRef.current && !inboxRef.current.contains(e.target as Node)) {
        setInboxOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inboxOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin_name');
    localStorage.removeItem('admin_email');
    router.push('/logIn');
  };

  return (
    <div className="flex w-full items-center justify-between px-6 py-4">
      <div className="flex flex-col">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          {mounted ? t('dashboard') : 'Dashboard'}
        </span>
        <span className="mt-1 text-xl font-semibold text-slate-900">
          {mounted ? t('userAndFleetOverview') : 'Overview'}
        </span>
      </div>

      {role && (
        <div className="hidden md:flex flex-1 items-center justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-slate-700 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {role}
          </span>
        </div>
      )}

      <div className="flex items-center gap-4 text-sm">
        {role === 'Admin' && (
          <div className="relative" ref={inboxRef}>
            <button
              type="button"
              onClick={() => setInboxOpen((o) => !o)}
              className="relative rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
              aria-label={mounted ? t('notifications') : 'Notifications'}
            >
              <FaBell size={18} />
              {notifications.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
                  {notifications.length > 99 ? '99+' : notifications.length}
                </span>
              )}
            </button>
            {inboxOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <span className="text-sm font-semibold text-slate-800">{mounted ? t('notifications') : 'Notifications'}</span>
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAll}
                      className="text-xs text-slate-500 hover:text-slate-700"
                    >
                      {mounted ? t('clearAll') : 'Clear all'}
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {loading ? (
                    <div className="px-4 py-6 text-center text-xs text-slate-500">
                      {mounted ? t('loading') : 'Loading...'}
                    </div>
                  ) : error ? (
                    <div className="px-4 py-6 text-center text-xs text-red-600">
                      {error}
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-slate-500">
                      {mounted ? t('noNotifications') : 'No notifications yet.'}
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className="group flex items-start gap-2 border-b border-slate-100 px-4 py-3 last:border-b-0 hover:bg-slate-50"
                      >
                        <p className="min-w-0 flex-1 text-sm text-slate-800">{n.message}</p>
                        <span className="shrink-0 text-[10px] text-slate-400">
                          {formatNotificationTime(n.createdAt)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeNotification(n.id)}
                          className="shrink-0 rounded p-1 text-slate-400 opacity-0 transition-opacity hover:bg-slate-200 hover:text-slate-600 group-hover:opacity-100"
                          aria-label={mounted ? t('delete') : 'Delete'}
                        >
                          <FaTimes size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <ProfileIcon />
          <div className="flex flex-col text-xs leading-tight text-end">
            <span className="font-semibold text-slate-800">{currentUser.name}</span>
            <span className="text-slate-500">{currentUser.email}</span>
          </div>
        </div>

        <LanguageSwitcher />
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
        >
          {mounted ? t('logOut') : 'Log out'}
        </button>
      </div>
    </div>
  );
};

export default Header;
