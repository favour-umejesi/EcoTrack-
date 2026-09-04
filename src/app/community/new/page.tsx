"use client";
import { useState } from "react";
import { Icon, Paper, Sketch, Stamp, Tag } from "@/components/Bits";
import { CATEGORIES } from "@/data/mock";

const START = [{ url: "/images/community-denim.jpg", label: "before" }, { url: "/images/community-tote-flatlay.jpg", label: "after" }];

export default function Compose() {
  const [cat, setCat] = useState("Fashion");
  const [title, setTitle] = useState("Turned a thrifted denim jacket into a tote bag");
  const [story, setStory] = useState("Took one evening and a borrowed sewing machine. The only thing you really need is a seam ripper. Keep the pockets, they make good inside pouches.");
  const [photos, setPhotos] = useState(START);
  const [posted, setPosted] = useState(false);
  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const next = Array.from(files).slice(0, 4 - photos.length).map((f) => ({ url: URL.createObjectURL(f), label: f.name.replace(/\.[^.]+$/, "").slice(0, 14) }));
    setPhotos((p) => [...p, ...next]);
  };
  return (
    <main className="page ruled rel" style={{ minHeight: "calc(100vh - 84px)" }}>
      <div className="cols" style={{ gridTemplateColumns: "minmax(0, 760px) 400px", gap: 56 }}>
        <div className="stack" style={{ gap: 14 }}>
          <div>
            <h1 className="fell rv" style={{ fontSize: 34 }}>Share what you did</h1>
            <p className="bd soft" style={{ margin: "4px 0 0" }}>Something you actually did. A photo of the work makes it far easier to follow.</p>
          </div>
          <span className="ty ty-u" style={{ fontSize: 11 }}>What kind of action</span>
          <div className="row" style={{ gap: 8 }}>{CATEGORIES.filter((c) => c !== "All").map((c, k) => <Tag key={c} on={c === cat} rot={k % 2 ? 1.5 : -1.5} onClick={() => setCat(c)}>{c}</Tag>)}</div>
          <label className="field" style={{ width: 720 }}><span className="ty">What did you do?</span><span className="blank"><input value={title} onChange={(e) => setTitle(e.target.value)} /></span></label>
          <label className="field" style={{ width: 720 }}><span className="ty">How did it go? tips for someone trying it</span><span className="blank"><textarea rows={3} value={story} onChange={(e) => setStory(e.target.value)} /></span></label>
          <span className="ty ty-u" style={{ fontSize: 11 }}>Photos of your work</span>
          <div className="row" style={{ gap: 22, alignItems: "flex-end" }}>
            {photos.map((p, k) => (
              <Paper key={p.url} tone="print" rot={k % 2 ? 2 : -3} tape="tc" style={{ width: 136, padding: "8px 8px 26px" }}>
                <img src={p.url} alt="" style={{ width: 120, height: 120, objectFit: "cover" }} />
                <span className="ty" style={{ position: "absolute", left: 8, bottom: 6, fontSize: 10 }}>{p.label}</span>
                <button aria-label="remove photo" onClick={() => setPhotos((ps) => ps.filter((x) => x !== p))} style={{ position: "absolute", top: 14, right: 12, width: 20, height: 20, borderRadius: "50%", background: "var(--ink)", color: "var(--chalk)", fontSize: 12, lineHeight: "20px", textAlign: "center" }}>×</button>
              </Paper>
            ))}
            {photos.length < 4 && (
              <label className="paper paper--dark" style={{ width: 330, height: 150, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, textAlign: "center", cursor: "pointer", padding: "14px 18px" }}>
                <input type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={(e) => addPhotos(e.target.files)} />
                <Icon name="image" size={24} color="var(--ink-soft)" />
                <span className="ty ty-u" style={{ color: "var(--ink)" }}>Add photos</span>
                <span className="bd soft" style={{ fontSize: 12 }}>Drag them in or browse. Up to 4, JPG or PNG, 10 MB each.</span>
                <span className="bd moss" style={{ fontSize: 11 }}>Location data is removed before anyone sees them.</span>
              </label>
            )}
          </div>
          <p className="row bd" style={{ gap: 10, margin: 0, fontSize: 14, width: 720, flexWrap: "nowrap" }}><Icon name="leaf" size={16} color="var(--moss-deep)" /> Estimated impact: about 12 kg CO₂e avoided. Worked out from the action type; you can leave it or adjust it. <button className="ty rust link" style={{ fontSize: 10 }}>adjust</button></p>
          <div className="row" style={{ gap: 12 }}>
            <button className="btn" onClick={() => setPosted(true)}><Icon name="send" size={16} /> Share with the community</button>
            <button className="btn btn--outline">Save draft</button>
            {posted && <Stamp tone="moss" rot={-4}>Pinned to the board (mock)</Stamp>}
          </div>
        </div>
        <div className="stack" style={{ gap: 24 }}>
          <span className="kicker" style={{ fontSize: 11, letterSpacing: 2 }}>How it will look</span>
          <Paper tone="print" rot={2} pin style={{ padding: 12 }}>
            {photos[0] && <img src={photos[0].url} alt="" style={{ width: 376, height: 230, objectFit: "cover" }} />}
            <div className="stack" style={{ gap: 6, marginTop: 10 }}>
              <div className="row" style={{ gap: 8 }}><Tag>Quiet Fern</Tag><Tag on rot={-2}>{cat}</Tag></div>
              <h2 className="fell" style={{ fontSize: 20 }}>{title || "Untitled action"}</h2>
              <span><Stamp tone="moss" sm>about 12 kg CO₂e avoided</Stamp></span>
            </div>
          </Paper>
          <Paper tone="dark" rot={-1} style={{ padding: "14px 18px" }}>
            <p className="row bd" style={{ margin: 0, gap: 10, fontSize: 13, flexWrap: "nowrap", alignItems: "flex-start" }}><Icon name="shield" size={18} color="var(--moss-deep)" /> New accounts cannot include links for their first week. Photos are reviewed by a person if anyone reports them.</p>
          </Paper>
        </div>
      </div>
      <Sketch name="plane" x={600} bottom={40} w={160} rot={-5} />
      <Sketch name="leaf" right={80} bottom={60} w={90} rot={10} />
    </main>
  );
}
