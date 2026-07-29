import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { usersAPI } from '../../services/api';

const initialState = {
  staffList: [],
  roles: [],
  loading: false,
  error: null,
};

export const fetchStaff = createAsyncThunk(
  'staff/fetchStaff',
  async (_, { rejectWithValue }) => {
    try {
      const response = await usersAPI.getAll();
      return response.users || response || [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch staff list.');
    }
  }
);

export const fetchRoles = createAsyncThunk(
  'staff/fetchRoles',
  async (_, { rejectWithValue }) => {
    try {
      const response = await usersAPI.getRoles();
      return response.roles || response || [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch roles.');
    }
  }
);

const staffSlice = createSlice({
  name: 'staff',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStaff.fulfilled, (state, action) => {
        state.loading = false;
        state.staffList = action.payload;
      })
      .addCase(fetchStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.roles = action.payload;
      });
  }
});

export default staffSlice.reducer;
