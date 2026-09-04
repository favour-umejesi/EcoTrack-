"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "./Session";

const LINKS = [["Calculator", "/calculator"], ["Insights", "/insights"], ["Track", "/track"], ["Community", "/community"]] as const;

export default function Nav() {
  const path = usePathname();
  const router = useRouter();
  const { mode, signIn, signOut, persona } = useSession();
  return (
    <nav className="nav">
      <Link href="/" className="nav__brand" aria-label="EcoTrack home"><img src="/images/wordmark.png" alt="EcoTrack" /></Link>
      {LINKS.map(([label, href]) => (
        <Link key={href} href={href} className={`nav__link ${path.startsWith(href) ? "nav__link--on" : ""}`}>{label}</Link>
      ))}
      {mode === "guest" ? (
        <>
          <span className="ty">guest ledger</span>
          <button className="btn btn--outline btn--sm" onClick={() => { signIn(); router.push("/track"); }}>Sign in</button>
        </>
      ) : (
        <>
          <Link href="/profile" className="persona"><LeafIcon /> {persona.name}</Link>
          <button className="ty link" onClick={() => { signOut(); router.push("/"); }}>sign out</button>
        </>
      )}
    </nav>
  );
}

function LeafIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--moss-deep)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20c0-8 6-14 16-16-1 10-7 16-16 16Z"/><path d="M4 20c4-4 8-8 12-12"/></svg>;
}
