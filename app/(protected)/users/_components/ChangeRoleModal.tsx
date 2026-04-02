'use client';

import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserStore, type User, type UserRole } from '@/store/usersState';

function roleLabelKey(role: UserRole): string {
  const normalized = String(role).toLowerCase().replace(/\s/g, '');
  if (normalized === 'admin') return 'roleAdmin';
  if (normalized === 'socialmediamanager') return 'roleSocialMediaManager';
  if (normalized === 'generalmanager') return 'roleGeneralManager';
  return role;
}

type Props = {
  user: User;
  onClose: () => void;
  onSaved: () => void;
};

export default function ChangeRoleModal({ user, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const roles = useUserStore((s) => s.roles);
  const changeRole = useUserStore((s) => s.changeRole);

  const [newRole, setNewRole] = useState<UserRole>(
    (user.role as UserRole) || 'General Manager',
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await changeRole(user.id, newRole);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failedToLoadUsers'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {t('changeRole')} &mdash; {user.phoneNumber}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600">
              {t('role')}
            </label>
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm text-black"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as UserRole)}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.name}>
                  {t(roleLabelKey(r.name))}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-50"
              disabled={saving}
            >
              {t('saveChanges')}
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              onClick={onClose}
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
