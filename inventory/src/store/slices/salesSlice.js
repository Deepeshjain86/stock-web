import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';
import { fetchInventorySummary } from './reportSlice';
import { fetchStockSummary, fetchStockAlerts } from './stockSlice';
import { fetchProducts } from './productSlice';

const initialState = {
  sales: [],
  loading: false,
  error: null,
};

export const fetchSales = createAsyncThunk(
  'sales/fetchSales',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await API.get('/sales', { params });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch sales.');
    }
  }
);

// After a sale, immediately refresh stock summary, alerts, product master, and inventory report
export const createSale = createAsyncThunk(
  'sales/createSale',
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const response = await API.post('/sales', payload);
      dispatch(fetchStockSummary());
      dispatch(fetchStockAlerts());
      dispatch(fetchInventorySummary());
      dispatch(fetchProducts());
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create sale.');
    }
  }
);

// After a sale is cancelled, restore all stock views
export const deleteSale = createAsyncThunk(
  'sales/deleteSale',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const response = await API.delete(`/sales/${id}`);
      dispatch(fetchStockSummary());
      dispatch(fetchStockAlerts());
      dispatch(fetchInventorySummary());
      dispatch(fetchProducts());
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to cancel sale.');
    }
  }
);

const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSales.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSales.fulfilled, (state, action) => {
        state.loading = false;
        state.sales = action.payload.sales || action.payload || [];
      })
      .addCase(fetchSales.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default salesSlice.reducer;
