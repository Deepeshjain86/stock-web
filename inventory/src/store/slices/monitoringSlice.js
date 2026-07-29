import { createSlice } from '@reduxjs/toolkit';

const getInitialMonitoredTenant = () => {
  try {
    const saved = localStorage.getItem('monitoredTenant');
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
};

const initialState = {
  monitoredTenant: getInitialMonitoredTenant(),
  isMonitoringActive: !!localStorage.getItem('monitoredTenant'),
};

const monitoringSlice = createSlice({
  name: 'monitoring',
  initialState,
  reducers: {
    enterMonitoringMode: (state, action) => {
      state.monitoredTenant = action.payload;
      state.isMonitoringActive = true;
      localStorage.setItem('monitoredTenant', JSON.stringify(action.payload));
    },
    exitMonitoringMode: (state) => {
      state.monitoredTenant = null;
      state.isMonitoringActive = false;
      localStorage.removeItem('monitoredTenant');
    }
  }
});

export const { enterMonitoringMode, exitMonitoringMode } = monitoringSlice.actions;
export default monitoringSlice.reducer;
