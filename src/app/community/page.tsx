"use client";
import Link from "next/link";
import { useState } from "react";
import { Icon, Paper, Sketch, Stamp, Tag } from "@/components/Bits";
import { CATEGORIES, CHALLENGE, POSTS, RULES } from "@/data/mock";

export default function Community() {
  const [cat, setCat] = useState("All");
  const [joined, setJoined] = useState(false);
  const [did, setDid] = useState<string[]>([]);
  const posts = POSTS.filter((p) => cat === "All" || p.category === cat);
  return (
    <main className="page rel" style={{ minHeight: "calc(100vh - 84px)", background: "url(/textures/kraft3.jpg) center / cover", paddingLeft: 72 }}>
      <div className="row between" style={{ alignItems: "flex-start", marginBottom: 20 }}>
        <div style={{ maxWidth: 760 }}>
          <h1 className="fell rv" style={{ fontSize: 46 }}>Community ledger</h1>
          <p className="bd soft" style={{ fontSize: 18, margin: "8px 0 0" }}>Real things members did, with a photo of the work and the estimated impact. Adopt one and it counts toward your points.</p>
        </div>
        <Link href="/community/new" className="btn"><Icon name="plus" size={16} /> Share what you did</Link>
      </div>
      <div className="row" style={{ gap: 10, marginBottom: 28 }}>
        {CATEGORIES.map((c, k) => <Tag key={c} paper on={c === cat} rot={k % 2 ? 1.5 : -1.5} onClick={() => setCat(c)}>{c}</Tag>)}
      </div>
      <div className="cols" style={{ gridTemplateColumns: "minmax(0, 1fr) 400px", gap: 48 }}>
        <div className="stack" style={{ gap: 40 }}>
          {posts.length === 0 && <p className="hand soft" style={{ fontSize: 22 }}>nothing pinned under {cat} yet. be the first.</p>}
          {posts.map((p, k) => {
            const done = did.includes(p.id);
            return (
              <div key={p.id} className="row" style={{ gap: 32, alignItems: "flex-start", flexDirection: k % 2 ? "row-reverse" : "row", flexWrap: "nowrap" }}>
                <Paper tone="print" rot={k % 2 ? 2 : -2.5} pin style={{ width: 380, flex: "0 0 380px" }}>
                  <img src={p.photo} alt={p.title} style={{ width: 356, height: 254, objectFit: "cover" }} />
                  <span className="ty" style={{ display: "block", marginTop: 10, fontSize: 10 }}>{p.caption}</span>
                </Paper>
                <Paper rot={k % 2 ? -0.8 : 1} tape={k % 2 ? undefined : "both"} pin={k % 2 === 1} style={{ flex: 1, padding: "16px 18px" }}>
                  <div className="stack" style={{ gap: 8 }}>
                    <div className="row" style={{ gap: 8 }}><Tag>{p.persona}</Tag><Tag on rot={-2}>{p.category}</Tag><span className="ty" style={{ fontSize: 10 }}>{p.ago}</span></div>
                    <h2 className="fell" style={{ fontSize: 22 }}>{p.title}</h2>
                    <p className="bd" style={{ margin: 0, fontSize: 14 }}>{p.body}</p>
                    <div className="row" style={{ gap: 12 }}>
                      {p.tutorial && <span className="row bd link" style={{ gap: 5, fontSize: 13 }}><Icon name="book" size={13} /> {p.tutorial}</span>}
                      <Stamp tone="moss" sm>about {p.impactKg} kg CO₂e {p.impactKg > 100 ? "a year" : "avoided"}</Stamp>
                    </div>
                    <div className="row" style={{ gap: 8 }}>
                      <button className={`btn btn--sm ${done ? "" : "btn--outline"}`} onClick={() => setDid((d) => d.includes(p.id) ? d.filter((x) => x !== p.id) : [...d, p.id])}><Icon name="check" size={13} /> I did this too ({p.didIt + (done ? 1 : 0)})</button>
                      <button className="btn btn--sm btn--outline">Helpful ({p.helpful})</button>
                      <span style={{ flex: 1 }} />
                      <button className="ty link" style={{ fontSize: 10 }}>report</button>
                    </div>
                  </div>
                </Paper>
              </div>
            );
          })}
        </div>
        <div className="stack" style={{ gap: 28 }}>
          <Paper tone="dark" rot={-1.5} pin style={{ padding: "16px 18px" }}>
            <span className="kicker" style={{ fontSize: 11, letterSpacing: 2 }}>This week&apos;s challenge</span>
            <h2 className="fell" style={{ fontSize: 26, margin: "6px 0" }}>{CHALLENGE.title}</h2>
            <p className="bd" style={{ margin: 0, fontSize: 15 }}>{CHALLENGE.text}</p>
            <div className="row between" style={{ marginTop: 10 }}><span className="ty" style={{ fontSize: 10 }}>{CHALLENGE.joined + (joined ? 1 : 0)} members joined</span><button className={`btn btn--sm ${joined ? "btn--outline" : ""}`} onClick={() => setJoined(!joined)}>{joined ? "Joined" : "Join"}</button></div>
          </Paper>
          <Paper rot={1} tape="tc" style={{ padding: "16px 18px" }}>
            <h2 className="fell" style={{ fontSize: 22, marginBottom: 8 }}>House rules</h2>
            {RULES.map(([ic, t]) => <p key={t} className="row bd" style={{ margin: "6px 0", gap: 8, fontSize: 14, flexWrap: "nowrap", alignItems: "flex-start" }}><Icon name={ic} size={14} color="var(--moss-deep)" /> {t}</p>)}
          </Paper>
        </div>
      </div>
      <Sketch name="cup" x={760} y={150} w={46} rot={8} opacity={0.7} />
      <Sketch name="bag" right={60} bottom={30} w={80} rot={-10} opacity={0.7} />
    </main>
  );
}
