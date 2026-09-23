import { createAsyncThunk } from "@reduxjs/toolkit";
import { customFetch } from "@/lib/utils";
import {
  CreateOrderPayload,
  UpdateOrderPayload,
  Order,
  ApiResponse,
} from "./orderTypes";

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return "An unknown error occurred";
};

/**
 * Create a new order
 * POST /api/v1/orders
 */
export const createOrder = createAsyncThunk<
  Order,
  CreateOrderPayload,
  {
    rejectValue: ApiResponse;
  }
>("order/createOrder", async (payload, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem("token");
    // Aumentar timeout para 30 segundos para criar pedido (pode demorar mais devido a validações)
    const response = await customFetch.post("/api/v1/orders", payload, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      timeout: 30000, // 30 segundos
    });

    return response.data.data || response.data;
  } catch (error) {
    if (error instanceof Error && "response" in error) {
      const axiosError = error as any;
      // Verificar se é erro de timeout
      if (axiosError.code === 'ECONNABORTED' || axiosError.message?.includes('timeout')) {
        return rejectWithValue({
          status: "error",
          message: "A requisição demorou muito. Por favor, tente novamente.",
        });
      }
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

/**
 * Fetch all orders for the current user
 * GET /api/v1/orders or /api/v1/orders?user=userId
 */
export const fetchOrders = createAsyncThunk<
  Order[],
  string | undefined,
  {
    rejectValue: ApiResponse;
  }
>("order/fetchOrders", async (userId, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      return rejectWithValue({ status: "fail", message: "Not authenticated" });
    }

    const url = userId ? `/api/v1/orders?user=${userId}` : "/api/v1/orders";

    const response = await customFetch.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Normalize response: extract orders array from various possible response shapes
    let orders: Order[] = [];
    if (Array.isArray(response.data?.data?.data)) {
      orders = response.data.data.data;
    }

    return orders;
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

/**
 * Fetch a single order by ID
 * GET /api/v1/orders/:id
 */
export const fetchOrderById = createAsyncThunk<
  Order,
  string,
  {
    rejectValue: ApiResponse;
  }
>("order/fetchOrderById", async (orderId, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem("token");
    
    const response = await customFetch.get(`/api/v1/orders/${orderId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });


    const orderData = response.data.data || response.data;
    
  
    return orderData;
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

/**
 * Update an order
 * PATCH /api/v1/orders/:id
 */
export const updateOrder = createAsyncThunk<
  Order,
  { orderId: string; payload: UpdateOrderPayload },
  {
    rejectValue: ApiResponse;
  }
>("order/updateOrder", async ({ orderId, payload }, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem("token");
    const response = await customFetch.patch(
      `/api/v1/orders/${orderId}`,
      payload,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );

    return response.data.data || response.data;
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

/**
 * Delete an order
 * DELETE /api/v1/orders/:id
 */
export const deleteOrder = createAsyncThunk<
  string,
  string,
  {
    rejectValue: ApiResponse;
  }
>("order/deleteOrder", async (orderId, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem("token");
    await customFetch.delete(`/api/v1/orders/${orderId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    return orderId;
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

/**
 * Confirm order received by client
 * PATCH /api/v1/orders/:id/confirm-received
 */
export const confirmOrderReceived = createAsyncThunk<
  Order,
  string,
  {
    rejectValue: ApiResponse;
  }
>("order/confirmOrderReceived", async (orderId, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      return rejectWithValue({ status: "fail", message: "Not authenticated" });
    }

    const response = await customFetch.patch(
      `/api/v1/orders/${orderId}/confirm-received`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return response.data.data?.order || response.data.data || response.data;
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