import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { useCustomerStore } from '@/store/customersState';
import { server } from '@/__tests__/mocks/server';

/** Customer JSON aligned with CustomerModel / System.Text.Json camelCase. */
function customerDto(id: number, name = 'N', lastName = 'L', city = 'C', email = 'e@e.e') {
  return { id, name, lastName, city, email, cars: [] as unknown[] };
}

describe('useCustomerStore', () => {
  beforeEach(() => {
    useCustomerStore.setState({
      customers: [],
      filteredCustomers: [],
      SelectedCustomer: undefined,
      query: '',
    });
    localStorage.clear();
  });

  it('fetchCustomers maps empty data array', async () => {
    // Why: zero customers is valid; store must normalize to [] without throwing.
    server.use(
      http.get('http://api.test/Customers', () => HttpResponse.json({ data: [] })),
    );

    await useCustomerStore.getState().fetchCustomers();

    expect(useCustomerStore.getState().customers).toEqual([]);
    expect(useCustomerStore.getState().filteredCustomers).toEqual([]);
  });

  it('fetchCustomers maps many customers from ApiResponse', async () => {
    // Why: list endpoint returns { data: CustomerModel[] }; shapes must match UI types.
    const rows = [customerDto(1, 'A'), customerDto(2, 'B')];
    server.use(
      http.get('http://api.test/Customers', () => HttpResponse.json({ data: rows })),
    );

    await useCustomerStore.getState().fetchCustomers();

    expect(useCustomerStore.getState().customers).toHaveLength(2);
    expect(useCustomerStore.getState().customers[0].name).toBe('A');
  });

  it('fetchCustomersPaginate replaces list with page slice', async () => {
    // Why: pagination boundaries must replace in-memory list with the current page only.
    const rows = [customerDto(10)];
    server.use(
      http.get('http://api.test/Customers/paginate', ({ request }) => {
        expect(new URL(request.url).searchParams.get('page')).toBe('2');
        expect(new URL(request.url).searchParams.get('pageSize')).toBe('5');
        return HttpResponse.json({ data: rows });
      }),
    );

    await useCustomerStore.getState().fetchCustomersPaginate(2, 5);

    expect(useCustomerStore.getState().customers).toEqual(rows);
  });

  it('updateCustomer merges ApiResponse data into state', async () => {
    // Why: PUT returns ApiResponse<CustomerModel>; store must read wrapped data, not raw root.
    useCustomerStore.setState({ customers: [customerDto(1, 'Old')] });
    const updated = customerDto(1, 'New');
    server.use(
      http.put('http://api.test/Customers/1', async () =>
        HttpResponse.json({ data: updated }),
      ),
    );

    await useCustomerStore.getState().updateCustomer(1, {
      name: 'New',
      lastName: 'L',
      city: 'C',
      email: 'e@e.e',
    });

    expect(useCustomerStore.getState().customers[0].name).toBe('New');
  });

  it('deleteCustomer removes id after successful ApiResponse', async () => {
    // Why: DELETE returns { data: null }; client should still prune local state.
    useCustomerStore.setState({ customers: [customerDto(1), customerDto(2)] });
    server.use(
      http.delete('http://api.test/Customers/1', () =>
        HttpResponse.json({ data: null }),
      ),
    );

    await useCustomerStore.getState().deleteCustomer(1);

    expect(useCustomerStore.getState().customers.map((c) => c.id)).toEqual([2]);
  });
});
