import { ProductVariation } from "../product/productTypes";

export interface VariantState {
  variants: ProductVariation[];
  loading: boolean;
  error: string | null;
  lastCreatedVariant: ProductVariation | null;
}

export interface CreateVariantPayload {
  color: string;
  size: string;
  sku: string;
  stock: number;
  product: string;
  image?: File | null;
}
