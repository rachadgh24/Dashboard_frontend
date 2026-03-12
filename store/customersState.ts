import { create } from 'zustand';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://localhost:7190';
const CUSTOMERS_API = `${API_BASE}/Customers`;

const getAuthHeaders = () => {
  const headers: Record<string, string> = {};
  if (typeof window === 'undefined') return headers;
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const searchCustomersRequest = async (query: string): Promise<Customer[]> => {
  const res = await fetch(`${CUSTOMERS_API}/search?query=${encodeURIComponent(query)}`, {
    cache: 'no-store',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Unauthorized: please sign in again.');
    }
    throw new Error('Failed to search customers');
  }

  return res.json();
};

export interface Customer {
  id: number;
  name: string;
  lastName: string;
  city: string;
  email?: string;
}

export interface CreateCustomerPayload {
  name: string;
  lastName: string;
  city: string;
  email: string;
}

interface CustomerStore {
  customers: Customer[];
  SelectedCustomer?: Customer;
  filteredCustomers: Customer[];
  setSelectedCustomer: (customer: Customer) => void;
  fetchCustomers: () => Promise<void>;
  fetchCustomersPaginate: (page: number) => Promise<number>;
  fetchCustomer: (id: string) => Promise<void>;
  searchCustomers: (query: string) => Promise<void>;
  createCustomer: (payload: CreateCustomerPayload) => Promise<void>;
  updateCustomer: (id: number, payload: Omit<Customer, 'id'>) => Promise<void>;
  deleteCustomer: (id: number) => Promise<void>;
  query: string;
  setQuery: (q: string) => void;
}

export const useCustomerStore = create<CustomerStore>((set, get) => {
  const syncFilteredCustomers = async (customers: Customer[]) => {
    const normalizedQuery = get().query.trim();

    if (!normalizedQuery) {
      set({ filteredCustomers: customers });
      return;
    }

    const results = await searchCustomersRequest(normalizedQuery);
    set({ filteredCustomers: results });
  };

  return {
    customers: [],
    filteredCustomers: [],
    SelectedCustomer: undefined,

    fetchCustomers: async () => {
      const res = await fetch(CUSTOMERS_API, {
        cache: 'no-store',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Unauthorized: please sign in again.');
        }
        throw new Error('Failed to fetch customers');
      }
      const data: Customer[] = await res.json();
      set({ customers: data });
      await syncFilteredCustomers(data);
    },

    fetchCustomersPaginate: async (page) => {
      const res = await fetch(`${CUSTOMERS_API}/paginate?page=${page}`, {
        cache: 'no-store',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Unauthorized: please sign in again.');
        }
        throw new Error('Failed to fetch customers');
      }
      const data: Customer[] = await res.json();
      set({ customers: data, filteredCustomers: data });
      return data.length;
    },

    fetchCustomer: async (id: string) => {
      const res = await fetch(`${CUSTOMERS_API}/${id}`, {
        cache: 'no-store',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Unauthorized: please sign in again.');
        }
        throw new Error('Failed to fetch customer');
      }
      const data: Customer = await res.json();
      set({ SelectedCustomer: data, filteredCustomers: [data] });
    },

    searchCustomers: async (query) => {
      const normalizedQuery = query.trim();

      if (!normalizedQuery) {
        set({ filteredCustomers: get().customers });
        return;
      }

      const data = await searchCustomersRequest(normalizedQuery);
      set({ filteredCustomers: data });
    },

    createCustomer: async (payload: CreateCustomerPayload) => {
      const res = await fetch(CUSTOMERS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Unauthorized: please sign in again.');
        }
        throw new Error('Failed to create customer');
      }
      const body = await res.json();
      const created: Customer = body.customer ?? body;
      const customers = [...get().customers, created];

      set({ customers });
      await syncFilteredCustomers(customers);
    },

    updateCustomer: async (id, payload) => {
      const res = await fetch(`${CUSTOMERS_API}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ id, ...payload }),
      });
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Unauthorized: please sign in again.');
        }
        throw new Error('Failed to update customer');
      }
      const updated: Customer = await res.json();
      const customers = get().customers.map((c) => (c.id === id ? updated : c));
      const selectedCustomer =
        get().SelectedCustomer?.id === id ? updated : get().SelectedCustomer;

      set({ customers, SelectedCustomer: selectedCustomer });
      await syncFilteredCustomers(customers);
    },

    deleteCustomer: async (id) => {
      const res = await fetch(`${CUSTOMERS_API}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Unauthorized: please sign in again.');
        }
        throw new Error('Failed to delete customer');
      }

      const customers = get().customers.filter((c) => c.id !== id);
      const selectedCustomer =
        get().SelectedCustomer?.id === id ? undefined : get().SelectedCustomer;

      set({ customers, SelectedCustomer: selectedCustomer });
      await syncFilteredCustomers(customers);
    },

    setSelectedCustomer: (customer) => set({ SelectedCustomer: customer }),

    query: '',
    setQuery: (q) => set({ query: q }),
  };
});
