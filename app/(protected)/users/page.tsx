'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissionsStore } from '@/store/permissionsState';
import { type User } from '@/store/usersState';
import { Skeleton, SkeletonRow } from '../components/skeletons/Skeleton';
import CreateUserSection from './_components/CreateUserSection';
import UserSearchSection from './_components/UserSearchSection';
import UserListSection from './_components/UserListSection';
import EditUserModal from './_components/EditUserModal';
import ChangeRoleModal from './_components/ChangeRoleModal';

export default function UsersPage() {
  const router = useRouter();
  const permissionsLoaded = usePermissionsStore((s) => s.loaded);
  const hasClaim = usePermissionsStore((s) => s.hasClaim);
  const canAccessUsers = hasClaim('ViewUsers');
  const canSearchUsers = hasClaim('SearchUsers');

  const [reloadKey, setReloadKey] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [roleUser, setRoleUser] = useState<User | null>(null);

  useEffect(() => {
    if (permissionsLoaded && !canAccessUsers) {
      router.replace('/home');
    }
  }, [permissionsLoaded, canAccessUsers, router]);

  if (!permissionsLoaded || !canAccessUsers) {
    return (
      <main className="min-h-full bg-transparent">
        <div className="mx-auto flex max-w-5xl flex-col gap-8">
          <section className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-9 w-full rounded-lg" />
              <div className="grid gap-2 md:grid-cols-2">
                <Skeleton className="h-9 w-full rounded-lg" />
                <Skeleton className="h-9 w-full rounded-lg" />
              </div>
              <Skeleton className="h-9 w-28 rounded-lg" />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </section>
        </div>
      </main>
    );
  }

  const triggerReload = () => setReloadKey((k) => k + 1);

  return (
    <main className="min-h-full bg-transparent">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <section className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <CreateUserSection onCreated={triggerReload} totalRecords={totalRecords} />
          {canSearchUsers && <UserSearchSection />}
        </section>

        <UserListSection
          reloadKey={reloadKey}
          onEdit={setEditUser}
          onChangeRole={setRoleUser}
          onCountChange={setTotalRecords}
        />
      </div>

      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={() => { setEditUser(null); triggerReload(); }}
        />
      )}

      {roleUser && (
        <ChangeRoleModal
          user={roleUser}
          onClose={() => setRoleUser(null)}
          onSaved={() => { setRoleUser(null); triggerReload(); }}
        />
      )}
    </main>
  );
}
