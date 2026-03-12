'use client';

import { FaUserCircle, FaTrash, FaPencilAlt, FaUserTag } from 'react-icons/fa';
import { FiSearch } from 'react-icons/fi';
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

export default function UsersPage() {
  const { t } = useTranslation();
  const users = useUserStore((state) => state.users);
  const filteredUsers = useUserStore((state) => state.filteredUsers);
  const query = useUserStore((state) => state.query);
  const setQuery = useUserStore((state) => state.setQuery);
  const fetchUsers = useUserStore((state) => state.fetchUsers);
  const createUser = useUserStore((state) => state.createUser);
  const updateUser = useUserStore((state) => state.updateUser);
  const deleteUser = useUserStore((state) => state.deleteUser);
  const changeRole = useUserStore((state) => state.changeRole);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('GeneralManager');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editUser, setEditUser] = useState<User | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editName, setEditName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [roleUser, setRoleUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('GeneralManager');
  const [roleSaving, setRoleSaving] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        await fetchUsers();
      } catch (err) {
        setError(err instanceof Error ? err.message : t('failedToLoadUsers'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fetchUsers, t]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || !trimmedEmail || !password) {
      setCreateError(t('emailPasswordRequired'));
      return;
    }
    try {
      await createUser({ name: trimmedName, email: trimmedEmail, password, role });
      setName('');
      setEmail('');
      setPassword('');
      setRole('GeneralManager');
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : t('failedToLoadUsers'));
    }
  };

  const openEdit = (user: User) => {
    setEditUser(user);
    setEditEmail(user.email ?? '');
    setEditName(user.name ?? '');
    setEditLastName(user.lastName ?? '');
    setEditCity(user.city ?? '');
    setEditError(null);
  };

  const handleEditSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setEditSaving(true);
    setEditError(null);
    try {
      await updateUser(editUser.id, {
        email: editEmail.trim() || undefined,
        name: editName.trim() || undefined,
        lastName: editLastName.trim() || undefined,
        city: editCity.trim() || undefined,
      });
      setEditUser(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : t('failedToLoadUsers'));
    } finally {
      setEditSaving(false);
    }
  };

  const openChangeRole = (user: User) => {
    setRoleUser(user);
    setNewRole((user.role as UserRole) || 'GeneralManager');
    setRoleError(null);
  };

  const handleChangeRoleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!roleUser) return;
    setRoleSaving(true);
    setRoleError(null);
    try {
      await changeRole(roleUser.id, newRole);
      setRoleUser(null);
    } catch (err) {
      setRoleError(err instanceof Error ? err.message : t('failedToLoadUsers'));
    } finally {
      setRoleSaving(false);
    }
  };

  const handleDelete = async (user: User) => {
    try {
      await deleteUser(user.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failedToLoadUsers'));
    }
  };

  if (loading) {
    return (
      <main className="min-h-full bg-transparent">
        <p className="text-slate-800">{t('loadingUsers')}</p>
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

  return (
    <main className="min-h-full bg-transparent">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <section className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{t('users')}</h1>
                <p className="text-xs text-gray-500">{t('usersSubtitle')}</p>
              </div>
              <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                {t('totalCount', { count: users.length })}
              </span>
            </div>

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
                  type="email"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-black focus:border-slate-400 focus:ring-0"
                  placeholder={t('email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {t(roleLabelKey(r))}
                    </option>
                  ))}
                </select>
              </div>
              {createError && (
                <p className="text-xs text-red-600">{createError}</p>
              )}
              <button
                type="submit"
                className="mt-2 inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
              >
                {t('createUser')}
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-2 text-sm font-semibold text-gray-900">
              {t('quickSearch')}
            </h2>
            <div className="flex rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <FiSearch className="me-2 shrink-0 text-slate-500" />
              <input
                type="text"
                placeholder={t('searchUsersPlaceholder')}
                className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">
            {t('allUsers')}
          </h2>

          <div className="space-y-3">
            {filteredUsers.map((user: User) => (
              <div
                key={user.id}
                className="flex flex-row flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
              >
                <FaUserCircle className="shrink-0 text-gray-500" size={22} />
                <div className="min-w-0 flex flex-1 items-center justify-between gap-4 text-xs md:text-sm">
                  <div className="min-w-0 truncate">
                    <span className="font-semibold text-gray-800">
                      {user.name || user.email}
                    </span>
                    {user.name && (
                      <span className="ms-1 text-slate-500">{user.email}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs text-slate-700">
                      {t(roleLabelKey((user.role as UserRole) ?? 'GeneralManager'))}
                    </span>
                    <span className="truncate text-gray-500">
                      {t('idLabel')} {user.id}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                    onClick={() => openEdit(user)}
                    title={t('editUser')}
                  >
                    <FaPencilAlt size={12} className="me-1" />
                    {t('edit')}
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-lg border border-amber-200 bg-white px-2.5 py-1.5 text-xs text-amber-700 hover:bg-amber-50"
                    onClick={() => openChangeRole(user)}
                    title={t('changeRole')}
                  >
                    <FaUserTag size={12} className="me-1" />
                    {t('changeRole')}
                  </button>
                  <Link
                    href={`/users/${user.id}`}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    {t('view')}
                  </Link>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(user)}
                    title={t('deleteUser')}
                  >
                    <FaTrash size={12} className="me-1" />
                    {t('delete')}
                  </button>
                </div>
              </div>
            ))}

            {filteredUsers.length === 0 && (
              <div className="py-6 text-center text-xs text-gray-500">
                {query.trim() ? t('noUsersMatchFilters') : t('noUsersYet')}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Edit modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              {t('editUser')} (ID: {editUser.id})
            </h2>
            <form onSubmit={handleEditSave} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600">
                  {t('email')}
                </label>
                <input
                  type="email"
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm text-black"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">
                  {t('name')}
                </label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm text-black"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">
                  {t('lastName')}
                </label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm text-black"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">
                  {t('city')}
                </label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm text-black"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                />
              </div>
              {editError && (
                <p className="text-xs text-red-600">{editError}</p>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-50"
                  disabled={editSaving}
                >
                  {t('saveChanges')}
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => setEditUser(null)}
                >
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change role modal */}
      {roleUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              {t('changeRole')} — {roleUser.email}
            </h2>
            <form onSubmit={handleChangeRoleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600">
                  {t('role')}
                </label>
                <select
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm text-black"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {t(roleLabelKey(r))}
                    </option>
                  ))}
                </select>
              </div>
              {roleError && (
                <p className="text-xs text-red-600">{roleError}</p>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-50"
                  disabled={roleSaving}
                >
                  {t('saveChanges')}
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => setRoleUser(null)}
                >
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
