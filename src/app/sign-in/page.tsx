"use client";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon, Paper, Sketch, Stamp, Tag } from "@/components/Bits";
import { useSession } from "@/components/Session";
import { authClient } from "@/lib/auth/client";
import { PERSONA_NAMES } from "@/data/mock";
import { explain, MESSAGES } from "@/lib/auth/errors";

type View = "in" | "new" | "forgot";
type Sent = { kind: "verify" | "reset"; email: string };

const COPY: Record<View, { title: string; blurb: string; cta: string }> = {
  in: { title: "Open your ledger", blurb: "Sign in and your weekly logs, streak and character are waiting where you left them.", cta: "Sign in" },
  new: { title: "Start a ledger", blurb: "An account keeps your logs month by month. Pick a name for your character; it is the only name anyone sees.", cta: "Start my ledger" },
  forgot: { title: "Lost your password", blurb: "Tell us the email on the ledger and we will post you a link to choose a new one.", cta: "Send the link" },
};
const KEEPS: [string, string][] = [
  ["calendar", "Your weekly logs, kept month by month so you can watch the line move."],
  ["sprout", "A character of your choosing. Posts and streaks show that name, never your email."],
  ["flag", "Points for improving, and a streak with one grace skip a month."],
  ["download", "Everything exportable as JSON, and deletable in one go."],
];
/** Three suggestions at a time; the first three are fixed so server and client render the same page. */
const firstPicks = () => PERSONA_NAMES.slice(0, 3);
const rollPicks = () => [...PERSONA_NAMES].sort(() => Math.random() - 0.5).slice(0, 3);
/** Only same-site paths may be used as a return address. */
const safeNext = (n: string | null) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/track");
const asView = (v: string | null): View => (v === "new" || v === "forgot" ? v : "in");

export default function SignInPage() {
  return <Suspense fallback={null}><SignIn /></Suspense>;
}

