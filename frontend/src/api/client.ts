const API_URL = (import.meta.env.VITE_API_URL as string).replace(/\/$/, '');

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  listChildren: () =>
    request<{ children: import('../types').Child[] }>('/children'),

  getChild: (childId: string) =>
    request<import('../types').Child>(`/children/${childId}`),

  createChild: (data: { name: string; avatarIndex?: number }) =>
    request<import('../types').Child>('/children', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateChild: (childId: string, data: { name?: string; avatarIndex?: number }) =>
    request<import('../types').Child>(`/children/${childId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getTransactions: (childId: string, limit = 20, lastKey?: string) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (lastKey) params.set('lastKey', lastKey);
    return request<import('../types').TransactionListResponse>(
      `/children/${childId}/transactions?${params}`,
    );
  },

  postTransaction: (childId: string, data: {
    personName: string;
    amount: number;
    type: 'income' | 'expense';
    memo?: string;
  }) =>
    request<import('../types').Transaction>(`/children/${childId}/transactions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
