import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { useUserStore } from '@/store/usersState';
import { server } from '@/__tests__/mocks/server';

/** Matches UserModel JSON from API (camelCase). */
function userDto(id: number, phoneNumber = '+100', name = 'U', role = 'Admin') {
  return { id, phoneNumber, name, role };
}

describe('useUserStore', () => {
  beforeEach(() => {
    useUserStore.setState({
      users: [],
      filteredUsers: [],
      roles: [],
      query: '',
    });
    localStorage.clear();
  });

  it('fetchUsers with empty data clears lists', async () => {
    // Why: zero users after filter must not leave stale rows.
    server.use(http.get('http://api.test/Users', () => HttpResponse.json({ data: [] })));

    await useUserStore.getState().fetchUsers();

    expect(useUserStore.getState().users).toEqual([]);
  });

  it('fetchUsersPaginate applies query filter to new page', async () => {
    // Why: text filter should re-run when paginated data arrives.
    useUserStore.setState({ query: '99' });
    server.use(
      http.get('http://api.test/Users/paginate', () =>
        HttpResponse.json({ data: [userDto(1, '+1999', 'Ann', 'Admin')] }),
      ),
    );

    await useUserStore.getState().fetchUsersPaginate(1, 10);

    const { filteredUsers } = useUserStore.getState();
    expect(filteredUsers).toHaveLength(1);
    expect(filteredUsers[0].phoneNumber).toContain('99');
  });

  it('updateUser replaces row from ApiResponse', async () => {
    // Why: PUT must use same envelope as backend for DTO parity.
    useUserStore.setState({ users: [userDto(1, '+1', 'Old', 'Admin')] });
    const updated = userDto(1, '+1', 'New', 'Admin');
    server.use(
      http.put('http://api.test/Users/1', () => HttpResponse.json({ data: updated })),
    );

    await useUserStore.getState().updateUser(1, { name: 'New' });

    expect(useUserStore.getState().users[0].name).toBe('New');
  });
});
