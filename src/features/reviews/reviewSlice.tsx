// reviewSlice.tsx
import { createSlice } from "@reduxjs/toolkit";
import { ReviewState } from "./reviewTypes";
import {
  getAllReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
} from "./reviewActions";

const initialState: ReviewState = {
  reviews: [],
  selectedReview: null,
  loading: false,
  error: null,
  success: false,
};

const reviewSlice = createSlice({
  name: "review",
  initialState,
  reducers: {
    clearReviewError: (state) => {
      state.error = null;
    },
    clearReviewSuccess: (state) => {
      state.success = false;
    },
    clearSelectedReview: (state) => {
      state.selectedReview = null;
    },
    resetReviewState: (state) => {
      state.reviews = [];
      state.selectedReview = null;
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    // ================================
    // GET ALL REVIEWS
    // ================================
    builder
      .addCase(getAllReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload;
      })
      .addCase(getAllReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.reviews = [];
      });

    // ================================
    // GET REVIEW BY ID
    // ================================
    builder
      .addCase(getReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getReview.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedReview = action.payload;
      })
      .addCase(getReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.selectedReview = null;
      });

    // ================================
    // CREATE REVIEW
    // ================================
    builder
      .addCase(createReview.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.reviews.unshift(action.payload); // Adiciona no início
      })
      .addCase(createReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      });

    // ================================
    // UPDATE REVIEW
    // ================================
    builder
      .addCase(updateReview.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateReview.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Atualizar na lista
        const index = state.reviews.findIndex(
          (r) => r._id === action.payload._id
        );
        if (index !== -1) {
          state.reviews[index] = action.payload;
        }
        // Atualizar selecionada se for a mesma
        if (state.selectedReview?._id === action.payload._id) {
          state.selectedReview = action.payload;
        }
      })
      .addCase(updateReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      });

    // ================================
    // DELETE REVIEW
    // ================================
    builder
      .addCase(deleteReview.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.reviews = state.reviews.filter(
          (r) => r._id !== action.payload
        );
        // Limpar selecionada se for a deletada
        if (state.selectedReview?._id === action.payload) {
          state.selectedReview = null;
        }
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      });
  },
});

export const {
  clearReviewError,
  clearReviewSuccess,
  clearSelectedReview,
  resetReviewState,
} = reviewSlice.actions;

export default reviewSlice.reducer;

