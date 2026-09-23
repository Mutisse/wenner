// couponActions.tsx
import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  ICoupon,
  IValidateCouponRequest,
  IValidateCouponResponse,
  IUseCouponRequest,
  ICreateCouponRequest,
  IUpdateCouponRequest,
} from "./cupomTypes";
import { customFetch } from "../../lib/utils";

const API_URL = "/api/v1/coupons";


// ================================
// Criar cupom
// ================================
export const createCoupon = createAsyncThunk<
  ICoupon,
  ICreateCouponRequest,
  { rejectValue: string }
>("coupon/create", async (couponData, { rejectWithValue }) => {
  try {
    const response = await customFetch.post(API_URL, couponData);
    return response.data.data.coupon;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Erro ao criar cupom"
    );
  }
});

// ================================
// Buscar todos os cupons (apenas admin)
// ================================
export const getAllCoupons = createAsyncThunk<
  ICoupon[],
  void,
  { rejectValue: string }
>("coupon/getAll", async (_, { rejectWithValue }) => {
  try {
    const response = await customFetch.get(API_URL);
    return response.data.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Erro ao buscar cupons"
    );
  }
});

// ================================
// Buscar cupons do usuário autenticado
// ================================
export const getMyCoupons = createAsyncThunk<
  ICoupon[],
  void,
  { rejectValue: string }
>("coupon/getMyCoupons", async (_, { rejectWithValue }) => {
  try {
    const response = await customFetch.get(`${API_URL}/my-coupons`);
    return response.data.data.data || [];
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Erro ao buscar seus cupons"
    );
  }
});

// ================================
// Buscar cupom por ID
// ================================
export const getCouponById = createAsyncThunk<
  ICoupon,
  string,
  { rejectValue: string }
>("coupon/getById", async (id, { rejectWithValue }) => {
  try {
    const response = await customFetch.get(`${API_URL}/${id}`);
    return response.data.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Erro ao buscar cupom"
    );
  }
});

// ================================
// Validar cupom
// ================================
export const validateCoupon = createAsyncThunk<
  IValidateCouponResponse,
  IValidateCouponRequest,
  { rejectValue: string }
>("coupon/validate", async (data, { rejectWithValue }) => {
  try {
    const response = await customFetch.post(`${API_URL}/validate`, data);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Cupom inválido");
  }
});

// ================================
// Usar cupom (marcar como usado)
// ================================
export const useCoupon = createAsyncThunk<
  ICoupon,
  IUseCouponRequest,
  { rejectValue: string }
>("coupon/use", async (data, { rejectWithValue }) => {
  try {
    const response = await customFetch.post(`${API_URL}/use`, data);
    return response.data.data.coupon;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Erro ao usar cupom"
    );
  }
});

// ================================
// Atualizar cupom
// ================================
export const updateCoupon = createAsyncThunk<
  ICoupon,
  IUpdateCouponRequest,
  { rejectValue: string }
>("coupon/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await customFetch.patch(`${API_URL}/${id}`, data);
    return response.data.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Erro ao atualizar cupom"
    );
  }
});

// ================================
// Deletar cupom
// ================================
export const deleteCoupon = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("coupon/delete", async (id, { rejectWithValue }) => {
  try {
    await customFetch.delete(`${API_URL}/${id}`);
    return id;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Erro ao deletar cupom"
    );
  }
});

// ================================
// Limpar cupom validado
// ================================
export const clearValidatedCoupon = createAsyncThunk(
  "coupon/clearValidated",
  async () => {
    return null;
  }
);
