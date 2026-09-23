export interface ApiResponse {
  status?: string;
  message?: string;
}

export interface SalesByStatusItem {
  status: string;
  count: number;
  total: number;
}

export interface TopClientItem {
  id: string;
  name: string;
  totalSpent: number;
  orders: number;
}

export interface SalesByPeriodItem {
  period: string; // e.g., '2025-11' or '2025-11-01'
  total: number;
  orders: number;
}

export interface ProductSalesItem {
  productId: string;
  productName: string;
  productImage: string;
  category: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
}

export interface ReportState {
  totalRevenue: number;
  averageTicket: number;
  totalOrders: number;
  deliveryRate: number; // percentage 0-100
  salesByStatus: SalesByStatusItem[];
  topClients: TopClientItem[];
  topProducts: ProductSalesItem[];
  leastSoldProducts: ProductSalesItem[];
  salesByPeriod: SalesByPeriodItem[];
  loading: boolean;
  error?: string | null;
}

export type PeriodRange = { start?: string; end?: string };

export {};
