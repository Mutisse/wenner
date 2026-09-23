// notificationSlice.tsx
import { createSlice } from "@reduxjs/toolkit";
import { NotificationState } from "./notificationTypes";
import {
  getAllNotifications,
  getNotification,
  createNotification,
  updateNotification,
  deleteNotification,
  markAllAsRead,
} from "./notificationActions";

const initialState: NotificationState = {
  notifications: [],
  selectedNotification: null,
  loading: false,
  error: null,
  success: false,
};

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    clearNotificationError: (state) => {
      state.error = null;
    },
    clearNotificationSuccess: (state) => {
      state.success = false;
    },
    clearSelectedNotification: (state) => {
      state.selectedNotification = null;
    },
    resetNotificationState: (state) => {
      state.notifications = [];
      state.selectedNotification = null;
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    // ================================
    // GET ALL NOTIFICATIONS
    // ================================
    builder
      .addCase(getAllNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
      })
      .addCase(getAllNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.notifications = [];
      });

    // ================================
    // GET NOTIFICATION BY ID
    // ================================
    builder
      .addCase(getNotification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getNotification.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedNotification = action.payload;
      })
      .addCase(getNotification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.selectedNotification = null;
      });

    // ================================
    // CREATE NOTIFICATION
    // ================================
    builder
      .addCase(createNotification.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createNotification.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.notifications.unshift(action.payload); // Adiciona no início
      })
      .addCase(createNotification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      });

    // ================================
    // UPDATE NOTIFICATION
    // ================================
    builder
      .addCase(updateNotification.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateNotification.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Atualizar na lista
        const index = state.notifications.findIndex(
          (n) => n._id === action.payload._id
        );
        if (index !== -1) {
          state.notifications[index] = action.payload;
        }
        // Atualizar selecionada se for a mesma
        if (state.selectedNotification?._id === action.payload._id) {
          state.selectedNotification = action.payload;
        }
      })
      .addCase(updateNotification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      });

    // ================================
    // DELETE NOTIFICATION
    // ================================
    builder
      .addCase(deleteNotification.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.notifications = state.notifications.filter(
          (n) => n._id !== action.payload
        );
        // Limpar selecionada se for a deletada
        if (state.selectedNotification?._id === action.payload) {
          state.selectedNotification = null;
        }
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      });

    // ================================
    // MARK ALL AS READ
    // ================================
    builder
      .addCase(markAllAsRead.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
        // Otimista: marcar localmente todas como lidas imediatamente para atualizar a UI
        const now = new Date().toISOString();
        state.notifications = state.notifications.map((notification) => ({
          ...notification,
          isRead: true,
          read: true,
          readAt: now,
        }));
        if (state.selectedNotification) {
          state.selectedNotification = {
            ...state.selectedNotification,
            isRead: true,
            read: true,
            readAt: now,
          };
        }
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        // Marcar todas as notificações como lidas
        const now = new Date().toISOString();
        state.notifications = state.notifications.map((notification) => ({
          ...notification,
          isRead: true,
          read: true,
          readAt: now,
        }));
        // Atualizar selecionada se existir
        if (state.selectedNotification) {
          state.selectedNotification = {
            ...state.selectedNotification,
            isRead: true,
            read: true,
            readAt: now,
          };
        }
      })
      .addCase(markAllAsRead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      });
  },
});

export const {
  clearNotificationError,
  clearNotificationSuccess,
  clearSelectedNotification,
  resetNotificationState,
} = notificationSlice.actions;

export default notificationSlice.reducer;
