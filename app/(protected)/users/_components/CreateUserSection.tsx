'use client';

import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useUserStore, type UserRole } from '@/store/usersState';
import { usePermissionsStore } from '@/store/permissionsState';
import { Skeleton } from '../../components/skeletons/Skeleton';

function roleLabelKey(role: UserRole): string {
  const normalized = String(role).toLowerCase().replace(/\s/g, '');
  if (normalized === 'admin') return 'roleAdmin';
  if (normalized === 'socialmediamanager') return 'roleSocialMediaManager';
  if (normalized === 'generalmanager') return 'roleGeneralManager';
  return role;
}

type Props = {
  onCreated: () => void;
  totalRecords: number;
};

export default function CreateUserSection({ onCreated, totalRecords }: Props) {
  const { t } = useTranslation();
  const hasClaim = usePermissionsStore((s) => s.hasClaim);
  const canCreateUser = hasClaim('CreateUser');
  const roles = useUserStore((s) => s.roles);
  const createUser = useUserStore((s) => s.createUser);
  const query = useUserStore((s) => s.query);
  const filteredCount = useUserStore((s) => s.filteredUsers.length);

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('General Manager');
  const [error, setError] = useState<string | null>(null);

  const displayCount = query.trim() ? filteredCount : totalRecords;
  const rolesReady = roles.length > 0;

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    const trimmedPhone = phoneNumber.trim();
    if (!trimmedName || !trimmedPhone || !password) {
      setError(t('phonePasswordRequired'));
      return;
    }
    try {
      await createUser({ name: trimmedName, phoneNumber: trimmedPhone, password, role });
      setName('');
      setPhoneNumber('');
      setPassword('');
      setRole('General Manager');
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failedToLoadUsers'));
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">{t('users')}</h1>
          <p className="text-xs text-gray-500">{t('usersSubtitle')}</p>
        </div>
        <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
          {t('totalCount', { count: displayCount })}
        </span>
      </div>

      {!rolesReady && canCreateUser ? (
        <div className="space-y-3">
          <Skeleton className="h-9 w-full rounded-lg" />
          <div className="grid gap-2 md:grid-cols-2">
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      ) : (
        canCreateUser && (
          <>
            <form onSubmit={handleCreate} className="flex flex-col gap-2">
              <div>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-black focus:border-slate-400 focus:ring-0"
                  placeholder={t('name')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <input
                  type="tel"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-black focus:border-slate-400 focus:ring-0"
                  placeholder={t('phoneNumber')}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <input
                  type="password"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-black focus:border-slate-400 focus:ring-0"
                  placeholder={t('password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  {t('role')}
                </label>
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-black focus:border-slate-400 focus:ring-0"
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
              {error && <p className="text-xs text-red-600">{error}</p>}
              <button
                type="submit"
                className="mt-2 inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
              >
                {t('createUser')}
              </button>
            </form>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs text-slate-700">
                <div className="font-semibold text-slate-900">{t('roles')}</div>
                <div className="text-slate-600">{t('createAndAssignRoles')}</div>
              </div>
              <Link
                href="/roles/new"
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
              >
                {t('newRole')}
              </Link>
            </div>
          </>
        )
      )}
    </div>
  );
}
