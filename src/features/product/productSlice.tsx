// features/products/productSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ProductsState, Filters } from "./productTypes";
import {
  fetchProducts,
  fetchAllProductsForAdmin,
  createProduct,
  fetchProductBySlug,
  fetchRelatedProducts,
  updateProduct,
  deleteProduct,
} from "./productActions";

const initialState: ProductsState = {
  products: [],
  filteredProducts: [],
  currentProduct: null,
  relatedProducts: [],
  loading: false,
  error: null,
  filters: {
    gender: [],
    categories: [],
    colors: [],
    priceRange: [0, 200],
    rating: [],
  },
  searchQuery: "",
};

const productSlice = createSlice({
  name: "product",
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Filters>) => {
      state.filters = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    resetFilters: (state) => {
      state.filters = {
        gender: [],
        categories: [],
        colors: [],
        priceRange: [0, 200],
        rating: [],
      };
      state.searchQuery = "";
    },
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
      state.relatedProducts = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.products = action.payload;
        state.filteredProducts = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.products = [];
      })
      // Fetch All Products For Admin (inclui produtos fora de estoque)
      .addCase(fetchAllProductsForAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllProductsForAdmin.fulfilled, (state, action) => {
        state.products = action.payload;
        state.filteredProducts = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchAllProductsForAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.products = [];
      })
      // Fetch Product By Slug
      .addCase(fetchProductBySlug.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductBySlug.fulfilled, (state, action) => {
        state.currentProduct = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchProductBySlug.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.currentProduct = null;
      })
      // Create Product
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        // Backend retorna: { status: 'success', data: { data: doc } }
        // action.payload é response.data, então action.payload.data.data é o produto
        const product = action.payload?.data?.data || action.payload?.data;
        if (product) {
          const normalizedProduct = {
            ...product,
            id: product._id || product.id,
          };
          state.products.push(normalizedProduct);
          state.filteredProducts.push(normalizedProduct);
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        // action.payload pode ser um objeto com message ou uma string
        const errorMessage =
          typeof action.payload === "object" && action.payload?.message
            ? action.payload.message
            : typeof action.payload === "string"
            ? action.payload
            : "Erro ao criar produto";
        state.error = errorMessage;
      })
      // Update Product
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        const updated = action.payload;

        // Normalizar ID do produto atualizado (algumas responses usam `id`, outras `_id`)
        const updatedId = (updated as any)._id || (updated as any).id;

        state.products = state.products.map((product) => {
          const pid = (product as any)._id || (product as any).id;
          return pid === updatedId ? { ...product, ...updated } : product;
        });

        state.filteredProducts = state.filteredProducts.map((product) => {
          const pid = (product as any)._id || (product as any).id;
          return pid === updatedId ? { ...product, ...updated } : product;
        });

        if (state.currentProduct) {
          const currentId =
            (state.currentProduct as any)._id ||
            (state.currentProduct as any).id;
          if (currentId === updatedId) {
            state.currentProduct = { ...state.currentProduct, ...updated };
          }
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete Product
      .addCase(deleteProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        const deletedId = action.payload;

        state.products = state.products.filter(
          (product) => product._id !== deletedId && product.id !== deletedId
        );

        state.filteredProducts = state.filteredProducts.filter(
          (product) => product._id !== deletedId && product.id !== deletedId
        );

        if (
          state.currentProduct &&
          (state.currentProduct._id === deletedId ||
            state.currentProduct.id === deletedId)
        ) {
          state.currentProduct = null;
        }
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Related Products
      .addCase(fetchRelatedProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRelatedProducts.fulfilled, (state, action) => {
        state.relatedProducts = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchRelatedProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.relatedProducts = [];
      });
  },
});

export const {
  setFilters,
  setSearchQuery,
  resetFilters,
  clearError,
  clearCurrentProduct,
} = productSlice.actions;
export default productSlice.reducer;
