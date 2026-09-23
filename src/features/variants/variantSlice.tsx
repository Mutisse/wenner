import { createSlice } from "@reduxjs/toolkit";
import { VariantState } from "./variantType";
import { createVariant, fetchAllVariants, updateVariant, deleteVariant } from "./variantActions";

const initialState: VariantState = {
  variants: [],
  loading: false,
  error: null,
  lastCreatedVariant: null,
};

const variantSlice = createSlice({
  name: "variant",
  initialState,
  reducers: {
    clearVariantStatus: (state) => {
      state.loading = false;
      state.error = null;
      state.lastCreatedVariant = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createVariant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createVariant.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.lastCreatedVariant = action.payload;
        state.variants.push(action.payload);
      })
      .addCase(createVariant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Erro ao criar variante.";
      })
      // Fetch All Variants
      .addCase(fetchAllVariants.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllVariants.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.variants = action.payload;
      })
      .addCase(fetchAllVariants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Erro ao buscar variantes.";
        state.variants = [];
      })
      // Update Variant
      .addCase(updateVariant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateVariant.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        const updated = action.payload;
        state.variants = state.variants.map((v) =>
          v._id === updated._id ? updated : v
        );
      })
      .addCase(updateVariant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Erro ao atualizar variante.";
      })
      // Delete Variant
      .addCase(deleteVariant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteVariant.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        const deletedId = action.payload;
        state.variants = state.variants.filter(
          (v) => v._id !== deletedId && v.id !== deletedId
        );
      })
      .addCase(deleteVariant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Erro ao eliminar variante.";
      });
  },
});

export const { clearVariantStatus } = variantSlice.actions;
export default variantSlice.reducer;
