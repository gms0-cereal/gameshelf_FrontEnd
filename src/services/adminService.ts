import type { MetricCardData, OrderItem } from '../types/admin';

export const getAdminMetrics = (): MetricCardData[] => [
  { title: 'Total Revenue', value: '$48,920.00', change: '+8.1%', isPositive: true },
  { title: 'Total Users', value: '12,450', change: '+12.5%', isPositive: true },
  { title: 'Games in Shelf', value: '1,820', change: '+3.2%', isPositive: true },
  { title: 'Pending Orders', value: '342', change: '-1.4%', isPositive: false },
];

export const getRecentOrders = (): OrderItem[] => [
  { id: 'ORD-9901', customer: 'Miguel Achurra', total: '$59.99', status: 'Completed', date: '2026-10-16' },
  { id: 'ORD-9902', customer: 'John Doe', total: '$29.99', status: 'Pending', date: '2026-10-17' },
  { id: 'ORD-9903', customer: 'Jane Smith', total: '$104.98', status: 'Cancelled', date: '2026-10-15' },
];