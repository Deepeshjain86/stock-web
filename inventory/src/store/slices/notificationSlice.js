import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { notificationsAPI } from '../../services/api';

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  toast: null, // Global toast state: { msg: '', type: 'success'|'error' }
};

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (params = { limit: 5 }, { rejectWithValue }) => {
    try {
      const response = await notificationsAPI.getAll(params);
      const unreadRes = await notificationsAPI.getUnreadCount();
      return {
        notifications: response.notifications || [],
        unreadCount: unreadRes.unreadCount || 0,
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch notifications.');
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const res = await notificationsAPI.getUnreadCount();
      return res.unreadCount || 0;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch unread count.');
    }
  }
);

export const markNotificationRead = createAsyncThunk(
  'notifications/markNotificationRead',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      await notificationsAPI.markRead(id);
      dispatch(fetchUnreadCount());
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to mark read.');
    }
  }
);

export const markNotificationUnread = createAsyncThunk(
  'notifications/markNotificationUnread',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      await notificationsAPI.markUnread(id);
      dispatch(fetchUnreadCount());
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to mark unread.');
    }
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  'notifications/markAllNotificationsRead',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await notificationsAPI.markAllRead();
      dispatch(fetchUnreadCount());
      return response;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to mark all read.');
    }
  }
);

export const deleteNotificationThunk = createAsyncThunk(
  'notifications/deleteNotification',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      await notificationsAPI.delete(id);
      dispatch(fetchUnreadCount());
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete notification.');
    }
  }
);

export const clearAllNotificationsThunk = createAsyncThunk(
  'notifications/clearAllNotifications',
  async (readOnly = false, { dispatch, rejectWithValue }) => {
    try {
      const response = await notificationsAPI.clearAll(readOnly);
      dispatch(fetchUnreadCount());
      return response;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to clear notifications.');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    showToast: (state, action) => {
      state.toast = {
        msg: action.payload.msg,
        type: action.payload.type || 'success',
      };
    },
    hideToast: (state) => {
      state.toast = null;
    },
    decrementUnreadCount: (state) => {
      state.unreadCount = Math.max(0, state.unreadCount - 1);
    },
    clearUnreadCount: (state) => {
      state.unreadCount = 0;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.notifications;
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const id = action.payload;
        const item = state.notifications.find(n => n.id === id);
        if (item && !item.is_read) {
          item.is_read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markNotificationUnread.fulfilled, (state, action) => {
        const id = action.payload;
        const item = state.notifications.find(n => n.id === id);
        if (item && item.is_read) {
          item.is_read = false;
          state.unreadCount += 1;
        }
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.notifications.forEach(n => { n.is_read = true; });
        state.unreadCount = 0;
      })
      .addCase(deleteNotificationThunk.fulfilled, (state, action) => {
        const id = action.payload;
        state.notifications = state.notifications.filter(n => n.id !== id);
      })
      .addCase(clearAllNotificationsThunk.fulfilled, (state) => {
        state.notifications = [];
        state.unreadCount = 0;
      });
  }
});

export const { showToast, hideToast, decrementUnreadCount, clearUnreadCount } = notificationSlice.actions;
export default notificationSlice.reducer;
