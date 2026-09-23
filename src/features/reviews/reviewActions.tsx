// reviewActions.tsx
import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  IReview,
  ICreateReviewRequest,
  IUpdateReviewRequest,
} from "./reviewTypes";
import { customFetch } from "../../lib/utils";
import { logoutUser } from "../user/userActions";

const API_URL = "/api/v1/reviews";

// =========================
// GET ALL REVIEWS
// =========================
export const getAllReviews = createAsyncThunk<
  IReview[],
  string | undefined, // productId opcional para filtrar por produto
  { rejectValue: string }
>("reviews/getAll", async (productId, { rejectWithValue, dispatch }) => {
  try {
  
    
    const token = localStorage.getItem("token");
    if (!token) {
      dispatch(logoutUser());
      return rejectWithValue("Faça login para continuar");
    }

    const url = productId ? `${API_URL}?product=${productId}` : API_URL;
   
    
    const response = await customFetch.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Ajustar conforme a estrutura da resposta da API
    const reviews = response.data?.data?.reviews || 
                   response.data?.data?.data || 
                   response.data?.data || 
                   [];

    const finalReviews = Array.isArray(reviews) ? reviews : [];
  

    return finalReviews;
  } catch (error: any) {
    console.error("❌ [getAllReviews] Erro ao buscar reviews:", {
      error,
      message: error?.message,
      response: error?.response,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      url: error?.config?.url,
    });
    
    if (error?.response?.status === 401) {
      dispatch(logoutUser());
      return rejectWithValue("Sessão expirada. Faça login novamente.");
    }
    
    const errorMessage = error.response?.data?.message || "Erro ao buscar avaliações";
    console.error("❌ [getAllReviews] Erro final:", errorMessage);
    return rejectWithValue(errorMessage);
  }
});

// =========================
// GET REVIEW BY ID
// =========================
export const getReview = createAsyncThunk<
  IReview,
  string,
  { rejectValue: string }
>("reviews/getById", async (id, { rejectWithValue, dispatch }) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      dispatch(logoutUser());
      return rejectWithValue("Faça login para continuar");
    }

    const response = await customFetch.get(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const review = response.data?.data?.review || 
                  response.data?.data?.data || 
                  response.data?.data;

    if (!review) {
      return rejectWithValue("Avaliação não encontrada");
    }

    return review;
  } catch (error: any) {
    if (error?.response?.status === 401) {
      dispatch(logoutUser());
      return rejectWithValue("Sessão expirada. Faça login novamente.");
    }
    return rejectWithValue(
      error.response?.data?.message || "Erro ao buscar avaliação"
    );
  }
});

// =========================
// CREATE REVIEW
// =========================
export const createReview = createAsyncThunk<
  IReview,
  ICreateReviewRequest,
  { rejectValue: string }
>(
  "reviews/create",
  async (reviewData, { rejectWithValue, dispatch }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        dispatch(logoutUser());
        return rejectWithValue("Faça login para continuar");
      }

      const response = await customFetch.post(API_URL, reviewData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const review = response.data?.data?.review || 
                    response.data?.data?.data || 
                    response.data?.data;

      if (!review) {
        return rejectWithValue("Resposta inválida do servidor");
      }

      return review;
    } catch (error: any) {
      if (error?.response?.status === 401) {
        dispatch(logoutUser());
        return rejectWithValue("Sessão expirada. Faça login novamente.");
      }
      return rejectWithValue(
        error.response?.data?.message || "Erro ao criar avaliação"
      );
    }
  }
);

// =========================
// UPDATE REVIEW
// =========================
export const updateReview = createAsyncThunk<
  IReview,
  IUpdateReviewRequest,
  { rejectValue: string }
>(
  "reviews/update",
  async ({ id, data }, { rejectWithValue, dispatch }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        dispatch(logoutUser());
        return rejectWithValue("Faça login para continuar");
      }

      const response = await customFetch.patch(`${API_URL}/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const review = response.data?.data?.review || 
                    response.data?.data?.data || 
                    response.data?.data;

      if (!review) {
        return rejectWithValue("Resposta inválida do servidor");
      }

      return review;
    } catch (error: any) {
      if (error?.response?.status === 401) {
        dispatch(logoutUser());
        return rejectWithValue("Sessão expirada. Faça login novamente.");
      }
      return rejectWithValue(
        error.response?.data?.message || "Erro ao atualizar avaliação"
      );
    }
  }
);

// =========================
// DELETE REVIEW
// =========================
export const deleteReview = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("reviews/delete", async (id, { rejectWithValue, dispatch }) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      dispatch(logoutUser());
      return rejectWithValue("Faça login para continuar");
    }

    await customFetch.delete(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return id;
  } catch (error: any) {
    if (error?.response?.status === 401) {
      dispatch(logoutUser());
      return rejectWithValue("Sessão expirada. Faça login novamente.");
    }
    return rejectWithValue(
      error.response?.data?.message || "Erro ao deletar avaliação"
    );
  }
});

