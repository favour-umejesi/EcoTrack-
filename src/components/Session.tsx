"use client";
import { createContext, useContext } from "react";
import { authClient } from "@/lib/auth/client";
import { useLocalValue } from "@/lib/store";

export type Mode = "guest" | "member";
type Session = {
  mode: Mode;
  /** False until the first session check has answered, so the nav does not flash the wrong state. */
  ready: boolean;
  signOut: () => Promise<void>;
  persona: { name: string; character: string };
};

const FALLBACK = { name: "Quiet Fern", character: "fern" };
const Ctx = createContext<Session>({ mode: "guest", ready: false, signOut: async () => {}, persona: FALLBACK });

/** Real session from Neon Auth. The character still lives in localStorage until profiles have a table. */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { data, isPending } = authClient.useSession();
  const character = useLocalValue("ecotrack.character", FALLBACK.character);
  const user = data?.user;
  return (
    <Ctx.Provider
      value={{
        mode: user ? "member" : "guest",
        ready: !isPending,
        signOut: async () => { await authClient.signOut(); },
        persona: { name: user?.name || FALLBACK.name, character },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
export const useSession = () => useContext(Ctx);
