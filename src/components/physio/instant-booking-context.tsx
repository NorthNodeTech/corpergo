import { createContext, useContext, type ReactNode } from "react";

const InstantBookingContext = createContext<(() => void) | null>(null);

export function InstantBookingProvider({
  open,
  children,
}: {
  open: () => void;
  children: ReactNode;
}) {
  return (
    <InstantBookingContext.Provider value={open}>{children}</InstantBookingContext.Provider>
  );
}

export function useOpenInstantBooking() {
  return useContext(InstantBookingContext) || (() => undefined);
}
