import { createSlice } from '@reduxjs/toolkit';

/**
 * Sidebar has exactly THREE valid states:
 *  1. COLLAPSED  — icons only (default on desktop)
 *  2. HOVER      — full width while mouse is over sidebar (desktop, hover mode only)
 *  3. PINNED     — permanently full width until user unpins
 *
 * On mobile: controlled by isOpen (drawer overlay pattern)
 * isPinned is persisted to localStorage so it survives page refresh.
 */
const initialState = {
  isPinned: (() => {
    const saved = localStorage.getItem('sidebarPinned');
    // Default: NOT pinned — sidebar collapsed by default
    return saved === 'true';
  })(),
  isOpen: false, // mobile drawer open state
};

const sidebarSlice = createSlice({
  name: 'sidebar',
  initialState,
  reducers: {
    togglePin: (state) => {
      state.isPinned = !state.isPinned;
      localStorage.setItem('sidebarPinned', String(state.isPinned));
    },
    setPinned: (state, action) => {
      state.isPinned = action.payload;
      localStorage.setItem('sidebarPinned', String(action.payload));
    },
    toggleSidebar: (state) => {
      state.isOpen = !state.isOpen;
    },
    setSidebarOpen: (state, action) => {
      state.isOpen = action.payload;
    },
  },
});

export const { togglePin, setPinned, toggleSidebar, setSidebarOpen } = sidebarSlice.actions;
export default sidebarSlice.reducer;
