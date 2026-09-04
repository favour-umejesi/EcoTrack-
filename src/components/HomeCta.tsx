"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Paper } from "./Bits";
import { useSession } from "./Session";

export default function HomeCta() {
  const router = useRouter();
  const { signIn } = useSession();
  return (
    <div className="rel" style={{ marginTop: 24 }}>
      <Paper tone="dark" rot={1.2} tape="both" style={{ width: 480, padding: "22px 24px" }}>
        <div className="row" style={{ gap: 16 }}>
          <Link href="/calculator" className="btn btn--lg">Begin as a guest</Link>
          <button className="bd link" style={{ fontSize: 17 }} onClick={() => { signIn(); router.push("/track"); }}>or sign in to keep your ledger</button>
        </div>
      </Paper>
      <p className="hand soft" style={{ position: "absolute", left: 500, top: 60, width: 260, transform: "rotate(-4deg)", margin: 0 }}>no account, no tracking. just the sums.</p>
    </div>
  );
}
