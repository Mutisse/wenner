// store/actions/userActions.ts
import { customFetch } from "../../lib/utils";
import { AppDispatch } from "../../app/index";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { logout } from "./userSlice";
import {
  User,
  LoginPayload,
  LoginResponse,
  SignupPayload,
  UpdateProfilePayload,
  UpdatePasswordPayload,
  ResetPasswordPayload,
} from "./userTypes";

export const updateProfile = createAsyncThunk<User, UpdateProfilePayload>(
  "user/updateMe",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await customFetch.patch<{ data: { user: User } }>(
        "/api/v1/users/updateMe",
        payload
      );
      const user = response.data.data.user;

      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
        return user;
      }
      return rejectWithValue({ message: "Resposta inesperada do servidor" });
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        error?.response?.data?.message || error?.message || "Erro desconhecido";
      return rejectWithValue({ message });
    }
  }
);

export const updatePassword = createAsyncThunk<void, UpdatePasswordPayload>(
  "user/updateMyPassword",
  async (payload, { rejectWithValue }) => {
    try {
      await customFetch.patch("/api/v1/users/updateMyPassword", payload);
      return;
    } catch (err: unknown) {
      const error: any = err;
      const message =
        error?.response?.data?.message || error?.message || "Erro desconhecido";
      return rejectWithValue({ message });
    }
  }
);

type RespShape = {
  user?: User;
  token?: string;
  message?: string;
  data?: { user?: User; token?: string; message?: string };
};

function getErrorMessage(err: unknown): string {
  if (!err) return "Erro desconhecido";
  if (typeof err === "string") return err;

  const axiosError = err as any;

  if (axiosError?.response?.data?.message) {
    return axiosError.response.data.message;
  }

  if (err instanceof Error && err.message) return err.message;

  return "Erro desconhecido";
}

export const loginUser = createAsyncThunk<User, LoginPayload>(
  "user/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await customFetch.post<LoginResponse>(
        "/api/v1/users/login",
        {
          email,
          password,
        }
      );

      const respData = (response.data ?? {}) as RespShape;
      const user = respData.data?.user || respData.user;
      const token = respData.token || respData.data?.token;

      const backendMessage =
        (response.data as RespShape & { message?: string })?.message ||
        respData.data?.message;
      if (!user) {
        if (backendMessage) {
          return rejectWithValue({ message: backendMessage });
        }
        return rejectWithValue({ message: "Resposta inesperada do servidor" });
      }

      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }
      if (token) {
        localStorage.setItem("token", token);
      }

      return user;
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      return rejectWithValue({ message });
    }
  }
);

export const signupUser = createAsyncThunk<User, SignupPayload>(
  "user/signup",
  async (
    { name, email, password, passwordConfirm, phone },
    { rejectWithValue }
  ) => {
    try {
      const response = await customFetch.post<LoginResponse>(
        "/api/v1/users/signup",
        {
          name,
          email,
          phone,
          password,
          passwordConfirm,
        }
      );

      const respData = (response.data ?? {}) as RespShape;
      const user = respData.data?.user || respData.user;
      const token = respData.token || respData.data?.token;

      if (!user) {
        const backendMessage =
          (response.data as RespShape & { message?: string })?.message ||
          respData.data?.message;
        if (backendMessage) {
          return rejectWithValue({ message: backendMessage });
        }
        return rejectWithValue({ message: "Resposta inesperada do servidor" });
      }

      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }
      if (token) {
        localStorage.setItem("token", token);
      }

      return user;
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      return rejectWithValue({ message });
    }
  }
);

// Verifica apenas se o email já existe. Aceita QUALQUER domínio válido.
// O backend valida o formato do email; o frontend não bloqueia por domínio.
export const checkEmailExists = createAsyncThunk<
  { exists: boolean; isValid: boolean; domainValidation?: { valid: boolean; reason: string } },
  string
