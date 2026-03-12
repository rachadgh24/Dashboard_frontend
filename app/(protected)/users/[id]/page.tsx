'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import {
  useUserStore,
  type User,
  type UserRole,
} from '@/store/usersState';

const ROLES: UserRole[] = ['Admin', 'SocialMediaManager', 'GeneralManager'];

function roleLabelKey(role: UserRole): string {
  const map: Record<UserRole, string> = {
    Admin: 'roleAdmin',
    SocialMediaManager: 'roleSocialMediaManager',
    GeneralManager: 'roleGeneralManager',
  };
  return map[role] ?? role;
}

export default function UserDetailPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const fetchUser = useUserStore((state) => state.fetchUser);
  const updateUser = useUserStore((state) => state.updateUser);
  const deleteUser = useUserStore((state) => state.deleteUser);
  const changeRole = useUserStore((state) => state.changeRole);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [city, setCity] = useState('');
  const [role, setRole] = useState<UserRole>('GeneralManager');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [roleSaving, setRoleSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchUser(id);
        if (data) {
          setUser(data);
          setEmail(data.email ?? '');
          setName(data.name ?? '');
          setLastName(data.lastName ?? '');
          setCity(data.city ?? '');
          setRole((data.role as UserRole) ?? 'GeneralManager');
        } else {
          setError(t('noIdProvided'));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t('failedToLoadUsers'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, fetchUser, t]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateUser(user.id, {
        email: email.trim() || undefined,
        name: name.trim() || undefined,
        lastName: lastName.trim() || undefined,
        city: city.trim() || undefined,
      });
      setUser((prev) =>
        prev
          ? {
              ...prev,
              email: email.trim() || prev.email,
              name: name.trim() || prev.name,
              lastName: lastName.trim() || prev.lastName,
              city: city.trim() || prev.city,
            }
          : null
      );
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t('failedToLoadUsers'));
    } finally {
      setSaving(false);
    }
  };

  const handleChangeRole = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setRoleSaving(true);
    try {
      await changeRole(user.id, role);
      setUser((prev) => (prev ? { ...prev, role } : null));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t('failedToLoadUsers'));
    } finally {
      setRoleSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    try {
      await deleteUser(user.id);
      router.push('/users');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t('failedToLoadUsers'));
    }
  };

  if (!id) {
    return (
      <main className="flex min-h-full items-center justify-center bg-transparent py-8">
        <div className="text-gray-700">{t('noIdProvided')}</div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-full items-center justify-center bg-transparent py-8">
        <div className="text-gray-700">{t('loading')}</div>
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="flex min-h-full flex-col items-center justify-center gap-4 bg-transparent py-8">
        <p className="text-red-600">{error ?? t('failedToLoadUsers')}</p>
        <Link
          href="/users"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
        >
          {t('users')}
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-full items-center justify-center bg-transparent py-8">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8">
        <h1 className="mb-6 text-2xl font-semibold text-gray-900">
          {t('editUser')} (ID: {user.id})
        </h1>

        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('email')}
            </label>
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-black"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('name')}
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-black"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('lastName')}
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-black"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('city')}
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-black"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          {saveError && (
            <p className="text-sm text-red-600">{saveError}</p>
          )}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-50"
              disabled={saving}
            >
              {t('saveChanges')}
            </button>
            <Link
              href="/users"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              {t('cancel')}
            </Link>
          </div>
        </form>

        <div className="mt-6 border-t border-slate-200 pt-6">
          <h2 className="mb-2 text-sm font-semibold text-gray-900">
            {t('changeRole')}
          </h2>
          <form onSubmit={handleChangeRole} className="flex flex-wrap items-end gap-2">
            <div className="min-w-[180px]">
              <label className="block text-xs font-medium text-gray-600">
                {t('role')}
              </label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm text-black"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {t(roleLabelKey(r))}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm text-white hover:bg-amber-700 disabled:opacity-50"
              disabled={roleSaving}
            >
              {t('saveChanges')}
            </button>
          </form>
        </div>

        <div className="mt-6 flex justify-end border-t border-slate-200 pt-6">
          <button
            type="button"
            className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
            onClick={handleDelete}
          >
            {t('deleteUser')}
          </button>
        </div>
      </div>
    </main>
  );
}
