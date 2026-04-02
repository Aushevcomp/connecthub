import { create } from "zustand";
import type { Profile } from "@/types";

type AuthModalMode = "login" | "register";

interface AppState {
  user: Profile | null;
  setUser: (user: Profile | null) => void;

  authModalOpen: boolean;
  authModalMode: AuthModalMode;
  openAuthModal: (mode?: AuthModalMode) => void;
  closeAuthModal: () => void;

  feedTab: "all" | "companies" | "people" | "polls";
  setFeedTab: (tab: AppState["feedTab"]) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  setUser: (user) => {
    const current = get().user;
    // Don't update if same user data (prevent infinite re-renders)
    if (current?.id === user?.id && current?.updated_at === user?.updated_at && current?.name === user?.name) return;
    set({ user });
  },

  authModalOpen: false,
  authModalMode: "login",
  openAuthModal: (authModalMode = "login") => set({ authModalOpen: true, authModalMode }),
  closeAuthModal: () => set({ authModalOpen: false, authModalMode: "login" }),

  feedTab: "all",
  setFeedTab: (feedTab) => set({ feedTab }),
}));
