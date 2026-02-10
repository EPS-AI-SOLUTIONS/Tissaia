// src/store/useViewStore.ts
/**
 * View & UI Loading Store
 * =======================
 * Ephemeral navigation and loading state.
 */
import { create } from 'zustand';
import type { View } from '../types';

// ============================================
// STORE INTERFACE
// ============================================

interface ViewState {
  currentView: View;
  setCurrentView: (view: View) => void;

  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  progressMessage: string;
  setProgressMessage: (message: string) => void;
}

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useViewStore = create<ViewState>()((set) => ({
  currentView: 'upload',
  setCurrentView: (view) => set({ currentView: view }),

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  progressMessage: '',
  setProgressMessage: (message) => set({ progressMessage: message }),
}));

// ============================================
// SELECTORS
// ============================================

export const selectCurrentView = (state: ViewState) => state.currentView;
export const selectIsLoading = (state: ViewState) => state.isLoading;
