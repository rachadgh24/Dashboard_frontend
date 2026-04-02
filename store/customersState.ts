import { create } from 'zustand';
import { API_BASE } from '@/lib/apiBase';
import { apiFetch } from '@/lib/apiClient';
const CUSTOMERS_API = `${API_BASE}/Customers`;

const getAuthHeaders = () => {
  const headers: Record<string, string> = {};
  if (typeof window === 'undefined') return headers;
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const searchCustomersRequest = async (query: string): Promise<Customer[]> => {
  const data = await apiFetch<Customer[]>(`${CUSTOMERS_API}/search?query=${encodeURIComponent(query)}`, {
    cache: 'no-store',
    headers: getAuthHeaders(),
  });
  return data ?? [];
};

export interface Car {
  id: number;
  model: string;
  maxSpeed: number;
  customerId?: number;
  CustomerId?: number;
}

export interface Customer {
  id: number;
  name: string;
  lastName: string;
  city: string;
  email?: string;
  cars?: Car[];
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
  fetchCustomersPaginate: (page: number, pageSize: number, sortBy?: string) => Promise<void>;
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
      const data = await apiFetch<Customer[]>(CUSTOMERS_API, { cache: 'no-store', headers: getAuthHeaders() });
      const customers = data ?? [];
      set({ customers });
      await syncFilteredCustomers(customers);
    },

    fetchCustomersPaginate: async (page, pageSize, sortBy) => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (sortBy) params.set('sortBy', sortBy);
      const data = await apiFetch<Customer[]>(`${CUSTOMERS_API}/paginate?${params.toString()}`, {
        cache: 'no-store',
        headers: getAuthHeaders(),
      });
      const customers = data ?? [];
      set({ customers, filteredCustomers: customers });
    },

    fetchCustomer: async (id: string) => {
      const data = await apiFetch<Customer>(`${CUSTOMERS_API}/${id}`, { cache: 'no-store', headers: getAuthHeaders() });
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
      const data = await apiFetch<{ customer?: Customer } | Customer>(CUSTOMERS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });
      const created: Customer = (data as { customer?: Customer })?.customer ?? (data as Customer);
      const customers = [...get().customers, created];
      set({ customers });
      await syncFilteredCustomers(customers);
    },

    updateCustomer: async (id, payload) => {
      const updated = await apiFetch<Customer>(`${CUSTOMERS_API}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ id, ...payload }),
      });
      const customers = get().customers.map((c) => (c.id === id ? updated : c));
      const selectedCustomer =
        get().SelectedCustomer?.id === id ? updated : get().SelectedCustomer;

      set({ customers, SelectedCustomer: selectedCustomer });
      await syncFilteredCustomers(customers);
    },

    deleteCustomer: async (id) => {
      await apiFetch<null>(`${CUSTOMERS_API}/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
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
