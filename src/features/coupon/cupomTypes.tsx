// couponTypes.tsx

export interface ICoupon {
  _id: string;
  code: string;
  discount: number;
  type: "percentage" | "fixed";
  assignedTo?: string;
  usedAt?: string | null;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageCount?: number;
}

export interface IValidateCouponRequest {
  code: string;
  userId?: string;
  totalPrice: number;
}

export interface IValidateCouponResponse {
  coupon: ICoupon;
  discountValue: number;
  finalPrice: number;
}

export interface IUseCouponRequest {
  code: string;
  userId?: string; // Opcional, mas necessário para cupons atribuídos a usuários
}

export interface ICreateCouponRequest {
  code: string;
  discount: number;
  type: "percentage" | "fixed";
  expiresAt: string;
  assignedTo?: string;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  isActive?: boolean;
}

export interface IUpdateCouponRequest {
  id: string;
  data: Partial<ICreateCouponRequest>;
}

export interface CouponState {
  coupons: ICoupon[];
  selectedCoupon: ICoupon | null;
  validatedCoupon: IValidateCouponResponse | null;
  loading: boolean;
  error: string | null;
  success: boolean;
}
