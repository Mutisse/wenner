import { createAsyncThunk } from "@reduxjs/toolkit";
import { customFetch } from "@/lib/utils";
import {
  ApiResponse,
  SalesByStatusItem,
  TopClientItem,
  SalesByPeriodItem,
  ProductSalesItem,
} from "./reportTypes";

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return "An unknown error occurred";
};

// All endpoints require authentication; token retrieved from localStorage

export const fetchTotalRevenue = createAsyncThunk<
  number,
  void,
  { rejectValue: ApiResponse }
>("report/fetchTotalRevenue", async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem("token");
    const res = await customFetch.get("/api/v1/reports/total-revenue", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });


    return res.data.data?.totalRevenue ?? res.data.totalRevenue ?? 0;
  } catch (error) {
    if (error instanceof Error && "response" in error) {
      const axiosError = error as any;
      return rejectWithValue(
        axiosError.response?.data || {
          status: "error",
          message: getErrorMessage(error),
        }
      );
    }
    return rejectWithValue({
      status: "error",
      message: getErrorMessage(error),
    });
  }
});

export const fetchAverageTicket = createAsyncThunk<
  number,
  void,
  { rejectValue: ApiResponse }
>("report/fetchAverageTicket", async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem("token");
    const res = await customFetch.get("/api/v1/reports/average-ticket", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });


    return res.data.data?.averageTicket ?? res.data.averageTicket ?? 0;
  } catch (error) {
    if (error instanceof Error && "response" in error) {
      const axiosError = error as any;
      return rejectWithValue(
        axiosError.response?.data || {
          status: "error",
          message: getErrorMessage(error),
        }
      );
    }
    return rejectWithValue({
      status: "error",
      message: getErrorMessage(error),
    });
  }
});

export const fetchTotalOrders = createAsyncThunk<
  number,
  void,
  { rejectValue: ApiResponse }
>("report/fetchTotalOrders", async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem("token");
    const res = await customFetch.get("/api/v1/reports/total-orders", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    return res.data.data?.data;
  } catch (error) {
    if (error instanceof Error && "response" in error) {
      const axiosError = error as any;
      return rejectWithValue(
        axiosError.response?.data || {
          status: "error",
          message: getErrorMessage(error),
        }
      );
    }
    return rejectWithValue({
      status: "error",
      message: getErrorMessage(error),
    });
  }
});

export const fetchDeliveryRate = createAsyncThunk<
  number,
  void,
  { rejectValue: ApiResponse }
>("report/fetchDeliveryRate", async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem("token");
    const res = await customFetch.get("/api/v1/reports/delivery-rate", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data.data?.deliveryRate ?? res.data.deliveryRate ?? 0;
  } catch (error) {
    if (error instanceof Error && "response" in error) {
      const axiosError = error as any;
      return rejectWithValue(
        axiosError.response?.data || {
          status: "error",
          message: getErrorMessage(error),
        }
      );
    }
    return rejectWithValue({
      status: "error",
      message: getErrorMessage(error),
    });
  }
});

export const fetchSalesByStatus = createAsyncThunk<
  SalesByStatusItem[],
  void,
  { rejectValue: ApiResponse }
>("report/fetchSalesByStatus", async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem("token");
    const res = await customFetch.get("/api/v1/reports/sales-by-status", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data.data ?? res.data ?? [];
  } catch (error) {
    if (error instanceof Error && "response" in error) {
      const axiosError = error as any;
      return rejectWithValue(
        axiosError.response?.data || {
          status: "error",
          message: getErrorMessage(error),
        }
      );
    }
    return rejectWithValue({
      status: "error",
      message: getErrorMessage(error),
    });
  }
});

export const fetchTopClients = createAsyncThunk<
  TopClientItem[],
  void,
  { rejectValue: ApiResponse }
>("report/fetchTopClients", async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem("token");
    const res = await customFetch.get("/api/v1/reports/top-clients", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    // Extract topClients array from response
    // API returns: { data: { topClients: [...] } }
    return (
      res.data.data?.topClients ?? res.data.topClients ?? res.data.data ?? []
    );
  } catch (error) {
    if (error instanceof Error && "response" in error) {
      const axiosError = error as any;
      return rejectWithValue(
        axiosError.response?.data || {
          status: "error",
          message: getErrorMessage(error),
        }
      );
    }
    return rejectWithValue({
      status: "error",
      message: getErrorMessage(error),
    });
  }
});

export const fetchSalesByPeriod = createAsyncThunk<
  SalesByPeriodItem[],
  { start?: string; end?: string } | void,
  { rejectValue: ApiResponse }
>("report/fetchSalesByPeriod", async (range, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem("token");
    const params: any = {};
    if (range && (range as any).start) params.start = (range as any).start;
    if (range && (range as any).end) params.end = (range as any).end;
    const res = await customFetch.get("/api/v1/reports/sales-by-period", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      params,
    });
    return res.data.data ?? res.data ?? [];
  } catch (error) {
    if (error instanceof Error && "response" in error) {
      const axiosError = error as any;
      return rejectWithValue(
        axiosError.response?.data || {
          status: "error",
          message: getErrorMessage(error),
        }
      );
    }
    return rejectWithValue({
      status: "error",
      message: getErrorMessage(error),
    });
  }
});

export const fetchTopProducts = createAsyncThunk<
  ProductSalesItem[],
  void,
  { rejectValue: ApiResponse }
>("report/fetchTopProducts", async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem("token");
    const res = await customFetch.get("/api/v1/reports/top-products", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data.data?.topProducts ?? res.data.topProducts ?? [];
  } catch (error) {
    if (error instanceof Error && "response" in error) {
      const axiosError = error as any;
      return rejectWithValue(
        axiosError.response?.data || {
          status: "error",
          message: getErrorMessage(error),
        }
      );
    }
    return rejectWithValue({
      status: "error",
      message: getErrorMessage(error),
    });
  }
});

export const fetchLeastSoldProducts = createAsyncThunk<
  ProductSalesItem[],
  void,
  { rejectValue: ApiResponse }
>("report/fetchLeastSoldProducts", async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem("token");
    const res = await customFetch.get("/api/v1/reports/least-sold-products", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data.data?.leastSoldProducts ?? res.data.leastSoldProducts ?? [];
  } catch (error) {
    if (error instanceof Error && "response" in error) {
      const axiosError = error as any;
      return rejectWithValue(
        axiosError.response?.data || {
          status: "error",
          message: getErrorMessage(error),
        }
      );
    }
    return rejectWithValue({
      status: "error",
      message: getErrorMessage(error),
    });
  }
});
