export type ThemeColor = 'pink' | 'mint' | 'sun' | 'lavender';

export interface Child {
  childId: string;
  name: string;
  balance: number;
  avatarIndex: number;
  avatarUrl?: string;
  color?: ThemeColor;
  deco?: string[];
  createdAt: string;
}

export interface Transaction {
  id: string;
  date: string;
  personName: string;
  amount: number;
  type: 'income' | 'expense';
  memo: string | null;
  balanceAfter: number;
}

export interface TransactionListResponse {
  items: Transaction[];
  lastKey?: string;
}
