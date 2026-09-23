/**
 * Order types aligned with backend Mongoose schema
 */

export type OrderStatus =
  | "pendente"
  | "confirmado"
  | "enviado"
  | "entregue"
  | "cancelado";
export type PaymentMethod = "cartao" | "transferencia" | "mpesa" | "emola" | "numerario";

export interface OrderProduct {
  product?: string; // Product ObjectId
  variation?: string; // Variation ObjectId
  quantity: number;
  price: number; // Price at order time
  // Product details (populated from backend)
  name?: string;
  category?: string;
  image?: string;
  imageCover?: string;
  color?: string;
  size?: string;
}

export interface OrderUser {
  _id?: string;
  name: string;
  email: string;
  phone?: string;
}

export interface Order {
  _id?: string;
  id?: string;
  user: string | OrderUser; // User ObjectId or populated user object
  products: OrderProduct[];
  totalPrice: number;
  totalItems?: number; // Number of items in order
  discount?: number;
  finalPrice: number;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  paid: boolean;
  paidAt?: Date;
  deliveryDate?: Date;
  clientConfirmed?: boolean; // Cliente confirmou recebimento
  clientConfirmedAt?: Date; // Data da confirmação pelo cliente
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateOrderPayload {
  products: OrderProduct[];
  discount?: number;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

export interface UpdateOrderPayload {
  status?: OrderStatus;
  paymentMethod?: PaymentMethod;
  paid?: boolean;
  paidAt?: Date;
  deliveryDate?: Date;
  notes?: string;
  discount?: number;
}

export interface ApiResponse {
  status: "success" | "fail" | "error";
  message: string;
  data?: Order | Order[] | Record<string, unknown>;
}

export interface OrdersState {
  orders: Order[];
  currentOrder: Order | null;
  loading: boolean;
  error: string | null;
}
