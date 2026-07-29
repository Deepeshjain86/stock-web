import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

const initialState = {
  subCategories: [],
  loading: false,
  error: null,
};

export const fetchSubCategories = createAsyncThunk(
  'subCategories/fetchSubCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/categories?level=1');
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch sub-categories.');
    }
  }
);

const subCategorySlice = createSlice({
  name: 'subCategories',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.subCategories = action.payload.categories || action.payload || [];
      })
      .addCase(fetchSubCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default subCategorySlice.reducer;
