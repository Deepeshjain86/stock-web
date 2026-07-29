import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';
import { fetchInventorySummary } from './reportSlice';
import { fetchStockSummary, fetchStockAlerts } from './stockSlice';
import { fetchProducts } from './productSlice';

const initialState = {
  purchases: [],
  loading: false,
  error: null,
};

export const fetchPurchases = createAsyncThunk(
  'purchase/fetchPurchases',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await API.get('/purchases', { params });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch purchases.');
    }
  }
);

// After a purchase (stock-in), refresh all stock-dependent views
export const createPurchase = createAsyncThunk(
  'purchase/createPurchase',
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const response = await API.post('/purchases', payload);
      dispatch(fetchStockSummary());
      dispatch(fetchStockAlerts());
      dispatch(fetchInventorySummary());
      dispatch(fetchProducts());
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create purchase.');
    }
  }
);

// After a purchase is deleted, restore stock views
export const deletePurchase = createAsyncThunk(
  'purchase/deletePurchase',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const response = await API.delete(`/purchases/${id}`);
      dispatch(fetchStockSummary());
      dispatch(fetchStockAlerts());
      dispatch(fetchInventorySummary());
      dispatch(fetchProducts());
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete purchase.');
    }
  }
);

const purchaseSlice = createSlice({
  name: 'purchase',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPurchases.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchases.fulfilled, (state, action) => {
        state.loading = false;
        state.purchases = action.payload.purchases || action.payload || [];
      })
      .addCase(fetchPurchases.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default purchaseSlice.reducer;
