import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { FavoritesState, FavoriteItem } from "./favoriteTypes";
import {
  fetchFavorites,
  addToFavorites,
  removeFromFavorites,
  clearAllFavorites,
} from "./favoriteActions";

const initialState: FavoritesState = {
  favorites: [],
  loading: false,
  error: null,
  success: false,
};

const favoriteSlice = createSlice({
  name: "favorites",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearSuccess(state) {
      state.success = false;
    },
    resetFavorites(state) {
      state.favorites = [];
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      /** =======================
       *  FETCH FAVORITES
       * =======================*/
      .addCase(fetchFavorites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.favorites = action.payload;
        state.loading = false;
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.favorites = [];
      })

      /** =======================
       *  ADD FAVORITE
       * =======================*/
      .addCase(addToFavorites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToFavorites.fulfilled, (state, action) => {
        state.favorites = action.payload; // payload = array final
        state.loading = false;
      })
      .addCase(addToFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /** =======================
       *  REMOVE FAVORITE
       * =======================*/
      .addCase(removeFromFavorites.pending, (state) => {
        state.loading = true;
      })
      .addCase(removeFromFavorites.fulfilled, (state, action) => {
        const removedId = action.payload; // payload = id string
        state.favorites = state.favorites.filter(
          (item) => item._id !== removedId
        );
        state.loading = false;
      })
      .addCase(removeFromFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /** =======================
       *  CLEAR ALL
       * =======================*/
      .addCase(clearAllFavorites.pending, (state) => {
        state.loading = true;
      })
      .addCase(clearAllFavorites.fulfilled, (state) => {
        state.favorites = [];
        state.loading = false;
      })
      .addCase(clearAllFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// ======================
// ACTIONS
// ======================
export const { clearError, clearSuccess, resetFavorites } =
  favoriteSlice.actions;

// ======================
// SELECTORS
// ======================

// Verifica se um produto está nos favoritos
export const selectIsFavorite =
  (productId: string) => (state: { favorites: FavoritesState }) =>
    state.favorites.favorites.some((item: any) => {
      // Se for um produto direto (a API retorna produtos populados)
      if (item._id === productId || item.id === productId) {
        return true;
      }
      // Se for FavoriteItem (tem product)
      if (item.product) {
        const product = typeof item.product === 'object' ? item.product : null;
        if (product && (product._id === productId || product.id === productId)) {
          return true;
        }
        // Se product for string (ID)
        if (typeof item.product === 'string' && item.product === productId) {
          return true;
        }
      }
      return false;
    });

// Total de favoritos
export const selectFavoritesCount = (state: { favorites: FavoritesState }) =>
  state.favorites.favorites.length;

export default favoriteSlice.reducer;
