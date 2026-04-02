'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { FaUserCircle, FaTrash, FaPencilAlt, FaUserTag } from 'react-icons/fa';
import {
  useUserStore,
  type User,
  type UserRole,
} from '@/store/usersState';
import { usePermissionsStore } from '@/store/permissionsState';
import { API_BASE } from '@/lib/apiBase';
import { apiFetch } from '@/lib/apiClient';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, type PageSizeChoice } from '@/lib/pageSizeOptions';
import { SkeletonRow } from '../../components/skeletons/Skeleton';
import { isFresh, markFresh, prefetchData, getCachedData } from '@/lib/prefetch';

function roleLabelKey(role: UserRole): string {
  const normalized = String(role).toLowerCase().replace(/\s/g, '');
  if (normalized === 'admin') return 'roleAdmin';
  if (normalized === 'socialmediamanager') return 'roleSocialMediaManager';
  if (normalized === 'generalmanager') return 'roleGeneralManager';
  return role;
}

type Props = {
  reloadKey: number;
  onEdit: (user: User) => void;
  onChangeRole: (user: User) => void;
  onCountChange: (count: number) => void;
};

export default function UserListSection({
  reloadKey,
  onEdit,
  onChangeRole,
  onCountChange,
}: Props) {
  const { t } = useTranslation();
  const hasClaim = usePermissionsStore((s) => s.hasClaim);
  const canEditUser = hasClaim('EditUser');
  const canDeleteUser = hasClaim('DeleteUser');
  const canChangeRole = hasClaim('ChangeUserRole');
  const canViewUser = hasClaim('ViewUser');
  const canSearchUsers = hasClaim('SearchUsers');

  const filteredUsers = useUserStore((s) => s.filteredUsers);
  const query = useUserStore((s) => s.query);
  const fetchUsers = useUserStore((s) => s.fetchUsers);
  const fetchUsersPaginate = useUserStore((s) => s.fetchUsersPaginate);
  const fetchRoles = useUserStore((s) => s.fetchRoles);
  const roles = useUserStore((s) => s.roles);
  const deleteUser = useUserStore((s) => s.deleteUser);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<PageSizeChoice>(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const isFirstLoad = useRef(true);
  const didLoadOnce = useRef(false);
  const prevQueryRef = useRef<string | null>(null);

  const getAuthHeaders = () => {
    const headers: Record<string, string> = {};
    if (typeof window === 'undefined') return headers;
    const token = localStorage.getItem('token');
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  };

  const loadPaginatedFirstPage = useCallback(async () => {
    const countParams = new URLSearchParams();
    if (roleFilter) countParams.set('role', roleFilter);
    const countSuffix = countParams.toString() ? `?${countParams.toString()}` : '';
    const total = await apiFetch<number>(`${API_BASE}/Users/count${countSuffix}`, {
      headers: getAuthHeaders(),
    });
    await fetchUsersPaginate(1, itemsPerPage, roleFilter || undefined);
    setTotalRecords(total);
    onCountChange(total);
    setTotalPages(Math.max(1, Math.ceil(total / itemsPerPage)));
    setCurrentPage(1);
  }, [roleFilter, itemsPerPage, fetchUsersPaginate, onCountChange]);

  const reloadList = useCallback(async () => {
    if (query.trim() && canSearchUsers) {
      await fetchUsers(roleFilter || undefined);
      return;
    }
    const countParams = new URLSearchParams();
    if (roleFilter) countParams.set('role', roleFilter);
    const countSuffix = countParams.toString() ? `?${countParams.toString()}` : '';
    const total = await apiFetch<number>(`${API_BASE}/Users/count${countSuffix}`, {
      headers: getAuthHeaders(),
    });
    const newTotalPages = Math.max(1, Math.ceil(total / itemsPerPage));
    const safePage = Math.min(currentPage, newTotalPages);
    await fetchUsersPaginate(safePage, itemsPerPage, roleFilter || undefined);
    setTotalRecords(total);
    onCountChange(total);
    setTotalPages(newTotalPages);
    setCurrentPage(safePage);
  }, [query, canSearchUsers, roleFilter, itemsPerPage, currentPage, fetchUsers, fetchUsersPaginate, onCountChange]);

  const goToPage = async (page: number) => {
    if (page < 1 || query.trim()) return;
    setError(null);
    try {
      const cacheKey = `users-page-${page}-${itemsPerPage}-${roleFilter}`;
      const cached = getCachedData<User[]>(cacheKey);

      const countParams = new URLSearchParams();
      if (roleFilter) countParams.set('role', roleFilter);
      const countSuffix = countParams.toString() ? `?${countParams.toString()}` : '';
      const total = await apiFetch<number>(`${API_BASE}/Users/count${countSuffix}`, {
        headers: getAuthHeaders(),
      });
      const newTotalPages = Math.max(1, Math.ceil(total / itemsPerPage));
      const safePage = Math.min(page, newTotalPages);

      if (cached && safePage === page) {
        useUserStore.setState({
          users: cached,
          filteredUsers: cached,
        });
      } else {
        await fetchUsersPaginate(safePage, itemsPerPage, roleFilter || undefined);
      }

      setTotalRecords(total);
      onCountChange(total);
      setCurrentPage(safePage);
      setTotalPages(newTotalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failedToLoadUsers'));
    }
  };

  useEffect(() => {
    const load = async () => {
      if (isFresh('users-page-1')) {
        setLoading(false);
        isFirstLoad.current = false;
        didLoadOnce.current = true;
        return;
      }
      const first = isFirstLoad.current;
      if (first) setLoading(true);
      setError(null);
      try {
        await fetchRoles();
        const q = useUserStore.getState().query.trim();
        if (q && canSearchUsers) {
          await fetchUsers(roleFilter || undefined);
        } else {
          await loadPaginatedFirstPage();
        }
        markFresh('users-page-1');
      } catch (err) {
        setError(err instanceof Error ? err.message : t('failedToLoadUsers'));
      } finally {
        if (first) {
          setLoading(false);
          isFirstLoad.current = false;
        }
        didLoadOnce.current = true;
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!didLoadOnce.current) return;
    void reloadList();
  }, [reloadKey, reloadList]);

  useEffect(() => {
    if (!didLoadOnce.current) return;
    const q = query.trim();
    if (q && canSearchUsers) {
      void fetchUsers(roleFilter || undefined);
      return;
    }
    void loadPaginatedFirstPage();
  }, [roleFilter, itemsPerPage, query, canSearchUsers, fetchUsers, loadPaginatedFirstPage]);

  useEffect(() => {
    if (!canSearchUsers) return;
    const q = query.trim();
    if (!q) return;
    const id = window.setTimeout(() => {
      if (useUserStore.getState().query.trim() !== q) return;
      void fetchUsers(roleFilter || undefined);
    }, 300);
    return () => window.clearTimeout(id);
  }, [query, roleFilter, canSearchUsers, fetchUsers]);

  useEffect(() => {
    const prev = prevQueryRef.current;
    prevQueryRef.current = query;
    if (prev !== null && prev.trim().length > 0 && !query.trim()) {
      void loadPaginatedFirstPage();
    }
  }, [query, loadPaginatedFirstPage]);

  const hoverTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const onPaginationHover = (page: number) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      const key = `users-page-${page}-${itemsPerPage}-${roleFilter}`;
      const params = new URLSearchParams({ page: String(page), pageSize: String(itemsPerPage) });
      if (roleFilter) params.set('role', roleFilter);
      prefetchData<User[]>(key, () =>
        apiFetch<User[]>(`${API_BASE}/Users/paginate?${params.toString()}`, {
          cache: 'no-store',
          headers: getAuthHeaders(),
        }),
      );
    }, 300);
  };

  const onPaginationLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
  };

  const handleDelete = async (user: User) => {
    try {
      await deleteUser(user.id);
      await reloadList();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failedToLoadUsers'));
    }
  };

  if (error && !loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-red-600">{error}</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-gray-900">
          {t('allUsers')}
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <span>{t('perPage')}</span>
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 focus:border-slate-400 focus:ring-0"
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value) as PageSizeChoice)}
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <span>{t('role')}</span>
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 focus:border-slate-400 focus:ring-0"
              value={roleFilter}
              onChange={(e) => setRoleFilter((e.target.value || '') as UserRole | '')}
            >
              <option value="">{t('sortDefault')}</option>
              {roles.map((r) => (
                <option key={r.id} value={r.name}>
                  {t(roleLabelKey(r.name))}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
        ) : (
          <>
            {filteredUsers.map((user: User) => (
              <div
                key={user.id}
                className="flex flex-row flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
              >
                <FaUserCircle className="shrink-0 text-gray-500" size={22} />
                <div className="min-w-0 flex flex-1 items-center justify-between gap-4 text-xs md:text-sm">
                  <div className="min-w-0 truncate">
                    <span className="font-semibold text-gray-800">
                      {user.name || user.phoneNumber}
                    </span>
                    {user.name && (
                      <span className="ms-1 text-slate-500">{user.phoneNumber}</span>
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
                  {canEditUser && (
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                      onClick={() => onEdit(user)}
                      title={t('editUser')}
                    >
                      <FaPencilAlt size={12} className="me-1" />
                      {t('edit')}
                    </button>
                  )}
                  {canChangeRole && (
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-lg border border-amber-200 bg-white px-2.5 py-1.5 text-xs text-amber-700 hover:bg-amber-50"
                      onClick={() => onChangeRole(user)}
                      title={t('changeRole')}
                    >
                      <FaUserTag size={12} className="me-1" />
                      {t('changeRole')}
                    </button>
                  )}
                  {canViewUser && (
                    <Link
                      href={`/users/${user.id}`}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                    >
                      {t('view')}
                    </Link>
                  )}
                  {canDeleteUser && (
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(user)}
                      title={t('deleteUser')}
                    >
                      <FaTrash size={12} className="me-1" />
                      {t('delete')}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {filteredUsers.length === 0 && (
              <div className="py-6 text-center text-xs text-gray-500">
                {query.trim() ? t('noUsersMatchFilters') : t('noUsersYet')}
              </div>
            )}

            {!query.trim() && (
              <div className="mt-4 flex items-center justify-center gap-1 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 disabled:opacity-50"
                  disabled={currentPage <= 1}
                  onClick={() => goToPage(currentPage - 1)}
                  onMouseEnter={() => currentPage > 1 && onPaginationHover(currentPage - 1)}
                  onMouseLeave={onPaginationLeave}
                >
                  &#8249;
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`rounded px-2.5 py-1.5 text-sm ${p === currentPage ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                    onClick={() => goToPage(p)}
                    onMouseEnter={() => p !== currentPage && onPaginationHover(p)}
                    onMouseLeave={onPaginationLeave}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 disabled:opacity-50"
                  disabled={currentPage >= totalPages}
                  onClick={() => goToPage(currentPage + 1)}
                  onMouseEnter={() => currentPage < totalPages && onPaginationHover(currentPage + 1)}
                  onMouseLeave={onPaginationLeave}
                >
                  &#8250;
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
