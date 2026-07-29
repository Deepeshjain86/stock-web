import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

const initialState = {
  inventorySummary: null,
  loadingSummary: false,
  reportsData: null,
  loading: false,
  error: null,
};

export const fetchInventorySummary = createAsyncThunk(
  'reports/fetchInventorySummary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/reports/inventory-summary');
      return response.data.summary;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch inventory summary.');
    }
  }
);

export const fetchReportData = createAsyncThunk(
  'reports/fetchReportData',
  async ({ type, params }, { rejectWithValue }) => {
    try {
      const response = await API.get(`/reports/${type}`, { params });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch report data.');
    }
  }
);

const reportSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInventorySummary.pending, (state) => {
        state.loadingSummary = true;
        state.error = null;
      })
      .addCase(fetchInventorySummary.fulfilled, (state, action) => {
        state.loadingSummary = false;
        state.inventorySummary = action.payload;
      })
      .addCase(fetchInventorySummary.rejected, (state, action) => {
        state.loadingSummary = false;
        state.error = action.payload;
      })
      .addCase(fetchReportData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReportData.fulfilled, (state, action) => {
        state.loading = false;
        state.reportsData = action.payload;
      })
      .addCase(fetchReportData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default reportSlice.reducer;
