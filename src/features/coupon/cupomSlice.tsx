// couponSlice.tsx
import { createSlice } from "@reduxjs/toolkit";
import { CouponState } from "./cupomTypes";
import {
  createCoupon,
  getAllCoupons,
  getMyCoupons,
  getCouponById,
  validateCoupon,
  useCoupon,
  updateCoupon,
  deleteCoupon,
  clearValidatedCoupon,
} from "./cupomActions";

const initialState: CouponState = {
  coupons: [],
  selectedCoupon: null,
  validatedCoupon: null,
  loading: false,
  error: null,
  success: false,
};

const couponSlice = createSlice({
  name: "coupon",
  initialState,
  reducers: {
    resetCouponState: (state) => {
      state.error = null;
      state.success = false;
      state.loading = false;
    },
    clearSelectedCoupon: (state) => {
      state.selectedCoupon = null;
    },
    clearCouponError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // ================================
    // Criar cupom
    // ================================
    builder
      .addCase(createCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.coupons.push(action.payload);
      })
      .addCase(createCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      });

    // ================================
    // Buscar todos os cupons (admin)
    // ================================
    builder
      .addCase(getAllCoupons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.coupons = action.payload;
      })
      .addCase(getAllCoupons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ================================
    // Buscar cupons do usuário autenticado
    // ================================
    builder
      .addCase(getMyCoupons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMyCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.coupons = action.payload;
      })
      .addCase(getMyCoupons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ================================
    // Buscar cupom por ID
    // ================================
    builder
      .addCase(getCouponById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCouponById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCoupon = action.payload;
      })
      .addCase(getCouponById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ================================
    // Validar cupom
    // ================================
    builder
      .addCase(validateCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.validatedCoupon = null;
      })
      .addCase(validateCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.validatedCoupon = action.payload;
        state.success = true;
      })
      .addCase(validateCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.validatedCoupon = null;
      });

    // ================================
    // Usar cupom
    // ================================
    builder
      .addCase(useCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(useCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Atualizar cupom na lista
        const index = state.coupons.findIndex(
          (c) => c._id === action.payload._id
        );
        if (index !== -1) {
          state.coupons[index] = action.payload;
        }
        // Limpar cupom validado após uso
        state.validatedCoupon = null;
      })
      .addCase(useCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ================================
    // Atualizar cupom
    // ================================
    builder
      .addCase(updateCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const index = state.coupons.findIndex(
          (c) => c._id === action.payload._id
        );
        if (index !== -1) {
          state.coupons[index] = action.payload;
        }
        if (state.selectedCoupon?._id === action.payload._id) {
          state.selectedCoupon = action.payload;
        }
      })
      .addCase(updateCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      });

    // ================================
    // Deletar cupom
    // ================================
    builder
      .addCase(deleteCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.coupons = state.coupons.filter((c) => c._id !== action.payload);
        if (state.selectedCoupon?._id === action.payload) {
          state.selectedCoupon = null;
        }
      })
      .addCase(deleteCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      });

    // ================================
    // Limpar cupom validado
    // ================================
    builder.addCase(clearValidatedCoupon.fulfilled, (state) => {
      state.validatedCoupon = null;
      state.error = null;
    });
  },
});

export const { resetCouponState, clearSelectedCoupon, clearCouponError } =
  couponSlice.actions;

export default couponSlice.reducer;
