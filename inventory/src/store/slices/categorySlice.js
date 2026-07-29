import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';
import { fetchInventorySummary } from './reportSlice';

const initialState = {
  categories: [],
  loading: false,
  error: null,
};

export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/categories');
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch categories.');
    }
  }
);

export const createCategory = createAsyncThunk(
  'categories/createCategory',
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const response = await API.post('/categories', payload);
      dispatch(fetchInventorySummary());
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create category.');
    }
  }
);

export const updateCategory = createAsyncThunk(
  'categories/updateCategory',
  async ({ id, payload }, { dispatch, rejectWithValue }) => {
    try {
      const response = await API.put(`/categories/${id}`, payload);
      dispatch(fetchInventorySummary());
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update category.');
    }
  }
);

export const deleteCategory = createAsyncThunk(
  'categories/deleteCategory',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const response = await API.delete(`/categories/${id}`);
      dispatch(fetchInventorySummary());
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete category.');
    }
  }
);

const categorySlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload.categories || action.payload || [];
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default categorySlice.reducer;
