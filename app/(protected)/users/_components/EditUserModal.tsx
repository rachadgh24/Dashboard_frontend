'use client';

import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserStore, type User } from '@/store/usersState';

type Props = {
  user: User;
  onClose: () => void;
  onSaved: () => void;
};

export default function EditUserModal({ user, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const updateUser = useUserStore((s) => s.updateUser);

  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber ?? '');
  const [name, setName] = useState(user.name ?? '');
  const [lastName, setLastName] = useState(user.lastName ?? '');
  const [city, setCity] = useState(user.city ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateUser(user.id, {
        phoneNumber: phoneNumber.trim() || undefined,
        name: name.trim() || undefined,
        lastName: lastName.trim() || undefined,
        city: city.trim() || undefined,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failedToLoadUsers'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {t('editUser')} (ID: {user.id})
        </h2>
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600">
              {t('phoneNumber')}
            </label>
            <input
              type="tel"
              className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm text-black"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">
              {t('name')}
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm text-black"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">
              {t('lastName')}
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm text-black"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">
              {t('city')}
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm text-black"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
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
