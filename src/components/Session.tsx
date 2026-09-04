"use client";
import { createContext, useContext } from "react";
import { useLocalValue, writeKey } from "@/lib/store";

export type Mode = "guest" | "member";
type Session = { mode: Mode; signIn: () => void; signOut: () => void; persona: { name: string; character: string } };

const Ctx = createContext<Session>({ mode: "guest", signIn: () => {}, signOut: () => {}, persona: { name: "Quiet Fern", character: "fern" } });

/** Mock session: no real auth yet. The mode lives in localStorage so the guest → member flow can be walked through. */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const mode = useLocalValue("ecotrack.mode", "guest") as Mode;
  const set = (m: Mode) => writeKey("ecotrack.mode", m);
  return (
    <Ctx.Provider value={{ mode, signIn: () => set("member"), signOut: () => set("guest"), persona: { name: "Quiet Fern", character: "fern" } }}>
      {children}
    </Ctx.Provider>
  );
}
export const useSession = () => useContext(Ctx);
