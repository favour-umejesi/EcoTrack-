"use client";
import { createContext, useContext } from "react";
import { authClient } from "@/lib/auth/client";

export type Mode = "guest" | "member";
type Session = {
  mode: Mode;
  /** False until the first session check has answered, so the nav does not flash the wrong state. */
  ready: boolean;
  signOut: () => Promise<void>;
  persona: { name: string };
};

const Ctx = createContext<Session>({ mode: "guest", ready: false, signOut: async () => {}, persona: { name: "Quiet Fern" } });

/** Real session from Neon Auth. The display name is the auth user's name; the profile page keeps it in step with the persona table. */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { data, isPending } = authClient.useSession();
  const user = data?.user;
  return (
    <Ctx.Provider value={{ mode: user ? "member" : "guest", ready: !isPending, signOut: async () => { await authClient.signOut(); }, persona: { name: user?.name || "Quiet Fern" } }}>
      {children}
    </Ctx.Provider>
  );
}
export const useSession = () => useContext(Ctx);
