// notificationActions.tsx
import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  INotification,
  ICreateNotificationRequest,
  IUpdateNotificationRequest,
} from "./notificationTypes";
import { customFetch } from "../../lib/utils";
import { logoutUser } from "../user/userActions";

const API_URL = "/api/v1/notifications";

// =========================
// GET ALL NOTIFICATIONS
// =========================
export const getAllNotifications = createAsyncThunk<
  INotification[],
  // if true -> include read notifications, if false/undefined -> only unread
  boolean | void,
  { rejectValue: string }
>(
  "notifications/getAll",
  async (includeRead, { rejectWithValue, dispatch }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        dispatch(logoutUser());
        return rejectWithValue("Faça login para continuar");
      }

      // If `includeRead` is truthy, request all notifications; otherwise request only unread (read=false)
      const params: any = includeRead ? {} : { read: false };
      const response = await customFetch.get(API_URL, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });

      // Ajustar conforme a estrutura da resposta da API
      const notifications =
        response.data?.data?.notifications ||
        response.data?.data?.data ||
        response.data?.data ||
        [];

      // Mapear read (backend) para isRead (frontend) e garantir estrutura correta
      const mappedNotifications = Array.isArray(notifications)
        ? notifications.map((notification: any) => ({
            ...notification,
            isRead:
              notification.read !== undefined
                ? notification.read
                : notification.isRead || false,
            isDelivered: notification.isDelivered || false,
          }))
        : [];

      return mappedNotifications;
    } catch (error: any) {
      if (error?.response?.status === 401) {
        dispatch(logoutUser());
        return rejectWithValue("Sessão expirada. Faça login novamente.");
      }
      return rejectWithValue(
        error.response?.data?.message || "Erro ao buscar notificações"
      );
    }
  }
);

// =========================
// GET NOTIFICATION BY ID
// =========================
export const getNotification = createAsyncThunk<
  INotification,
  string,
  { rejectValue: string }
>("notifications/getById", async (id, { rejectWithValue, dispatch }) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      dispatch(logoutUser());
      return rejectWithValue("Faça login para continuar");
    }

    const response = await customFetch.get(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const notification =
      response.data?.data?.notification ||
      response.data?.data?.data ||
      response.data?.data;

    if (!notification) {
      return rejectWithValue("Notificação não encontrada");
    }

    // Mapear read (backend) para isRead (frontend)
    return {
      ...notification,
      isRead:
        notification.read !== undefined
          ? notification.read
          : notification.isRead || false,
      isDelivered: notification.isDelivered || false,
    };
  } catch (error: any) {
    if (error?.response?.status === 401) {
      dispatch(logoutUser());
      return rejectWithValue("Sessão expirada. Faça login novamente.");
    }
    return rejectWithValue(
      error.response?.data?.message || "Erro ao buscar notificação"
    );
  }
});

// =========================
// CREATE NOTIFICATION
// =========================
export const createNotification = createAsyncThunk<
  INotification,
  ICreateNotificationRequest,
  { rejectValue: string }
>(
  "notifications/create",
  async (notificationData, { rejectWithValue, dispatch }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        dispatch(logoutUser());
        return rejectWithValue("Faça login para continuar");
      }

      const response = await customFetch.post(API_URL, notificationData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const notification =
        response.data?.data?.notification ||
        response.data?.data?.data ||
        response.data?.data;

      if (!notification) {
        return rejectWithValue("Resposta inválida do servidor");
      }

      // Mapear read (backend) para isRead (frontend)
      return {
        ...notification,
        isRead:
          notification.read !== undefined
            ? notification.read
            : notification.isRead || false,
        isDelivered: notification.isDelivered || false,
      };
    } catch (error: any) {
      if (error?.response?.status === 401) {
        dispatch(logoutUser());
        return rejectWithValue("Sessão expirada. Faça login novamente.");
      }
      return rejectWithValue(
        error.response?.data?.message || "Erro ao criar notificação"
      );
    }
  }
);

// =========================
// UPDATE NOTIFICATION
// =========================
export const updateNotification = createAsyncThunk<
  INotification,
  IUpdateNotificationRequest,
  { rejectValue: string }
>(
  "notifications/update",
  async ({ id, data }, { rejectWithValue, dispatch }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        dispatch(logoutUser());
        return rejectWithValue("Faça login para continuar");
      }

      // Converter isRead para read antes de enviar ao backend
      const backendData: any = { ...data };
      if (backendData.isRead !== undefined) {
        backendData.read = backendData.isRead;
        delete backendData.isRead;
      }

      const response = await customFetch.patch(
        `${API_URL}/${id}`,
        backendData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const notification =
        response.data?.data?.notification ||
        response.data?.data?.data ||
        response.data?.data;

      if (!notification) {
        return rejectWithValue("Resposta inválida do servidor");
      }

      // Mapear read (backend) para isRead (frontend)
      return {
        ...notification,
        isRead:
          notification.read !== undefined
            ? notification.read
            : notification.isRead || false,
        isDelivered: notification.isDelivered || false,
      };
    } catch (error: any) {
      if (error?.response?.status === 401) {
        dispatch(logoutUser());
        return rejectWithValue("Sessão expirada. Faça login novamente.");
      }
      return rejectWithValue(
        error.response?.data?.message || "Erro ao atualizar notificação"
      );
    }
  }
);

// =========================
// DELETE NOTIFICATION
// =========================
export const deleteNotification = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("notifications/delete", async (id, { rejectWithValue, dispatch }) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      dispatch(logoutUser());
      return rejectWithValue("Faça login para continuar");
    }

    await customFetch.delete(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return id;
  } catch (error: any) {
    if (error?.response?.status === 401) {
      dispatch(logoutUser());
      return rejectWithValue("Sessão expirada. Faça login novamente.");
    }
    return rejectWithValue(
      error.response?.data?.message || "Erro ao deletar notificação"
    );
  }
});

// =========================
// MARK ALL AS READ
// =========================
export const markAllAsRead = createAsyncThunk<
  number,
  void,
  { rejectValue: string }
>("notifications/markAllAsRead", async (_, { rejectWithValue, dispatch }) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      dispatch(logoutUser());
      return rejectWithValue("Faça login para continuar");
    }

    const response = await customFetch.patch(
      `${API_URL}/read-all`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const modifiedCount = response.data?.data?.modifiedCount || 0;

    return modifiedCount;
  } catch (error: any) {
    if (error?.response?.status === 401) {
      dispatch(logoutUser());
      return rejectWithValue("Sessão expirada. Faça login novamente.");
    }
    return rejectWithValue(
      error.response?.data?.message || "Erro ao marcar todas como lidas"
    );
  }
});