>(
  "user/checkEmail",
  async (email, { rejectWithValue }) => {
    try {
      const response = await customFetch.post<{
        status: string;
        exists: boolean;
        isValid?: boolean;
        domainValidation?: { valid: boolean; reason: string };
      }>("/api/v1/users/check-email", { email });

      return {
        exists: response.data.exists,
        // Se o backend não devolver isValid, assumimos que é válido.
        // Isto garante que QUALQUER domínio é aceite.
        isValid: response.data.isValid ?? true,
        domainValidation: response.data.domainValidation,
      };
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Erro ao verificar email";
      return rejectWithValue({ message });
    }
  }
);

export const logoutUser = () => async (dispatch: AppDispatch) => {
  try {
    await customFetch.get("/api/v1/users/logout");
  } catch (err) {
    console.warn("Logout backend failed:", err);
  } finally {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    dispatch(logout());
  }
};

export const fetchUsers = createAsyncThunk<User[]>(
  "users/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await customFetch.get(`/api/v1/users/orders/stats`);

      const { users } = response.data?.data || {};

      if (!Array.isArray(users)) {
        return rejectWithValue("Resposta inesperada da API ao buscar usuários");
      }

      const normalizedUsers: User[] = users.map((user, index) => ({
        ...user,
        _id: user._id || user.userId || `temp-user-${index}`,
        userId: user.userId || user._id || `temp-user-${index}`,
        totalOrders: user.totalOrders ?? 0,
        totalSpent: user.totalSpent ?? 0,
        lastOrder: user.lastOrder || user.createdAt || undefined,
      }));

      return normalizedUsers;
    } catch (err: unknown) {
      console.error("❌ Erro no fetchUsers:", err);
      const error = err as {
        response?: { status?: number; data?: Record<string, unknown> };
        message?: string;
      };

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Erro ao buscar usuários";
      return rejectWithValue(message);
    }
  }
);

export const updateUserRole = createAsyncThunk<
  User,
  { userId: string; role: User["role"] }
>("users/updateUserRole", async ({ userId, role }, { rejectWithValue }) => {
  try {
    const response = await customFetch.patch(`/api/v1/users/${userId}`, {
      role,
    });

    const user =
      response.data?.data?.user || response.data?.data || response.data;
    return user;
  } catch (err: unknown) {
    const error = err as {
      response?: { status?: number; data?: Record<string, unknown> };
      message?: string;
    };

    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Erro ao atualizar usuário";
    return rejectWithValue(message);
  }
});

export const deactivateUser = createAsyncThunk<
  User,
  string,
  { rejectValue: string }
>("users/deactivateUser", async (userId, { rejectWithValue, dispatch }) => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      dispatch(logout());
      return rejectWithValue("Faça login para continuar.");
    }

    const response = await customFetch.delete(`/api/v1/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const user = response.data?.data?.data || response.data?.data;
    return user;
  } catch (err: unknown) {
    const error = err as {
      response?: { status?: number; data?: Record<string, unknown> };
      message?: string;
    };

    const message: string =
      (error?.response?.data?.message as string) ||
      error?.message ||
      "Erro ao desativar usuário";
    return rejectWithValue(message);
  }
});

export const deleteUser = deactivateUser;

export const forgotPassword = createAsyncThunk<
  void,
  { email: string },
  { rejectValue: string }
>("user/forgotPassword", async ({ email }, { rejectWithValue }) => {
  try {
    await customFetch.post("/api/v1/users/forgotPassword", {
      email,
    });

    return;
  } catch (err: unknown) {
    const error = err as {
      response?: { status?: number; data?: Record<string, unknown> };
      message?: string;
    };

    const message: string =
      (error?.response?.data?.message as string) ||
      error?.message ||
      "Erro ao enviar email de recuperação";
    return rejectWithValue(message);
  }
});

export const resetPassword = createAsyncThunk<
  void,
  { token: string; payload: ResetPasswordPayload },
  { rejectValue: string }
>("user/resetPassword", async ({ token, payload }, { rejectWithValue }) => {
  try {
    await customFetch.patch(`/api/v1/users/resetPassword/${token}`, payload);

    return;
  } catch (err: unknown) {
    const error = err as {
      response?: { status?: number; data?: Record<string, unknown> };
      message?: string;
    };

    const message: string =
      (error?.response?.data?.message as string) ||
      error?.message ||
      "Erro ao redefinir senha";
    return rejectWithValue(message);
  }
});