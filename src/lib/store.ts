import { create } from "zustand";
import type { Profile } from "@/types";

interface AppState {
  // Auth
  user: Profile | null;
  setUser: (user: Profile | null) => void;

  // UI
  authModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;

  // Feed
  feedTab: "all" | "companies" | "people" | "polls";
  setFeedTab: (tab: AppState["feedTab"]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),

  authModalOpen: false,
  openAuthModal: () => set({ authModalOpen: true }),
  closeAuthModal: () => set({ authModalOpen: false }),

  feedTab: "all",
  setFeedTab: (feedTab) => set({ feedTab }),
}));
