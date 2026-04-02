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
import { usePermissionsStore } from '@/store/permissionsState';
import { Skeleton } from '../../components/skeletons/Skeleton';

function roleLabelKey(role: UserRole): string {
  const normalized = String(role).toLowerCase().replace(/\s/g, '');
  if (normalized === 'admin') return 'roleAdmin';
  if (normalized === 'socialmediamanager') return 'roleSocialMediaManager';
  if (normalized === 'generalmanager') return 'roleGeneralManager';
  return role;
}

export default function UserDetailPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const canAccessUsers = usePermissionsStore((s) => s.hasClaim('ViewUsers'));
  const canEdit = usePermissionsStore((s) => s.hasClaim('EditUser'));
  const canDelete = usePermissionsStore((s) => s.hasClaim('DeleteUser'));
  const canChangeRole = usePermissionsStore((s) => s.hasClaim('ChangeUserRole'));
  const id = params.id as string;

  const roles = useUserStore((state) => state.roles);
  const fetchRoles = useUserStore((state) => state.fetchRoles);
  const fetchUser = useUserStore((state) => state.fetchUser);
  const updateUser = useUserStore((state) => state.updateUser);
  const deleteUser = useUserStore((state) => state.deleteUser);
  const changeRole = useUserStore((state) => state.changeRole);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [city, setCity] = useState('');
  const [role, setRole] = useState<UserRole>('GeneralManager');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [roleSaving, setRoleSaving] = useState(false);

  useEffect(() => {
    if (!canAccessUsers) {
      router.replace('/home');
      return;
    }
    if (!id) return;
    const load = async () => {
      await fetchRoles();
      setLoading(true);
      setError(null);
      try {
        const data = await fetchUser(id);
        if (data) {
          setUser(data);
          setPhoneNumber(data.phoneNumber ?? '');
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
  }, [canAccessUsers, router, id, fetchUser, t]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateUser(user.id, {
        phoneNumber: phoneNumber.trim() || undefined,
        name: name.trim() || undefined,
        lastName: lastName.trim() || undefined,
        city: city.trim() || undefined,
      });
      setUser((prev) =>
        prev
          ? {
              ...prev,
              phoneNumber: phoneNumber.trim() || prev.phoneNumber,
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

  if (!canAccessUsers || !id || loading) {
    return (
      <main className="flex min-h-full items-center justify-center bg-transparent py-8">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 space-y-4">
          <Skeleton className="h-7 w-2/5" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-9 w-28 rounded-lg" />
            <Skeleton className="h-9 w-20 rounded-lg" />
          </div>
        </div>
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
          {canEdit ? t('editUser') : t('view')} (ID: {user.id})
        </h1>

        {canEdit ? (
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('phoneNumber')}
            </label>
            <input
              type="tel"
              className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-black"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
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
        ) : (
          <div className="space-y-2 text-sm text-gray-700">
            <p><span className="font-medium">{t('phoneNumber')}:</span> {phoneNumber}</p>
            <p><span className="font-medium">{t('name')}:</span> {name} {lastName}</p>
            <p><span className="font-medium">{t('city')}:</span> {city}</p>
            <p><span className="font-medium">{t('role')}:</span> {t(roleLabelKey(role))}</p>
            <Link href="/users" className="inline-block mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
              {t('back')}
            </Link>
          </div>
        )}

        {canChangeRole && (
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
                {roles.map((r) => (
                  <option key={r.id} value={r.name}>
                    {t(roleLabelKey(r.name))}
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
        )}

        {canDelete && (
        <div className="mt-6 flex justify-end border-t border-slate-200 pt-6">
          <button
            type="button"
            className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
            onClick={handleDelete}
          >
            {t('deleteUser')}
          </button>
        </div>
        )}
      </div>
    </main>
  );
}
