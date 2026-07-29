import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';
import { fetchInventorySummary } from './reportSlice';
import { fetchProducts } from './productSlice';

const initialState = {
  stockSummary: [],   // current stock levels per product
  stockAlerts: { lowStock: [], nearExpiry: [], expired: [] },
  stockLogs: [],
  loading: false,
  alertsLoading: false,
  error: null,
};

// ── Thunk: fetch current stock summary (GET /api/stock) ─────────────────────
export const fetchStockSummary = createAsyncThunk(
  'stock/fetchStockSummary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/stock');
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch stock summary.');
    }
  }
);

// ── Thunk: fetch stock alerts (GET /api/stock/alerts) ───────────────────────
export const fetchStockAlerts = createAsyncThunk(
  'stock/fetchStockAlerts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/stock/alerts');
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch stock alerts.');
    }
  }
);

// ── Thunk: fetch stock logs (GET /api/stock/logs) ───────────────────────────
export const fetchStockLogs = createAsyncThunk(
  'stock/fetchStockLogs',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await API.get('/stock/logs', { params });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch stock logs.');
    }
  }
);

// ── Thunk: adjust stock and refresh summary, alerts, reports & product master ─
export const adjustStock = createAsyncThunk(
  'stock/adjustStock',
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const response = await API.post('/stock/adjust', payload);
      dispatch(fetchStockSummary());
      dispatch(fetchStockAlerts());
      dispatch(fetchInventorySummary());
      dispatch(fetchProducts());
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to adjust stock.');
    }
  }
);

const stockSlice = createSlice({
  name: 'stock',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStockSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStockSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.stockSummary = action.payload.stock || [];
      })
      .addCase(fetchStockSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchStockAlerts.pending, (state) => {
        state.alertsLoading = true;
      })
      .addCase(fetchStockAlerts.fulfilled, (state, action) => {
        state.alertsLoading = false;
        state.stockAlerts = action.payload.alerts || { lowStock: [], nearExpiry: [], expired: [] };
      })
      .addCase(fetchStockAlerts.rejected, (state, action) => {
        state.alertsLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchStockLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStockLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.stockLogs = action.payload.logs || action.payload || [];
      })
      .addCase(fetchStockLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default stockSlice.reducer;
