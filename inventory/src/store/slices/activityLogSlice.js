import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { usersAPI } from '../../services/api';

const initialState = {
  logs: [],
  loading: false,
  error: null,
};

export const fetchActivityLogs = createAsyncThunk(
  'activityLogs/fetchActivityLogs',
  async (_, { rejectWithValue }) => {
    try {
      const response = await usersAPI.getActivityLogs();
      return response.logs || response || [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch activity logs.');
    }
  }
);

const activityLogSlice = createSlice({
  name: 'activityLogs',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivityLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActivityLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.logs = action.payload;
      })
      .addCase(fetchActivityLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default activityLogSlice.reducer;
