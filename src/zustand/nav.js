import { create } from "zustand";

export const useNavStore = create((set) => ({
  value: " ",
  setValue: (newValue) => set({ value: newValue }),
}));
