"use client";
import { useState } from "react";
import { Icon, Paper, Stamp, Tag } from "@/components/Bits";
import type { FeedPost, OpenReport } from "@/db/community-queries";
import { deletePost, moderatePost } from "@/db/community-actions";
import { photoUrl } from "@/lib/photo-url";

export default function ReviewView({ posts: initial, reports }: { posts: FeedPost[]; reports: OpenReport[] }) {
  const [posts, setPosts] = useState(initial);
  const [note, setNote] = useState("");
  const act = async (id: string, action: "hide" | "restore" | "dismiss" | "delete") => {
    setNote("");
    const r = action === "delete" ? await deletePost(id) : await moderatePost(id, action);
    if (!r.ok) { setNote(r.error); return; }
    setPosts((ps) => (action === "delete" ? ps.filter((p) => p.id !== id) : ps.map((p) => (p.id === id ? { ...p, status: action === "hide" ? "hidden" : "visible", openReports: 0 } : p))));
  };
  return (
    <main className="page ruled rel" style={{ minHeight: "calc(100vh - 84px)" }}>
      <h1 className="fell rv" style={{ fontSize: 36 }}>Review</h1>
      <p className="bd soft" style={{ margin: "4px 0 24px" }}>Reported and hidden posts. Hide what breaks the rules, restore what does not, dismiss reports that are just disagreement.</p>
      {note && <p className="bd rust" style={{ margin: "0 0 16px", fontSize: 13 }}>{note}</p>}
      {posts.length === 0 && <p className="hand soft" style={{ fontSize: 22 }}>nothing waiting. the board is clean.</p>}
      <div className="stack" style={{ gap: 24, maxWidth: 820 }}>
        {posts.map((p) => {
          const why = reports.filter((r) => r.postId === p.id);
          return (
            <Paper key={p.id} rot={0.4} style={{ padding: "16px 18px" }}>
              <div className="stack" style={{ gap: 8 }}>
                <div className="row" style={{ gap: 8 }}>
                  <Tag>{p.persona.name}</Tag><Tag on rot={-2}>{p.category}</Tag>
                  <Stamp tone={p.status === "visible" ? "moss" : "rust"} sm>{p.status}</Stamp>
                  {p.openReports > 0 && <Stamp sm>{p.openReports} open {p.openReports === 1 ? "report" : "reports"}</Stamp>}
                </div>
                <h2 className="fell" style={{ fontSize: 22 }}>{p.title}</h2>
                <p className="bd" style={{ margin: 0, fontSize: 14, whiteSpace: "pre-line" }}>{p.body}</p>
                {p.photos.length > 0 && <div className="row" style={{ gap: 10 }}>{p.photos.map((ph) => <img key={ph.id} src={photoUrl(ph.id, "thumb")} alt={ph.alt} style={{ width: 120, height: 120, objectFit: "cover" }} />)}</div>}
                {why.length > 0 && <div className="stack" style={{ gap: 4 }}>{why.map((r) => <p key={r.id} className="row bd soft" style={{ margin: 0, fontSize: 13, gap: 8, flexWrap: "nowrap", alignItems: "flex-start" }}><Icon name="flag" size={13} color="var(--rust)" /> {r.reason}</p>)}</div>}
                <div className="row" style={{ gap: 10 }}>
                  {p.status !== "hidden" && <button className="btn btn--sm btn--outline" onClick={() => act(p.id, "hide")}>Hide</button>}
                  {p.status !== "visible" && <button className="btn btn--sm btn--outline" onClick={() => act(p.id, "restore")}>Restore</button>}
                  {p.openReports > 0 && <button className="btn btn--sm btn--outline" onClick={() => act(p.id, "dismiss")}>Dismiss reports</button>}
                  <span style={{ flex: 1 }} />
                  <button className="ty rust link" style={{ fontSize: 10 }} onClick={() => act(p.id, "delete")}>delete for good</button>
                </div>
              </div>
            </Paper>
          );
        })}
      </div>
    </main>
  );
}
