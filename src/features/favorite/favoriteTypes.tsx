import { Product } from '../products/productTypes';

export interface FavoriteItem {
  _id: string;
  product: Product;
  addedAt: string;
}

export interface Favorite {
  _id: string;
  user: string;
  items: FavoriteItem[];
  createdAt: string;
  updatedAt: string;
}

export interface FavoritesState {
  favorites: FavoriteItem[];
  loading: boolean;
  error: string | null;
  success: boolean;
}

export interface ApiResponse<T = any> {
  status?: string;
  message?: string;
  data?: T;
  results?: number;
}

export interface AddToFavoritesPayload {
  productId: string;
}

export interface RemoveFromFavoritesPayload {
  productId: string;
}