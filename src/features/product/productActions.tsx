import { createAsyncThunk } from "@reduxjs/toolkit";
import { Product, ApiResponse } from "./productTypes";
import { customFetch } from "../../lib/utils";
import { logoutUser } from "../user/userActions";

// Buscar produtos da API (filtra produtos fora de estoque)
export const fetchProducts = createAsyncThunk<Product[]>(
  "products/fetchProducts",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await customFetch.get(`/api/v1/products`);
      const { products } = response.data?.data;

      if (!Array.isArray(products)) {
        return rejectWithValue("Resposta inesperada da API ao buscar produtos");
      }

      // Normaliza os produtos
      const normalizedProducts = products.map((product) => ({
        ...product,
        id: product._id,
      }));

      return normalizedProducts;
    } catch (err: unknown) {
      console.error("❌ Erro no fetchProducts:", err);
      const error = err as {
        response?: { status?: number; data?: Record<string, unknown> };
        message?: string;
      };

      if (error?.response?.status === 401) {
        dispatch(logoutUser());
        return rejectWithValue("Sessão expirada. Faça login novamente.");
      }

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Erro ao buscar produtos";
      return rejectWithValue(message);
    }
  }
);

// Buscar TODOS os produtos para admin (inclui produtos fora de estoque)
export const fetchAllProductsForAdmin = createAsyncThunk<Product[]>(
  "products/fetchAllProductsForAdmin",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        return rejectWithValue("Faça login para continuar");
      }

      const response = await customFetch.get(`/api/v1/products/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // A estrutura de resposta é: { status: 'success', results: N, data: { data: products[] } }
      const products = response.data?.data?.data || [];

      if (!Array.isArray(products)) {
        return rejectWithValue("Resposta inesperada da API ao buscar produtos");
      }

      // Normaliza os produtos
      const normalizedProducts = products.map((product) => ({
        ...product,
        id: product._id,
      }));

      return normalizedProducts;
    } catch (err: unknown) {
      console.error("❌ Erro no fetchAllProductsForAdmin:", err);
      const error = err as {
        response?: { status?: number; data?: Record<string, unknown> };
        message?: string;
      };

      if (error?.response?.status === 401) {
        dispatch(logoutUser());
        return rejectWithValue("Sessão expirada. Faça login novamente.");
      }

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Erro ao buscar produtos";
      return rejectWithValue(message);
    }
  }
);

// Criar produto
export const createProduct = createAsyncThunk<ApiResponse, FormData>(
  "products/createProduct",
  async (formData, { rejectWithValue, dispatch }) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        return rejectWithValue({ message: "Faça login para continuar" });
      }

      const response = await customFetch.post("/api/v1/products", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          // Não definir Content-Type manualmente - o browser define automaticamente com boundary para FormData
        },
      });

      // O backend retorna: { status: 'success', data: { data: doc } }
      return response.data;
    } catch (err: unknown) {
      const error = err as {
        response?: { status?: number; data?: Record<string, unknown> };
        message?: string;
      };

      // Só fazer logout se realmente for 401 (não autorizado)
      if (error?.response?.status === 401) {
        dispatch(logoutUser());
        return rejectWithValue({
          message: "Sessão expirada. Faça login novamente.",
        });
      }

      // Para outros erros, retornar a mensagem de erro sem fazer logout
      const apiErrorBody = error?.response?.data ?? null;
      const message = 
        (apiErrorBody?.message as string) || 
        error?.message || 
        "Erro ao criar produto";
      
      return rejectWithValue(apiErrorBody ?? { message });
    }
  }
);

interface UpdateProductArgs {
  productId: string;
  formData: FormData;
}

export const updateProduct = createAsyncThunk<
  Product,
  UpdateProductArgs,
  { rejectValue: string }
>("products/updateProduct", async ({ productId, formData }, { rejectWithValue, dispatch }) => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      dispatch(logoutUser());
      return rejectWithValue("Faça login para continuar.");
    }

    const response = await customFetch.patch(`/api/v1/products/${productId}`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const updatedProduct = response.data?.data?.product ?? response.data?.data;

    if (!updatedProduct) {
      return rejectWithValue("Resposta inesperada ao atualizar produto.");
    }

    const normalizedProduct: Product = {
      ...updatedProduct,
      id: updatedProduct._id || updatedProduct.id,
    };

    return normalizedProduct;
  } catch (err: unknown) {
    const error = err as {
      response?: { status?: number; data?: Record<string, unknown> };
      message?: string;
    };

    if (error?.response?.status === 401) {
      dispatch(logoutUser());
      return rejectWithValue("Sessão expirada. Faça login novamente.");
    }

    const message =
      (error?.response?.data?.message as string) ||
      error?.message ||
      "Erro ao atualizar produto.";

    return rejectWithValue(message);
  }
});

// features/products/productActions.ts
export const fetchProductBySlug = createAsyncThunk<Product, string>(
  "products/fetchProductBySlug",
  async (slug, { rejectWithValue, dispatch }) => {
    try {
      const response = await customFetch.get(
        `/api/v1/products/product/${slug}`
      );

      
      const { product } = response.data?.data;
      

      if (!product) {
        return rejectWithValue("Produto não encontrado");
      }

      // Normaliza o produto
      const normalizedProduct = {
        ...product,
        id: product._id || product.id,
      };

      return normalizedProduct;
    } catch (err: unknown) {
      console.error("❌ Erro no fetchProductBySlug:", err);
      const error = err as {
        response?: { status?: number; data?: Record<string, unknown> };
        message?: string;
      };

      if (error?.response?.status === 401) {
        dispatch(logoutUser());
        return rejectWithValue("Sessão expirada. Faça login novamente.");
      }

      if (error?.response?.status === 404) {
        return rejectWithValue("Produto não encontrado");
      }

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Erro ao buscar detalhes do produto";
      return rejectWithValue(message);
    }
  }
);

// Função auxiliar para verificar se produto tem estoque disponível
const hasStockAvailable = (product: Product): boolean => {
  // Produtos com variantes: verificar se pelo menos uma variante tem stock > 0
  const variants = product.variants || product.variations || [];
  if (variants.length > 0) {
    return variants.some((variant) => (variant.stock || 0) > 0);
  }
  
  // Produtos sem variantes: verificar stock direto do produto
  return (product.stock || 0) > 0;
};

// Buscar produtos relacionados por categoria
export const fetchRelatedProducts = createAsyncThunk<
  Product[],
  { category: string; excludeId?: string }
>(
  "products/fetchRelatedProducts",
  async ({ category, excludeId }, { rejectWithValue, dispatch }) => {
    try {
      const response = await customFetch.get(
        `/api/v1/products?category=${encodeURIComponent(category)}`
      );
      const { products } = response.data?.data;

      if (!Array.isArray(products)) {
        return rejectWithValue("Resposta inesperada da API ao buscar produtos relacionados");
      }

      // Normaliza os produtos e filtra o produto atual e produtos fora de estoque
      const normalizedProducts = products
        .map((product) => ({
          ...product,
          id: product._id,
        }))
        .filter((product) => product._id !== excludeId)
        .filter((product) => hasStockAvailable(product)) // Filtra produtos com estoque disponível
        .slice(0, 4); // Limita a 4 produtos relacionados

      return normalizedProducts;
    } catch (err: unknown) {
      console.error("❌ Erro no fetchRelatedProducts:", err);
      const error = err as {
        response?: { status?: number; data?: Record<string, unknown> };
        message?: string;
      };

      if (error?.response?.status === 401) {
        dispatch(logoutUser());
        return rejectWithValue("Sessão expirada. Faça login novamente.");
      }

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Erro ao buscar produtos relacionados";
      return rejectWithValue(message);
    }
  }
);

interface DeleteProductArgs {
  productId: string;
}

export const deleteProduct = createAsyncThunk<
  string,
  DeleteProductArgs,
  { rejectValue: string }
>("products/deleteProduct", async ({ productId }, { rejectWithValue, dispatch }) => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      dispatch(logoutUser());
      return rejectWithValue("Faça login para continuar.");
    }

    await customFetch.delete(`/api/v1/products/${productId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // retornamos apenas o id para remover no slice
    return productId;
  } catch (err: unknown) {
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
      "Erro ao eliminar produto.";

    return rejectWithValue(message);
  }
});