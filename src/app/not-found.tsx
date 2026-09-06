import Link from "next/link";
import { Paper, Sketch, Stamp } from "@/components/Bits";

export default function NotFound() {
  return (
    <main className="page ruled rel" style={{ minHeight: "calc(100vh - 84px)" }}>
      <Paper tone="kraft" rot={-1} pin style={{ width: 520, padding: "22px 24px", marginTop: 40 }}>
        <span><Stamp rot={-5}>Not in the ledger</Stamp></span>
        <h1 className="fell" style={{ fontSize: 32, margin: "12px 0 6px" }}>There is no page here</h1>
        <p className="bd" style={{ margin: 0, fontSize: 15 }}>The address may be old, or mistyped. Nothing was lost.</p>
        <div className="row" style={{ gap: 14, marginTop: 14 }}>
          <Link href="/" className="btn btn--sm">Back to the start</Link>
          <Link href="/calculator" className="ty link">the calculator</Link>
        </div>
      </Paper>
      <Sketch name="leaf" right={80} bottom={60} w={110} rot={-12} />
    </main>
  );
}