function SignIn() {
  const router = useRouter();
  const params = useSearchParams();
  const { mode, ready } = useSession();
  const next = safeNext(params.get("next"));
  const [view, setView] = useState<View>(() => asView(params.get("view")));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [picks, setPicks] = useState<string[]>(firstPicks);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState<Sent | null>(null);
  const note = params.get("reset") === "done" ? "Password changed. Sign in with the new one." : "";

  // Already a member? There is nothing to do here.
  useEffect(() => { if (ready && mode === "member" && !sent) router.replace(next); }, [ready, mode, sent, next, router]);

  const switchTo = (v: View) => { setView(v); setError(""); };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const em = email.trim();
    if (!em.includes("@")) { setError(MESSAGES.INVALID_EMAIL); return; }
    if (view !== "forgot" && password.length < 8) { setError(MESSAGES.PASSWORD_TOO_SHORT); return; }
    if (view === "new" && !name.trim()) { setError("Give your character a name. It is the only name the community will see."); return; }
    const origin = window.location.origin;
    setBusy(true);
    try {
      if (view === "in") {
        const { error: err } = await authClient.signIn.email({ email: em, password, rememberMe: true });
        if (err) { setError(explain(err)); return; }
        router.push(next);
      } else if (view === "new") {
        const { data, error: err } = await authClient.signUp.email({ name: name.trim(), email: em, password, callbackURL: origin + next });
        if (err) { setError(explain(err)); return; }
        // No token means Neon is holding the session until the email is verified.
        if (data && !data.token) { setSent({ kind: "verify", email: em }); return; }
        router.push(next);
      } else {
        const { error: err } = await authClient.requestPasswordReset({ email: em, redirectTo: origin + "/sign-in/reset" });
        if (err) { setError(explain(err)); return; }
        setSent({ kind: "reset", email: em });
      }
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (!sent) return;
    setBusy(true);
    setError("");
    const origin = window.location.origin;
    const { error: err } = sent.kind === "verify"
      ? await authClient.sendVerificationEmail({ email: sent.email, callbackURL: origin + next })
      : await authClient.requestPasswordReset({ email: sent.email, redirectTo: origin + "/sign-in/reset" });
    setBusy(false);
    if (err) setError(explain(err));
  };

  const { title, blurb, cta } = COPY[view];
  return (
    <main className="page ruled rel" style={{ minHeight: "calc(100vh - 84px)" }}>
      <div className="cols" style={{ gridTemplateColumns: "minmax(0, 620px) 400px", gap: 64 }}>
        <div className="stack" style={{ gap: 18 }}>
          <div>
            <h1 className="fell rv" style={{ fontSize: 36 }}>{title}</h1>
            <p className="bd soft" style={{ margin: "4px 0 0", maxWidth: 520 }}>{blurb}</p>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <Tag on={view === "in"} rot={-1.5} onClick={() => switchTo("in")}>I have a ledger</Tag>
            <Tag on={view === "new"} rot={1.5} onClick={() => switchTo("new")}>Start a new one</Tag>
          </div>

          {sent ? (
            <Paper tone="kraft" rot={0.6} pin style={{ width: 520, padding: "22px 24px" }}>
              <span><Stamp tone="moss" rot={-4}>Posted</Stamp></span>
              <h2 className="fell" style={{ fontSize: 24, margin: "12px 0 6px" }}>{sent.kind === "verify" ? "Check your post" : "A reset link is on its way"}</h2>
              <p className="bd" style={{ margin: 0, fontSize: 15 }}>
                We sent a link to <strong>{sent.email}</strong>. It works for fifteen minutes. {sent.kind === "verify" ? "Open it and your ledger is ready." : "Open it to choose a new password."}
              </p>
              {error && <p className="bd rust" style={{ margin: "10px 0 0", fontSize: 14 }}>{error}</p>}
              <div className="row" style={{ gap: 14, marginTop: 14 }}>
                <button className="btn btn--outline btn--sm" onClick={resend} disabled={busy}>{busy ? "Sending" : "Send it again"}</button>
                <button className="ty link" onClick={() => { setSent(null); switchTo("in"); }}>back to sign in</button>
              </div>
            </Paper>
          ) : (
            <Paper rot={-0.8} pin style={{ width: 520, padding: "22px 24px" }}>
              <form className="stack" style={{ gap: 16 }} onSubmit={submit} noValidate>
                {view === "new" && (
                  <div className="stack" style={{ gap: 10 }}>
                    <label className="field">
                      <span className="ty">Name your character</span>
                      <span className="blank"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="anything you like, or take one from below" autoComplete="nickname" maxLength={40} /></span>
                    </label>
                    <div className="row" style={{ gap: 10, flexWrap: "nowrap" }}>
                      {picks.map((p, k) => <Tag key={p} paper on={p === name} rot={k % 2 ? 1.5 : -1.5} onClick={() => setName(p)}>{p}</Tag>)}
                      <button type="button" className="ty link" style={{ fontSize: 10, marginLeft: 4 }} onClick={() => setPicks(rollPicks())}>shuffle</button>
                    </div>
                  </div>
                )}
                <label className="field">
                  <span className="ty">Email</span>
                  <span className="blank"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" /></span>
                </label>
                {view !== "forgot" && (
                  <label className="field">
                    <span className="ty">Password</span>
                    <span className="blank">
                      <input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={view === "new" ? "new-password" : "current-password"} minLength={8} />
                      <button type="button" className="ty" onClick={() => setShow((s) => !s)}>{show ? "hide" : "show"}</button>
                    </span>
                  </label>
                )}
                {error && (
                  <div className="row" style={{ gap: 12, flexWrap: "nowrap", alignItems: "flex-start" }}>
                    <Stamp sm rot={-3}>Hold on</Stamp>
                    <p className="bd rust" style={{ margin: 0, fontSize: 14 }}>{error}</p>
                  </div>
                )}
                <div className="row between" style={{ gap: 12 }}>
                  <button className="btn" type="submit" disabled={busy}>{busy ? "One moment" : cta}</button>
                  <span className="row" style={{ gap: 16 }}>
                    {view === "in" && <button type="button" className="ty rust link" onClick={() => switchTo("forgot")}>forgot your password?</button>}
                    {view === "in" && <button type="button" className="ty link" onClick={() => switchTo("new")}>new here? start a ledger</button>}
                    {view === "new" && <button type="button" className="ty link" onClick={() => switchTo("in")}>already have a ledger? sign in</button>}
                    {view === "forgot" && <button type="button" className="ty link" onClick={() => switchTo("in")}>back to sign in</button>}
                  </span>
                </div>
              </form>
            </Paper>
          )}

          {note && <p className="hand moss" style={{ margin: 0, transform: "rotate(-1deg)" }}>{note}</p>}
          <p className="hand soft" style={{ margin: "6px 0 0", transform: "rotate(-2deg)", maxWidth: 420 }}>your guest sums stay in this browser and come along once you sign in.</p>
        </div>

        <div className="stack" style={{ gap: 22, paddingTop: 8 }}>
          <Paper tone="dark" rot={1.4} tape="both" style={{ padding: "18px 20px" }}>
            <h2 className="fell" style={{ fontSize: 20, marginBottom: 8 }}>What a ledger keeps</h2>
            {KEEPS.map(([icon, text]) => (
              <div key={icon} className="row" style={{ gap: 12, padding: "7px 0", flexWrap: "nowrap", alignItems: "flex-start" }}>
                <Icon name={icon} size={18} color="var(--moss-deep)" />
                <span className="bd" style={{ fontSize: 15 }}>{text}</span>
              </div>
            ))}
          </Paper>
          <Paper rot={-1} style={{ padding: "14px 18px" }}>
            <div className="row" style={{ gap: 12, flexWrap: "nowrap", alignItems: "flex-start" }}>
              <Icon name="shield" size={20} color="var(--moss-deep)" />
              <p className="bd" style={{ margin: 0, fontSize: 13 }}>Your email is only for signing in and the odd reset link. The community sees your character and nothing else.</p>
            </div>
          </Paper>
          <span style={{ alignSelf: "flex-end", marginRight: 24 }}><Stamp tone="moss" rot={-6}>No trackers</Stamp></span>
        </div>
      </div>
      <Sketch name="leaf" x={560} y={30} w={64} rot={14} />
      <Sketch name="hand-plant" right={70} bottom={30} w={130} rot={-6} />
    </main>
  );
}
