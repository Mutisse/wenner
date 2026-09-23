export interface Color {
  _id: string;
  product: string;
  color: string; // O valor hexadecimal da cor
  size?: string; // Tamanho associado a esta cor (quando colors contém variantes)
}

export interface Product {
  _id: string;
  id?: string;
  name: string;
  price: number;
  originalPrice?: number;
  imageCover: string;
  category: string;
  gender: string;
  colors?: Color[]; // Virtual populate para variantes
  availableColors?: string[]; // Cores para produtos sem variantes
  availableSizes?: string[]; // Tamanhos para produtos sem variantes
  sizes?: string[]; // Deprecated - usar availableSizes
  rating: number;
  ratingsAverage: number;
  ratingsQuantity: number;
  description: string;
  priceDiscount?: number;
  stock?: number; // Estoque para produtos sem variantes
  slug: string;
  createdAt: string;
  updatedAt?: string;
  variations?: ProductVariation[];
  variants?: ProductVariation[];
  images?: string[];
}

export interface ProductVariation {
  _id: string;
  product: string | { _id?: string; id?: string; name?: string; imageCover?: string; category?: string };
  sku: string;
  color: string;
  size: string;
  price?: number;
  stock: number;
  image: string;
}

export interface Filters {
  gender: string[];
  categories: string[];
  colors: string[];
  priceRange: [number, number];
  rating: number[];
}

export interface ProductsState {
  products: Product[];
  filteredProducts: Product[];
  currentProduct: Product | null;
  relatedProducts: Product[];
  loading: boolean;
  error: string | null;
  filters: Filters;
  searchQuery: string;
}

export interface ApiResponse<T = any> {
  status?: string;
  message?: string;
  data?: T;
  results?: number;
}

export interface ProductsResponse {
  status: string;
  results?: number;
  data: {
    products: Product[];
  };
}

export interface ProductResponse {
  status: string;
  data: {
    product: Product;
  };
}
