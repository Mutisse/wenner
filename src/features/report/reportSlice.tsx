import { createSlice } from "@reduxjs/toolkit";
import { ReportState } from "./reportTypes";
import {
  fetchTotalRevenue,
  fetchAverageTicket,
  fetchTotalOrders,
  fetchDeliveryRate,
  fetchSalesByStatus,
  fetchTopClients,
  fetchTopProducts,
  fetchLeastSoldProducts,
  fetchSalesByPeriod,
} from "./reportActions";

const initialState: ReportState = {
  totalRevenue: 0,
  averageTicket: 0,
  totalOrders: 0,
  deliveryRate: 0,
  salesByStatus: [],
  topClients: [],
  topProducts: [],
  leastSoldProducts: [],
  salesByPeriod: [],
  loading: false,
  error: null,
};

const reportSlice = createSlice({
  name: "report",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Generic pending handler
    builder
      .addCase(fetchTotalRevenue.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTotalRevenue.fulfilled, (state, action) => {
        state.loading = false;
        state.totalRevenue = action.payload;
      })
      .addCase(fetchTotalRevenue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Erro ao obter receita total";
      })

      .addCase(fetchAverageTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAverageTicket.fulfilled, (state, action) => {
        state.loading = false;
        state.averageTicket = action.payload;
      })
      .addCase(fetchAverageTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Erro ao obter ticket médio";
      })

      .addCase(fetchTotalOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTotalOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.totalOrders = action.payload;
      })
      .addCase(fetchTotalOrders.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message || "Erro ao obter total de pedidos";
      })

      .addCase(fetchDeliveryRate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDeliveryRate.fulfilled, (state, action) => {
        state.loading = false;
        state.deliveryRate = action.payload;
      })
      .addCase(fetchDeliveryRate.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message || "Erro ao obter taxa de entrega";
      })

      .addCase(fetchSalesByStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSalesByStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.salesByStatus = action.payload;
      })
      .addCase(fetchSalesByStatus.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message || "Erro ao obter vendas por status";
      })

      .addCase(fetchTopClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTopClients.fulfilled, (state, action) => {
        state.loading = false;
        state.topClients = action.payload;
      })
      .addCase(fetchTopClients.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message || "Erro ao obter principais clientes";
      })

      .addCase(fetchTopProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTopProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.topProducts = action.payload;
      })
      .addCase(fetchTopProducts.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message || "Erro ao obter produtos mais comprados";
      })

      .addCase(fetchLeastSoldProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeastSoldProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.leastSoldProducts = action.payload;
      })
      .addCase(fetchLeastSoldProducts.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message || "Erro ao obter produtos menos comprados";
      })

      .addCase(fetchSalesByPeriod.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSalesByPeriod.fulfilled, (state, action) => {
        state.loading = false;
        state.salesByPeriod = action.payload;
      })
      .addCase(fetchSalesByPeriod.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message || "Erro ao obter vendas por período";
      });
  },
});

export default reportSlice.reducer;
