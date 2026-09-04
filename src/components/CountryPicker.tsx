"use client";
import { useMemo, useRef, useState } from "react";
import { COUNTRIES, COUNTRY_BY_CODE, type Continent } from "@/data/countries";
import { Icon } from "./Bits";

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** A searchable country field: type a few letters, pick from the matches. Arrow keys, Enter and Escape work; blur restores the chosen name. */
export default function CountryPicker({ value, onChange, width = 260 }: { value: string; onChange: (code: string) => void; width?: number }) {
  const selectedName = COUNTRY_BY_CODE[value]?.name ?? "";
  const [query, setQuery] = useState(selectedName);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = "country-list";
  const shown = open ? query : selectedName;

  /** Best ten matches (names that start with the query first), then grouped by continent for display. */
  const matches = useMemo(() => {
    const q = fold(query.trim());
    if (!q) return [] as { code: string; name: string; continent: Continent; header: Continent | null }[];
    const starts = COUNTRIES.filter((c) => fold(c.name).startsWith(q) || c.code === q);
    const contains = COUNTRIES.filter((c) => !starts.includes(c) && fold(c.name).includes(q));
    const tier = (c: { code: string }) => (starts.some((x) => x.code === c.code) ? 0 : 1);
    const top = [...starts, ...contains].slice(0, 10).sort((a, b) => a.continent.localeCompare(b.continent) || tier(a) - tier(b) || a.name.localeCompare(b.name));
    return top.map((c, k) => ({ ...c, header: k === 0 || top[k - 1].continent !== c.continent ? c.continent : null }));
  }, [query]);

  const choose = (code: string) => { onChange(code); setOpen(false); inputRef.current?.blur(); };

  const onKey = (e: React.KeyboardEvent) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) { setOpen(true); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, matches.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter" && matches[active]) { e.preventDefault(); choose(matches[active].code); }
    else if (e.key === "Escape") { setOpen(false); }
  };

  return (
    <div className="field rel" style={{ width }}>
      <span className="ty">Where you live</span>
      <span className="blank" style={{ gap: 8 }}>
        <Icon name="search" size={15} color="var(--ink-soft)" />
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          value={shown}
          placeholder="type a country"
          onFocus={() => { setQuery(""); setActive(0); setOpen(true); }}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onChange={(e) => { setQuery(e.target.value); setActive(0); setOpen(true); }}
          onKeyDown={onKey}
        />
        <button type="button" aria-label="clear" className="ty" onMouseDown={(e) => { e.preventDefault(); setQuery(""); inputRef.current?.focus(); }} style={{ fontSize: 10 }}>{query && open ? "clear" : ""}</button>
      </span>
      {open && (
        <ul id={listId} role="listbox" className="menu" style={{ width }}>
          {matches.length === 0 && <li className="bd soft" style={{ padding: "6px 10px", fontSize: 14 }}>{query.trim() ? "no country matches that" : "start typing a name"}</li>}
          {matches.map((c, k) => (
            <li key={c.code} role="option" aria-selected={k === active} className={`menu__item ${k === active ? "menu__item--on" : ""}`} onMouseDown={(e) => { e.preventDefault(); choose(c.code); }} onMouseEnter={() => setActive(k)}>
              {c.header && <span className="ty ty-u" style={{ fontSize: 9, letterSpacing: 2, display: "block", marginBottom: 2 }}>{c.header}</span>}
              <Highlight text={c.name} query={query} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  const i = fold(text).indexOf(fold(query.trim()));
  if (i < 0 || !query.trim()) return <>{text}</>;
  return <>{text.slice(0, i)}<span style={{ color: "var(--rust)", fontWeight: 600 }}>{text.slice(i, i + query.trim().length)}</span>{text.slice(i + query.trim().length)}</>;
}
