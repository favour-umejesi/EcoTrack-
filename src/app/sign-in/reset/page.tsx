"use client";
import Link from "next/link";
import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon, Paper, Sketch, Stamp } from "@/components/Bits";
import { authClient } from "@/lib/auth/client";
import { explain } from "@/lib/auth/errors";

export default function ResetPage() {
  return <Suspense fallback={null}><Reset /></Suspense>;
}

function Reset() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const expired = !token || params.get("error") === "INVALID_TOKEN";
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Use at least eight characters for the password."); return; }
    if (password !== again) { setError("The two passwords do not match."); return; }
    if (!token) return;
    setBusy(true);
    const { error: err } = await authClient.resetPassword({ newPassword: password, token });
    setBusy(false);
    if (err) { setError(explain(err)); return; }
    router.push("/sign-in?reset=done");
  };

  return (
    <main className="page ruled rel" style={{ minHeight: "calc(100vh - 84px)" }}>
      <div className="stack" style={{ gap: 18, maxWidth: 620 }}>
        <div>
          <h1 className="fell rv" style={{ fontSize: 36 }}>Choose a new password</h1>
          <p className="bd soft" style={{ margin: "4px 0 0" }}>Eight characters or more. A few unrelated words are easier to remember than a jumble.</p>
        </div>
        {expired ? (
          <Paper tone="kraft" rot={0.6} pin style={{ width: 520, padding: "22px 24px" }}>
            <span><Stamp rot={-4}>Expired</Stamp></span>
            <h2 className="fell" style={{ fontSize: 24, margin: "12px 0 6px" }}>This link has lapsed</h2>
            <p className="bd" style={{ margin: 0, fontSize: 15 }}>Reset links work for fifteen minutes and only once. Ask for a fresh one and try again.</p>
            <div style={{ marginTop: 14 }}><Link href="/sign-in?view=forgot" className="btn btn--outline btn--sm">Send a new link</Link></div>
          </Paper>
        ) : (
          <Paper rot={-0.8} pin style={{ width: 520, padding: "22px 24px" }}>
            <form className="stack" style={{ gap: 16 }} onSubmit={submit} noValidate>
              <label className="field">
                <span className="ty">New password</span>
                <span className="blank">
                  <input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={8} />
                  <button type="button" className="ty" onClick={() => setShow((s) => !s)}>{show ? "hide" : "show"}</button>
                </span>
              </label>
              <label className="field">
                <span className="ty">Once more</span>
                <span className="blank"><input type={show ? "text" : "password"} value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" minLength={8} /></span>
              </label>
              {error && (
                <div className="row" style={{ gap: 12, flexWrap: "nowrap", alignItems: "flex-start" }}>
                  <Stamp sm rot={-3}>Hold on</Stamp>
                  <p className="bd rust" style={{ margin: 0, fontSize: 14 }}>{error}</p>
                </div>
              )}
              <div className="row between">
                <button className="btn" type="submit" disabled={busy}><Icon name="check" size={16} /> {busy ? "One moment" : "Save the new password"}</button>
                <Link href="/sign-in" className="ty link">back to sign in</Link>
              </div>
            </form>
          </Paper>
        )}
      </div>
      <Sketch name="hand-plant" right={70} bottom={30} w={130} rot={-6} />
    </main>
  );
}
