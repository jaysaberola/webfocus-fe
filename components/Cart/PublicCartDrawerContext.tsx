import { createContext, useCallback, useContext, useMemo, useState } from "react";

type PublicCartDrawerContextValue = {
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const PublicCartDrawerContext = createContext<PublicCartDrawerContextValue | null>(null);

export function PublicCartDrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openDrawer = useCallback(() => setIsOpen(true), []);
  const closeDrawer = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({
      isOpen,
      openDrawer,
      closeDrawer,
    }),
    [isOpen, openDrawer, closeDrawer]
  );

  return <PublicCartDrawerContext.Provider value={value}>{children}</PublicCartDrawerContext.Provider>;
}

export function usePublicCartDrawer() {
  const context = useContext(PublicCartDrawerContext);
  if (!context) {
    throw new Error("usePublicCartDrawer must be used within PublicCartDrawerProvider");
  }
  return context;
}
