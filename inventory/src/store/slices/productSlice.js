import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';
import { fetchInventorySummary } from './reportSlice';

const initialState = {
  products: [],
  totalCount: 0,
  loading: false,
  error: null,
};

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await API.get('/products', { params });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch products.');
    }
  }
);

export const createProduct = createAsyncThunk(
  'products/createProduct',
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const response = await API.post('/products', payload);
      dispatch(fetchInventorySummary());
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create product.');
    }
  }
);

export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async ({ id, payload }, { dispatch, rejectWithValue }) => {
    try {
      const response = await API.put(`/products/${id}`, payload);
      dispatch(fetchInventorySummary());
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update product.');
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const response = await API.delete(`/products/${id}`);
      dispatch(fetchInventorySummary());
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete product.');
    }
  }
);

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products || [];
        state.totalCount = action.payload.total || 0;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default productSlice.reducer;
