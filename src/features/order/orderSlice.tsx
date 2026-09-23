import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { OrdersState, Order } from "./orderTypes";
import {
  createOrder,
  fetchOrders,
  fetchOrderById,
  updateOrder,
  deleteOrder,
  confirmOrderReceived,
} from "./orderActions";

const initialState: OrdersState = {
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,
};

const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
  },
  extraReducers: (builder) => {
    // Create Order
    builder
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action: PayloadAction<Order>) => {
        state.loading = false;
        state.orders.push(action.payload);
        state.currentOrder = action.payload;
        state.error = null;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === "object" && action.payload
            ? (action.payload as any).message || "Erro ao criar pedido"
            : "Erro ao criar pedido";
      });

    // Fetch Orders
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchOrders.fulfilled,
        (state, action: PayloadAction<Order[]>) => {
          state.loading = false;
          state.orders = action.payload;
          state.error = null;
        }
      )
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === "object" && action.payload
            ? (action.payload as any).message || "Erro ao carregar pedidos"
            : "Erro ao carregar pedidos";
      });

    // Fetch Order By ID
    builder
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchOrderById.fulfilled,
        (state, action: PayloadAction<Order>) => {
          state.loading = false;
          state.currentOrder = action.payload;
          state.error = null;
        }
      )
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === "object" && action.payload
            ? (action.payload as any).message || "Erro ao carregar pedido"
            : "Erro ao carregar pedido";
      });

    // Update Order
    builder
      .addCase(updateOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrder.fulfilled, (state, action: PayloadAction<Order>) => {
        state.loading = false;
        const index = state.orders.findIndex(
          (order) => order._id === action.payload._id
        );
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        state.currentOrder = action.payload;
        state.error = null;
      })
      .addCase(updateOrder.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === "object" && action.payload
            ? (action.payload as any).message || "Erro ao atualizar pedido"
            : "Erro ao atualizar pedido";
      });

    // Delete Order
    builder
      .addCase(deleteOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        deleteOrder.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.loading = false;
          state.orders = state.orders.filter(
            (order) => order._id !== action.payload
          );
          if (state.currentOrder?._id === action.payload) {
            state.currentOrder = null;
          }
          state.error = null;
        }
      )
      .addCase(deleteOrder.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === "object" && action.payload
            ? (action.payload as any).message || "Erro ao deletar pedido"
            : "Erro ao deletar pedido";
      });

    // Confirm Order Received
    builder
      .addCase(confirmOrderReceived.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        confirmOrderReceived.fulfilled,
        (state, action: PayloadAction<Order>) => {
          state.loading = false;
          const index = state.orders.findIndex(
            (order) => order._id === action.payload._id
          );
          if (index !== -1) {
            state.orders[index] = action.payload;
          }
          if (state.currentOrder?._id === action.payload._id) {
            state.currentOrder = action.payload;
          }
          state.error = null;
        }
      )
      .addCase(confirmOrderReceived.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === "object" && action.payload
            ? (action.payload as any).message || "Erro ao confirmar recebimento"
            : "Erro ao confirmar recebimento";
      });
  },
});

export const { clearError, clearCurrentOrder } = orderSlice.actions;
export default orderSlice.reducer;
