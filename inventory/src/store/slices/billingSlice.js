import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

const initialState = {
  billingInfo: null,
  loading: false,
  error: null,
};

export const fetchBillingInfo = createAsyncThunk(
  'billing/fetchBillingInfo',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/billing/status');
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch billing status.');
    }
  }
);

const billingSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBillingInfo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBillingInfo.fulfilled, (state, action) => {
        state.loading = false;
        state.billingInfo = action.payload;
      })
      .addCase(fetchBillingInfo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default billingSlice.reducer;
