export interface MetricCardData {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
}

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'User' | 'Moderator';
  status: 'Active' | 'Inactive' | 'Pending';
  joinedDate: string;
}

export interface OrderItem {
  id: string;
  customer: string;
  total: string;
  status: 'Completed' | 'Pending' | 'Cancelled';
  date: string;
}