import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { useNotificationStore } from '@/store/notificationsState';
import { server } from '@/__tests__/mocks/server';

describe('useNotificationStore', () => {
  beforeEach(() => {
    useNotificationStore.setState({ notifications: [], loading: false, error: null });
    localStorage.clear();
  });

  it('fetchNotifications maps DTO createdAt string to timestamp', async () => {
    // Why: .NET returns DateTime as ISO string; UI stores numeric sort keys.
    const iso = '2026-01-15T12:00:00.000Z';
    server.use(
      http.get('http://api.test/notifications', () =>
        HttpResponse.json({
          data: [{ id: 1, message: 'm', createdAt: iso }],
        }),
      ),
    );

    await useNotificationStore.getState().fetchNotifications();

    const n = useNotificationStore.getState().notifications[0];
    expect(n.message).toBe('m');
    expect(n.createdAt).toBe(new Date(iso).getTime());
  });

  it('fetchNotifications with empty array ends loading', async () => {
    // Why: zero notifications is a normal success path.
    server.use(
      http.get('http://api.test/notifications', () => HttpResponse.json({ data: [] })),
    );

    await useNotificationStore.getState().fetchNotifications();

    expect(useNotificationStore.getState().loading).toBe(false);
    expect(useNotificationStore.getState().notifications).toEqual([]);
  });

  it('removeNotification calls DELETE and updates local list', async () => {
    // Why: single delete must sync server soft-delete with optimistic UI removal.
    useNotificationStore.setState({
      notifications: [
        { id: 1, message: 'a', createdAt: 1 },
        { id: 2, message: 'b', createdAt: 2 },
      ],
    });
    server.use(
      http.delete('http://api.test/notifications/1', () =>
        HttpResponse.json({ data: null }),
      ),
    );

    await useNotificationStore.getState().removeNotification(1);

    expect(useNotificationStore.getState().notifications.map((x) => x.id)).toEqual([2]);
  });
});
