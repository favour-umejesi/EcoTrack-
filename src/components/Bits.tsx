import type { CSSProperties, ReactNode } from "react";

type PaperProps = { children: ReactNode; tone?: "light" | "dark" | "kraft" | "print"; rot?: number; pin?: boolean; tape?: "tl" | "tr" | "tc" | "both"; className?: string; style?: CSSProperties };
export function Paper({ children, tone = "light", rot = 0, pin, tape, className = "", style }: PaperProps) {
  const toneClass = tone === "light" ? "" : `paper--${tone}`;
  return (
    <div className={`paper ${toneClass} ${className}`} style={{ ...style, "--rot": `${rot}deg` } as CSSProperties}>
      {pin && <span className="pin" />}
      {(tape === "tl" || tape === "both") && <span className="tape tape--tl" />}
      {(tape === "tr" || tape === "both") && <span className="tape tape--tr" />}
      {tape === "tc" && <span className="tape tape--tc" />}
      {children}
    </div>
  );
}

export function Stamp({ children, tone = "rust", rot = 0, sm }: { children: ReactNode; tone?: "rust" | "moss" | "soft"; rot?: number; sm?: boolean }) {
  return <span className={`stamp ${tone === "moss" ? "stamp--moss" : tone === "soft" ? "stamp--soft" : ""} ${sm ? "stamp--sm" : ""}`} style={{ "--rot": `${rot}deg` } as CSSProperties}>{children}</span>;
}

export function Tag({ children, on, rot = 0, paper, onClick }: { children: ReactNode; on?: boolean; rot?: number; paper?: boolean; onClick?: () => void }) {
  const cls = `tag ${on ? "tag--on" : ""} ${paper ? "tag--paper" : ""}`;
  const st = { "--rot": `${rot}deg` } as CSSProperties;
  return onClick ? <button className={cls} style={st} onClick={onClick}>{children}</button> : <span className={cls} style={st}>{children}</span>;
}

export function Sketch({ name, x, y, w, rot = 0, right, bottom, opacity }: { name: string; x?: number; y?: number; w: number; rot?: number; right?: number; bottom?: number; opacity?: number }) {
  return <img className="sketch" src={`/sketch/${name}.png`} alt="" aria-hidden style={{ left: x, top: y, right, bottom, width: w, opacity, "--rot": `${rot}deg` } as CSSProperties} />;
}

export function Section({ numeral, title }: { numeral: string; title: string }) {
  return <div className="sec"><span className="fell">{numeral}</span><span className="kicker">{title}</span></div>;
}

export function Field({ label, value, unit, onChange, type = "number", width, min = 0 }: { label: string; value: string | number; unit?: string; onChange?: (v: string) => void; type?: string; width?: number; min?: number }) {
  return (
    <label className="field" style={{ width }}>
      <span className="ty">{label}</span>
      <span className="blank">
        <input type={type} value={value} min={min} onChange={(e) => onChange?.(e.target.value)} readOnly={!onChange} />
        {unit && <span className="ty">{unit}</span>}
      </span>
    </label>
  );
}

export function Select({ label, value, options, onChange, width }: { label: string; value: string; options: [string, string][]; onChange?: (v: string) => void; width?: number }) {
  return (
    <label className="field" style={{ width }}>
      <span className="ty">{label}</span>
      <span className="blank">
        <select value={value} onChange={(e) => onChange?.(e.target.value)}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <Chevron />
      </span>
    </label>
  );
}

export function Icon({ name, size = 16, color = "currentColor" }: { name: string; size?: number; color?: string }) {
  const P: Record<string, string> = {
    leaf: '<path d="M4 20c0-8 6-14 16-16-1 10-7 16-16 16Z"/><path d="M4 20c4-4 8-8 12-12"/>',
    car: '<path d="M3 13l2-5a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 5"/><rect x="3" y="13" width="18" height="5" rx="1.5"/><circle cx="7" cy="18" r="1.5"/><circle cx="17" cy="18" r="1.5"/>',
    bus: '<rect x="4" y="3" width="16" height="15" rx="3"/><path d="M4 11h16"/><circle cx="8" cy="20" r="1.5"/><circle cx="16" cy="20" r="1.5"/>',
    train: '<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14"/><path d="m8 21 1-3"/><path d="m16 21-1-3"/>',
    bike: '<circle cx="6" cy="17" r="4"/><circle cx="18" cy="17" r="4"/><path d="M6 17 10 7h4l4 10"/><path d="m10 7 4 10"/>',
    walk: '<circle cx="13" cy="4" r="2"/><path d="m8 22 3-8-2-2-1 4"/><path d="m11 14 3 3 1 5"/><path d="M9 12l3-3 3 1 3 4"/>',
    zap: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
    sprout: '<path d="M12 22V10"/><path d="M12 10c0-4 3-6 7-6 0 4-3 6-7 6Z"/><path d="M12 14c0-3-2-5-6-5 0 3 2 5 6 5Z"/>',
    book: '<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4Z"/><path d="M20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7Z"/>',
    check: '<path d="m5 12 5 5L20 7"/>',
    flag: '<path d="M5 21V4h11l-1 4 1 4H5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    pencil: '<path d="M17 3a2.8 2.8 0 1 1 4 4L7 21l-4 1 1-4Z"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z"/>',
    download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M4 21h16"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4Z"/><circle cx="12" cy="13" r="3"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 17-5-5-8 8"/>',
    send: '<path d="M3 11 21 3l-6 18-3-8Z"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    coffee: '<path d="M5 9h11l-1 11H6Z"/><path d="M16 11h3a2 2 0 0 1 0 4h-3"/><path d="M8 9V6a3 3 0 0 1 6 0v3"/>',
    bird: '<path d="M3 17c4 0 7-1 9-4l3-6 2 3h4l-3 2-1 4c-2 3-6 5-10 5"/><path d="M3 21h9"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
    droplet: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden dangerouslySetInnerHTML={{ __html: P[name] ?? "" }} />;
}

export function Chevron() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-soft)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m6 9 6 6 6-6"/></svg>; }
