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

  // Tenta extrair a mensagem da resposta da API (erro 401, 400, etc)
  if (axiosError?.response?.data?.message) {
    return axiosError.response.data.message;
  }

  // Fallback para message do Error
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

      // If backend returned a message but no user (API signals an error using 200),
      // treat it as a failure so frontend receives the message.
      const backendMessage =
        (response.data as RespShape & { message?: string })?.message ||
        respData.data?.message;
      if (!user) {
        if (backendMessage) {
          return rejectWithValue({ message: backendMessage });
        }
        return rejectWithValue({ message: "Resposta inesperada do servidor" });
      }

      // Persistência opcional
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }
      if (token) {
        localStorage.setItem("token", token);
      }

      return user;
    } catch (err: unknown) {
      // Retorna o erro para o thunk
      const message = getErrorMessage(err);
      // Return a structured error so frontend can read `error.message` when using unwrap()
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

      // Persistência
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
        isValid: boolean;
        domainValidation?: { valid: boolean; reason: string };
      }>(
        "/api/v1/users/check-email",
        { email }
      );
      return { 
        exists: response.data.exists,
        isValid: response.data.isValid,
        domainValidation: response.data.domainValidation
      };
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        error?.response?.data?.message || error?.message || "Erro ao verificar email";
      return rejectWithValue({ message });
    }
  }
);

export const logoutUser = () => async (dispatch: AppDispatch) => {
  try {
    // Attempt to notify backend (optional). Failure shouldn't block frontend logout.
    await customFetch.get("/api/v1/users/logout");
  } catch (err) {
    // ignore backend logout errors but log for debugging
    console.warn("Logout backend failed:", err);
  } finally {
    // Always clear local session and update state
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

    // Retornar o usuário atualizado ao invés do ID
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

// Manter deleteUser para compatibilidade, mas agora desativa
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
