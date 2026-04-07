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

  deleteChild: (childId: string) =>
    request<{ deleted: boolean }>(`/children/${childId}`, {
      method: 'DELETE',
    }),

  getAvatarUploadUrl: (childId: string, contentType: string) =>
    request<{ uploadUrl: string; avatarUrl: string }>(`/children/${childId}/avatar`, {
      method: 'POST',
      body: JSON.stringify({ contentType }),
    }),

  async uploadAvatar(childId: string, file: File) {
    const { uploadUrl, avatarUrl } = await this.getAvatarUploadUrl(childId, file.type);
    await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    return avatarUrl;
  },
};
