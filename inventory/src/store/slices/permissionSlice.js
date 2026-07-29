import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  permissionsList: [],
};

const permissionSlice = createSlice({
  name: 'permissions',
  initialState,
  reducers: {
    setPermissions: (state, action) => {
      state.permissionsList = action.payload || [];
    },
    clearPermissions: (state) => {
      state.permissionsList = [];
    }
  }
});

export const { setPermissions, clearPermissions } = permissionSlice.actions;
export default permissionSlice.reducer;
