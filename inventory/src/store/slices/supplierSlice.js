import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';
import { fetchInventorySummary } from './reportSlice';

const initialState = {
  suppliers: [],
  loading: false,
  error: null,
};

export const fetchSuppliers = createAsyncThunk(
  'suppliers/fetchSuppliers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/vendors');
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch suppliers.');
    }
  }
);

export const createSupplier = createAsyncThunk(
  'suppliers/createSupplier',
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const response = await API.post('/vendors', payload);
      dispatch(fetchInventorySummary());
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create supplier.');
    }
  }
);

export const updateSupplier = createAsyncThunk(
  'suppliers/updateSupplier',
  async ({ id, payload }, { dispatch, rejectWithValue }) => {
    try {
      const response = await API.put(`/vendors/${id}`, payload);
      dispatch(fetchInventorySummary());
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update supplier.');
    }
  }
);

export const deleteSupplier = createAsyncThunk(
  'suppliers/deleteSupplier',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const response = await API.delete(`/vendors/${id}`);
      dispatch(fetchInventorySummary());
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete supplier.');
    }
  }
);

const supplierSlice = createSlice({
  name: 'suppliers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSuppliers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSuppliers.fulfilled, (state, action) => {
        state.loading = false;
        state.suppliers = action.payload.vendors || action.payload || [];
      })
      .addCase(fetchSuppliers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default supplierSlice.reducer;
