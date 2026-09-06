"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, Paper, Sketch, Stamp, Tag } from "@/components/Bits";
import { CATEGORIES } from "@/data/mock";
import { createPost } from "@/db/community-actions";
import { downscale } from "@/lib/downscale";
import { LIMITS } from "@/lib/rules";
import { readKey, removeKey, useHydrated, writeKey } from "@/lib/store";

const DRAFT_KEY = "ecotrack.draft";
/** A rough starting estimate per category, in kg CO2e; members can change it. */
const ESTIMATE: Record<string, number> = { Transport: 120, Food: 50, Home: 40, Fashion: 12, Thrifted: 12, Garden: 5, Waste: 5 };
type Draft = { cat: string; title: string; story: string; impact: string };
const blank: Draft = { cat: "Fashion", title: "", story: "", impact: String(ESTIMATE.Fashion) };
const loadDraft = (): Draft => { try { const raw = readKey(DRAFT_KEY); return raw ? { ...blank, ...JSON.parse(raw) } : blank; } catch { return blank; } };

/** Drafts live in the browser, so the form is keyed on hydration like the calculator. */
export default function Compose() {
  const hydrated = useHydrated();
  return <ComposeForm key={hydrated ? "browser" : "server"} />;
}

function ComposeForm() {
  const router = useRouter();
  const [d, setD] = useState<Draft>(loadDraft);
  const set = (patch: Partial<Draft>) => setD((x) => ({ ...x, ...patch }));
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const next = Array.from(files).slice(0, LIMITS.photosPerPost - photos.length).map((file) => ({ file, url: URL.createObjectURL(file) }));
    setPhotos((p) => [...p, ...next]);
  };
  const saveDraft = () => { writeKey(DRAFT_KEY, JSON.stringify(d)); setSaved(true); };
  const share = async () => {
    setBusy(true);
    setError("");
    const form = new FormData();
    form.set("category", d.cat);
    form.set("title", d.title);
    form.set("body", d.story);
    form.set("impactKg", d.impact || "0");
    for (const p of photos) form.append("photos", await downscale(p.file), "photo.jpg");
    const r = await createPost(form);
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    removeKey(DRAFT_KEY);
    router.push("/community");
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
          <div className="row" style={{ gap: 8 }}>{CATEGORIES.filter((c) => c !== "All").map((c, k) => <Tag key={c} on={c === d.cat} rot={k % 2 ? 1.5 : -1.5} onClick={() => set({ cat: c, impact: String(ESTIMATE[c] ?? 0) })}>{c}</Tag>)}</div>
          <label className="field" style={{ width: 720 }}><span className="ty">What did you do?</span><span className="blank"><input value={d.title} onChange={(e) => set({ title: e.target.value })} maxLength={120} placeholder="turned a thrifted denim jacket into a tote bag" /></span></label>
          <label className="field" style={{ width: 720 }}><span className="ty">How did it go? tips for someone trying it</span><span className="blank"><textarea rows={3} value={d.story} onChange={(e) => set({ story: e.target.value })} maxLength={2000} placeholder="what it took, what you would do differently" /></span></label>
          <span className="ty ty-u" style={{ fontSize: 11 }}>Photos of your work</span>
          <div className="row" style={{ gap: 22, alignItems: "flex-end" }}>
            {photos.map((p, k) => (
              <Paper key={p.url} tone="print" rot={k % 2 ? 2 : -3} tape="tc" style={{ width: 136, padding: "8px 8px 26px" }}>
                <img src={p.url} alt="" style={{ width: 120, height: 120, objectFit: "cover" }} />
                <span className="ty" style={{ position: "absolute", left: 8, bottom: 6, fontSize: 10 }}>{p.file.name.replace(/\.[^.]+$/, "").slice(0, 14)}</span>
                <button type="button" aria-label="remove photo" onClick={() => setPhotos((ps) => ps.filter((x) => x !== p))} style={{ position: "absolute", top: 14, right: 12, width: 20, height: 20, borderRadius: "50%", background: "var(--ink)", color: "var(--chalk)", fontSize: 12, lineHeight: "20px", textAlign: "center" }}>×</button>
              </Paper>
            ))}
            {photos.length < LIMITS.photosPerPost && (
              <label className="paper paper--dark" style={{ width: 330, height: 150, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, textAlign: "center", cursor: "pointer", padding: "14px 18px" }}>
                <input type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={(e) => addPhotos(e.target.files)} />
                <Icon name="image" size={24} color="var(--ink-soft)" />
                <span className="ty ty-u" style={{ color: "var(--ink)" }}>Add photos</span>
                <span className="bd soft" style={{ fontSize: 12 }}>Up to {LIMITS.photosPerPost}, JPG, PNG or WebP. They are shrunk before upload.</span>
                <span className="bd moss" style={{ fontSize: 11 }}>Location data is removed before anyone sees them.</span>
              </label>
            )}
          </div>
          <div className="row" style={{ gap: 10, alignItems: "flex-end" }}>
            <label className="field" style={{ width: 200 }}><span className="ty">Estimated impact</span><span className="blank"><input type="number" min={0} value={d.impact} onChange={(e) => set({ impact: e.target.value })} /><span className="ty">kg CO₂e</span></span></label>
            <p className="bd soft" style={{ margin: "0 0 6px", fontSize: 13, maxWidth: 480 }}>A rough figure from the action type. Leave it or adjust it; a year of the habit for big ones, one-off savings for small ones.</p>
          </div>
          {error && <div className="row" style={{ gap: 12, flexWrap: "nowrap", alignItems: "flex-start" }}><Stamp sm rot={-3}>Hold on</Stamp><p className="bd rust" style={{ margin: 0, fontSize: 14 }}>{error}</p></div>}
          <div className="row" style={{ gap: 12 }}>
            <button className="btn" onClick={share} disabled={busy || d.title.trim().length < 5 || d.story.trim().length < 10}><Icon name="send" size={16} /> {busy ? "Pinning it up" : "Share with the community"}</button>
            <button className="btn btn--outline" onClick={saveDraft}>Save draft</button>
            {saved && <Stamp tone="moss" sm rot={-4}>Draft kept in this browser</Stamp>}
          </div>
        </div>
        <div className="stack" style={{ gap: 24 }}>
          <span className="kicker" style={{ fontSize: 11, letterSpacing: 2 }}>How it will look</span>
          <Paper tone="print" rot={2} pin style={{ padding: 12 }}>
            {photos[0] ? <img src={photos[0].url} alt="" style={{ width: 376, height: 230, objectFit: "cover" }} /> : <div className="paper--dark" style={{ width: 376, height: 230, background: "url(/textures/paper-dark3.jpg) center / cover", display: "grid", placeItems: "center" }}><span className="ty">no photo yet</span></div>}
            <div className="stack" style={{ gap: 6, marginTop: 10 }}>
              <div className="row" style={{ gap: 8 }}><Tag>You</Tag><Tag on rot={-2}>{d.cat}</Tag></div>
              <h2 className="fell" style={{ fontSize: 20 }}>{d.title || "Untitled action"}</h2>
              {Number(d.impact) > 0 && <span><Stamp tone="moss" sm>about {Number(d.impact)} kg CO₂e {Number(d.impact) > 100 ? "a year" : "avoided"}</Stamp></span>}
            </div>
          </Paper>
          <Paper tone="dark" rot={-1} style={{ padding: "14px 18px" }}>
            <p className="row bd" style={{ margin: 0, gap: 10, fontSize: 13, flexWrap: "nowrap", alignItems: "flex-start" }}><Icon name="shield" size={18} color="var(--moss-deep)" /> New accounts cannot include links for their first week. Photos are reviewed by a person if anyone reports them. Up to {LIMITS.postsPerDay} posts a day.</p>
          </Paper>
        </div>
      </div>
      <Sketch name="plane" x={600} bottom={40} w={160} rot={-5} />
      <Sketch name="leaf" right={80} bottom={60} w={90} rot={10} />
    </main>
  );
}
