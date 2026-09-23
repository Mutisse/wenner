import { createAsyncThunk } from "@reduxjs/toolkit";
import { customFetch } from "@/lib/utils";
import { logoutUser } from "../user/userActions";
import { ProductVariation } from "../product/productTypes";

// Buscar todas as variantes
export const fetchAllVariants = createAsyncThunk<
  ProductVariation[],
  void,
  { rejectValue: string }
>("variants/fetchAllVariants", async (_, { rejectWithValue, dispatch }) => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      dispatch(logoutUser());
      return rejectWithValue("Faça login para continuar.");
    }

    const response = await customFetch.get<{
      status: string;
      results: number;
      data: {
        data: ProductVariation[];
      };
    }>("/api/v1/variants", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const variants = response.data?.data?.data || [];

    if (!Array.isArray(variants)) {
      return rejectWithValue("Resposta inesperada da API ao buscar variantes");
    }

    // Normalizar variantes
    const normalizedVariants = variants.map((variant) => ({
      ...variant,
      _id: variant._id || (variant as { id?: string }).id || "",
    }));

    return normalizedVariants;
  } catch (err) {
    const error = err as {
      response?: { status?: number; data?: { message?: string } };
      message?: string;
    };

    if (error?.response?.status === 401) {
      dispatch(logoutUser());
      return rejectWithValue("Sessão expirada. Faça login novamente.");
    }

    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Erro ao buscar variantes.";
    return rejectWithValue(message);
  }
});

interface CreateVariantResponse {
  status?: string;
  data?: {
    data?: ProductVariation;
    variant?: ProductVariation;
  };
  message?: string;
}

export const createVariant = createAsyncThunk<
  ProductVariation,
  FormData,
  { rejectValue: string }
>("variants/createVariant", async (formData, { rejectWithValue, dispatch }) => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      dispatch(logoutUser());
      return rejectWithValue("Faça login para continuar.");
    }

    const response = await customFetch.post<CreateVariantResponse>(
      "/api/v1/variants",
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // O factory.createOne retorna { status: 'success', data: { data: variant } }
    // Mas também pode retornar diretamente o variant em response.data.data
    const variant = response.data?.data?.variant || response.data?.data?.data || response.data?.data;

    if (!variant) {
      return rejectWithValue("Resposta inesperada ao criar variante.");
    }

    const normalizedVariant: ProductVariation = {
      ...variant,
      _id: variant._id || (variant as { id?: string }).id || "",
    };

    return normalizedVariant;
  } catch (err) {
    const error = err as {
      response?: { status?: number; data?: { message?: string } };
      message?: string;
    };

    if (error?.response?.status === 401) {
      dispatch(logoutUser());
      return rejectWithValue("Sessão expirada. Faça login novamente.");
    }

    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Erro ao criar variante.";
    return rejectWithValue(message);
  }
});

interface UpdateVariantArgs {
  variantId: string;
  formData: FormData;
}

export const updateVariant = createAsyncThunk<
  ProductVariation,
  UpdateVariantArgs,
  { rejectValue: string }
>("variants/updateVariant", async ({ variantId, formData }, { rejectWithValue, dispatch }) => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      dispatch(logoutUser());
      return rejectWithValue("Faça login para continuar.");
    }

    const response = await customFetch.patch<CreateVariantResponse>(
      `/api/v1/variants/${variantId}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const variant = response.data?.data?.data || response.data?.data;

    if (!variant) {
      return rejectWithValue("Resposta inesperada ao atualizar variante.");
    }

    const normalizedVariant: ProductVariation = {
      ...variant,
      _id: variant._id || (variant as { id?: string }).id || "",
    };

    return normalizedVariant;
  } catch (err) {
    const error = err as {
      response?: { status?: number; data?: { message?: string } };
      message?: string;
    };

    if (error?.response?.status === 401) {
      dispatch(logoutUser());
      return rejectWithValue("Sessão expirada. Faça login novamente.");
    }

    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Erro ao atualizar variante.";
    return rejectWithValue(message);
  }
});

interface DeleteVariantArgs {
  variantId: string;
}

export const deleteVariant = createAsyncThunk<
  string,
  DeleteVariantArgs,
  { rejectValue: string }
>("variants/deleteVariant", async ({ variantId }, { rejectWithValue, dispatch }) => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      dispatch(logoutUser());
      return rejectWithValue("Faça login para continuar.");
    }

    await customFetch.delete(`/api/v1/variants/${variantId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return variantId;
  } catch (err) {
    const error = err as {
      response?: { status?: number; data?: { message?: string } };
      message?: string;
    };

    if (error?.response?.status === 401) {
      dispatch(logoutUser());
      return rejectWithValue("Sessão expirada. Faça login novamente.");
    }

    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Erro ao eliminar variante.";
    return rejectWithValue(message);
  }
});
