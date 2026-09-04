import Link from "next/link";
import { Paper } from "./Bits";

export default function HomeCta() {
  return (
    <div className="rel" style={{ marginTop: 24 }}>
      <Paper tone="dark" rot={1.2} tape="both" style={{ width: 480, padding: "22px 24px" }}>
        <div className="row" style={{ gap: 16 }}>
          <Link href="/calculator" className="btn btn--lg">Begin as a guest</Link>
          <Link href="/sign-in" className="bd link" style={{ fontSize: 17 }}>or sign in to keep your ledger</Link>
        </div>
      </Paper>
      <p className="hand soft" style={{ position: "absolute", left: 500, top: 60, width: 260, transform: "rotate(-4deg)", margin: 0 }}>no account, no tracking. just the sums.</p>
    </div>
  );
}
