import { createAsyncThunk } from "@reduxjs/toolkit";
import { 
  FavoriteItem, 
  AddToFavoritesPayload,
  RemoveFromFavoritesPayload
} from "./favoriteTypes";
import { customFetch } from "../../lib/utils";
import { logoutUser } from "../user/userActions";

// =========================
// FETCH FAVORITES
// =========================
export const fetchFavorites = createAsyncThunk<FavoriteItem[]>(
  "favorites/fetchFavorites",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        dispatch(logoutUser());
        return rejectWithValue("Faça login para continuar");
      }

      const res = await customFetch.get("/api/v1/favorites/my-favorites", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const favoriteData = res.data?.data?.favorite;
      if (!favoriteData?.products) return [];

      return favoriteData.products;

    } catch (error: any) {
      if (error?.response?.status === 401) {
        dispatch(logoutUser());
        return rejectWithValue("Sessão expirada.");
      }
      return rejectWithValue(error.response?.data?.message || "Erro ao buscar favoritos");
    }
  }
);



// =========================
// ADD TO FAVORITES
// =========================
export const addToFavorites = createAsyncThunk<
  FavoriteItem[],             // retorna ARRAY!
  AddToFavoritesPayload,
  { rejectValue: string }
>(
  "favorites/addToFavorites",
  async ({ productId }, { rejectWithValue, dispatch }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        dispatch(logoutUser());
        return rejectWithValue("Faça login para continuar");
      }

      const res = await customFetch.post(
        "/api/v1/favorites/my-favorites",
        { productId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const favorite = res.data?.data?.favorite;
      if (!favorite || !Array.isArray(favorite.products))
        return rejectWithValue("Resposta inválida do servidor");

      return favorite.products;

    } catch (error: any) {
      if (error?.response?.status === 401) {
        dispatch(logoutUser());
        return rejectWithValue("Sessão expirada.");
      }
      if (error?.response?.status === 400) {
        return rejectWithValue(error.response.data.message);
      }

      return rejectWithValue("Erro ao adicionar favorito");
    }
  }
);



// =========================
// REMOVE FAVORITE
// =========================
export const removeFromFavorites = createAsyncThunk<
  string, // <- apenas um ID
  RemoveFromFavoritesPayload,
  { rejectValue: string }
>(
  "favorites/removeFromFavorites",
  async ({ productId }, { rejectWithValue, dispatch }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        dispatch(logoutUser());
        return rejectWithValue("Faça login para continuar.");
      }

      await customFetch.delete(
        `/api/v1/favorites/my-favorites/${productId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return productId; // <-- só o ID
    } catch (error: any) {
      if (error?.response?.status === 401) {
        dispatch(logoutUser());
        return rejectWithValue("Sessão expirada.");
      }

      return rejectWithValue(error.response?.data?.message || "Erro ao remover favorito");
    }
  }
);



// =========================
// CLEAR ALL FAVORITES
// =========================
export const clearAllFavorites = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>(
  "favorites/clearAllFavorites",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        dispatch(logoutUser());
        return rejectWithValue("Faça login para continuar.");
      }

      await customFetch.delete("/api/v1/favorites/my-favorites", {
        headers: { Authorization: `Bearer ${token}` },
      });

      return;
    } catch (error: any) {
      if (error?.response?.status === 401) {
        dispatch(logoutUser());
        return rejectWithValue("Sessão expirada. Faça login novamente.");
      }

      return rejectWithValue(
        error?.response?.data?.message ||
        "Erro ao limpar lista de favoritos"
      );
    }
  }
);
