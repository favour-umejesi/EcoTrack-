import { Paper, Sketch, Stamp } from "@/components/Bits";
import HomeCta from "@/components/HomeCta";

export default function Home() {
  return (
    <main className="page rel" style={{ minHeight: "calc(100vh - 84px)", paddingTop: 60 }}>
      <div className="cols" style={{ gridTemplateColumns: "minmax(0, 700px) 440px", gap: 80 }}>
        <div className="stack" style={{ gap: 22 }}>
          <h1 className="fell rv" style={{ fontSize: 58, maxWidth: 680 }}>Keep an honest ledger of what you take from the world.</h1>
          <p className="bd soft rv" style={{ fontSize: 21, margin: 0, maxWidth: 620 }}>Log what you use, see what it costs the air, and keep the habits that work: mend, thrift, share, take the bus. Every number shows its source.</p>
          <HomeCta />
          <p className="bd soft rv" style={{ fontSize: 18, marginTop: 120 }}>Note what you use. See what it costs the air. Keep the habits that work.</p>
        </div>
        <Paper tone="dark" rot={2} pin style={{ padding: 30 }}>
          <img src="/images/fern.jpg" alt="Engraving of a fern frond" style={{ width: "100%", height: 410, objectFit: "cover", background: "var(--paper)" }} />
          <p className="ty" style={{ marginTop: 16, marginBottom: 0 }}>Plate I. Polypodium vulgare, the common fern</p>
          <p className="bd" style={{ fontSize: 15, margin: "6px 0 0" }}>Grows on old walls and asks for nothing. Every action here is measured against what the air can bear.</p>
          <span style={{ position: "absolute", top: 22, right: 24 }}><Stamp rot={-8}>Specimen</Stamp></span>
        </Paper>
      </div>
      <blockquote className="hand soft" style={{ position: "absolute", right: 96, bottom: 70, width: 420, transform: "rotate(-2deg)", margin: 0 }}>
        “Small acts, when multiplied by millions of people, can transform the world.” <span className="ty" style={{ marginLeft: 6, whiteSpace: "nowrap" }}>~ Howard Zinn</span>
      </blockquote>
      <Sketch name="bag" x={640} y={520} w={70} rot={8} />
      <Sketch name="cup" x={790} y={600} w={58} rot={-7} />
      <Sketch name="bulb" x={800} y={40} w={56} rot={5} />
      <Sketch name="leaf" right={40} bottom={20} w={110} rot={-12} />
    </main>
  );
}
