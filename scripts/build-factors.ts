/**
 * build-factors.ts — downloads two public datasets and writes two generated TypeScript modules.
 *
 *   Ember, "Yearly Electricity Data" (CC BY 4.0)                 -> src/data/grid.generated.ts
 *   Our World in Data, "CO2 and Greenhouse Gas Emissions" (CC BY) -> src/data/averages.generated.ts
 *
 * Run from anywhere:
 *   npx tsx scripts/build-factors.ts
 *   node --experimental-strip-types scripts/build-factors.ts
 *
 * Plain Node 22 APIs only (fetch, fs, path). No third-party dependencies.
 * Hand-transcribed factors live in src/data/factors.ts and are NOT touched by this script.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

type Continent = "Africa" | "Asia" | "Europe" | "North America" | "South America" | "Oceania";
const CONTINENTS: Continent[] = ["Africa", "Asia", "Europe", "North America", "South America", "Oceania"];

const ROOT = resolve(dirname(process.argv[1] ?? "."), "..");
const OUT_DIR = resolve(ROOT, "src", "data");

// Ember links these two files from https://ember-energy.org/data/yearly-electricity-data/ ("Yearly electricity data – Global (CSV)").
// The long-format file is Ember's older layout of the same dataset; it is used only if the primary download fails.
const EMBER = {
  name: "Ember, Yearly Electricity Data (release_generation_yearly_global.csv)",
  page: "https://ember-energy.org/data/yearly-electricity-data/",
  url: "https://files.ember-energy.org/public-downloads/generation/outputs/release_generation_yearly_global.csv",
  fallbackUrl: "https://storage.googleapis.com/emb-prod-bkt-publicdata/public-downloads/yearly_full_release_long_format.csv",
  licence: "CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)",
};
const OWID = {
  name: "Our World in Data, CO2 and Greenhouse Gas Emissions dataset (owid-co2-data.csv)",
  page: "https://github.com/owid/co2-data",
  url: "https://owid-public.owid.io/data/co2/owid-co2-data.csv",
  codebook: "https://owid-public.owid.io/data/co2/owid-co2-codebook.csv",
  licence: "CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/); underlying CO2 data from the Global Carbon Budget",
};

/**
 * ISO 3166-1 alpha-3 -> alpha-2, grouped by the same six continents the app uses (src/data/countries.ts).
 * Countries in the app's list come first in each group; a few dependent territories that appear in the
 * datasets follow, so they get a grid figure too. Kosovo: Ember uses XKX, OWID uses OWID_KOS (aliased below).
 */
const ISO_TABLE: Record<Continent, string> = {
  Africa: "DZA dz|AGO ao|BEN bj|BWA bw|BFA bf|BDI bi|CPV cv|CMR cm|CAF cf|TCD td|COM km|COG cg|COD cd|CIV ci|DJI dj|EGY eg|GNQ gq|ERI er|SWZ sz|ETH et|GAB ga|GMB gm|GHA gh|GIN gn|GNB gw|KEN ke|LSO ls|LBR lr|LBY ly|MDG mg|MWI mw|MLI ml|MRT mr|MUS mu|MAR ma|MOZ mz|NAM na|NER ne|NGA ng|RWA rw|STP st|SEN sn|SYC sc|SLE sl|SOM so|ZAF za|SSD ss|SDN sd|TZA tz|TGO tg|TUN tn|UGA ug|ZMB zm|ZWE zw|REU re|MYT yt|ESH eh|SHN sh",
  Asia: "AFG af|ARM am|AZE az|BHR bh|BGD bd|BTN bt|BRN bn|KHM kh|CHN cn|CYP cy|GEO ge|IND in|IDN id|IRN ir|IRQ iq|ISR il|JPN jp|JOR jo|KAZ kz|KWT kw|KGZ kg|LAO la|LBN lb|MYS my|MDV mv|MNG mn|MMR mm|NPL np|PRK kp|OMN om|PAK pk|PSE ps|PHL ph|QAT qa|SAU sa|SGP sg|KOR kr|LKA lk|SYR sy|TWN tw|TJK tj|THA th|TLS tl|TUR tr|TKM tm|ARE ae|UZB uz|VNM vn|YEM ye|HKG hk|MAC mo",
  Europe: "ALB al|AND ad|AUT at|BLR by|BEL be|BIH ba|BGR bg|HRV hr|CZE cz|DNK dk|EST ee|FIN fi|FRA fr|DEU de|GRC gr|HUN hu|ISL is|IRL ie|ITA it|XKX xk|LVA lv|LIE li|LTU lt|LUX lu|MLT mt|MDA md|MCO mc|MNE me|NLD nl|MKD mk|NOR no|POL pl|PRT pt|ROU ro|RUS ru|SMR sm|SRB rs|SVK sk|SVN si|ESP es|SWE se|CHE ch|UKR ua|GBR gb|VAT va|FRO fo|GIB gi|IMN im|JEY je|GGY gg|ALA ax|SJM sj",
  "North America": "ATG ag|BHS bs|BRB bb|BLZ bz|CAN ca|CRI cr|CUB cu|DMA dm|DOM do|SLV sv|GRD gd|GTM gt|HTI ht|HND hn|JAM jm|MEX mx|NIC ni|PAN pa|KNA kn|LCA lc|VCT vc|TTO tt|USA us|PRI pr|GRL gl|BMU bm|CYM ky|ABW aw|CUW cw|SXM sx|VIR vi|VGB vg|AIA ai|MSR ms|TCA tc|GLP gp|MTQ mq|BLM bl|MAF mf|SPM pm|BES bq",
  "South America": "ARG ar|BOL bo|BRA br|CHL cl|COL co|ECU ec|GUY gy|PRY py|PER pe|SUR sr|URY uy|VEN ve|GUF gf|FLK fk",
  Oceania: "AUS au|FJI fj|KIR ki|MHL mh|FSM fm|NRU nr|NZL nz|PLW pw|PNG pg|WSM ws|SLB sb|TON to|TUV tv|VUT vu|NCL nc|PYF pf|GUM gu|ASM as|COK ck|NIU nu|WLF wf|MNP mp|TKL tk|NFK nf",
};
const ISO3: Record<string, { a2: string; continent: Continent }> = {};
for (const continent of CONTINENTS) {
  for (const entry of ISO_TABLE[continent].split("|")) {
    const [a3, a2] = entry.split(" ");
    ISO3[a3] = { a2, continent };
  }
}
ISO3.OWID_KOS = ISO3.XKX;

// ---------------------------------------------------------------- helpers

function localDate(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

async function download(url: string): Promise<{ text: string; lastModified: string | null }> {
  process.stderr.write(`Downloading ${url}\n`);
  const res = await fetch(url, { headers: { "user-agent": "EcoTrack build-factors script (Node fetch)", accept: "text/csv, */*" }, redirect: "follow" });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status} ${res.statusText}`);
  const text = (await res.text()).replace(/^\uFEFF/, "");
  process.stderr.write(`  ${(text.length / 1e6).toFixed(1)} MB\n`);
  return { text, lastModified: res.headers.get("last-modified") };
}

/** Minimal RFC 4180 parser: handles quoted fields, doubled quotes, CRLF. Returns rows of strings. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let i = 0;
  const n = text.length;
  while (i < n) {
    let field: string;
    if (text[i] === '"') {
      let s = "";
      i++;
      for (;;) {
        const q = text.indexOf('"', i);
        if (q < 0) { s += text.slice(i); i = n; break; }
        s += text.slice(i, q);
        if (text[q + 1] === '"') { s += '"'; i = q + 2; continue; }
        i = q + 1;
        break;
      }
      field = s;
    } else {
      let e = i;
      while (e < n && text[e] !== "," && text[e] !== "\n" && text[e] !== "\r") e++;
      field = text.slice(i, e);
      i = e;
    }
    row.push(field);
    if (i >= n) break;
    const c = text[i];
    if (c === ",") { i++; continue; }
    if (c === "\r") i++;
    if (text[i] === "\n") i++;
    rows.push(row);
    row = [];
  }
  if (row.length) rows.push(row);
  return rows;
}

function columnIndex(header: string[], name: string, what: string): number {
  const i = header.findIndex((h) => h.trim() === name);
  if (i < 0) throw new Error(`${what}: column "${name}" not found. Header was: ${header.join(" | ")}`);
  return i;
}

const round = (x: number, dp: number) => Math.round(x * 10 ** dp) / 10 ** dp;

function sortedRecord<T>(m: Map<string, T>): [string, T][] {
  return [...m.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
}

/** Warn if this file's continent grouping drifts from src/data/countries.ts (parsed as text; never fatal). */
function checkAgainstCountriesTs(): void {
  let src: string;
  try { src = readFileSync(resolve(OUT_DIR, "countries.ts"), "utf8"); } catch { return; }
  const a2ToContinent = new Map<string, Continent>();
  for (const [, cont, list] of src.matchAll(/^\s*"?(Africa|Asia|Europe|North America|South America|Oceania)"?:\s*"([^"]+)"/gm)) {
    for (const e of list.split("|")) a2ToContinent.set(e.slice(0, 2), cont as Continent);
  }
  if (a2ToContinent.size === 0) return;
  const mine = new Map(Object.values(ISO3).map((v) => [v.a2, v.continent]));
  for (const [a2, cont] of a2ToContinent) {
    if (!mine.has(a2)) process.stderr.write(`warning: countries.ts has "${a2}" but the ISO map in this script does not\n`);
    else if (mine.get(a2) !== cont) process.stderr.write(`warning: continent mismatch for "${a2}": countries.ts=${cont}, script=${mine.get(a2)}\n`);
  }
}

// ---------------------------------------------------------------- Ember

type GridRow = { g: number; year: number; twh: number; emberContinent: string };

/** Current Ember layout: one row per area, year and electricity source; overall intensity sits on the "Total generation" row. */
function parseEmberWide(rows: string[][]): { byIso: Map<string, GridRow>; world: { g: number; year: number } | null } {
  const h = rows[0];
  const iIso = columnIndex(h, "ISO 3 code", "Ember");
  const iArea = columnIndex(h, "Area", "Ember");
  const iYear = columnIndex(h, "Year", "Ember");
  const iType = columnIndex(h, "Area type", "Ember");
  const iSource = columnIndex(h, "Electricity source", "Ember");
  const iGen = columnIndex(h, "Generation (TWh)", "Ember");
  const iCont = h.findIndex((x) => x.trim() === "Continent");
  const iInt = h.findIndex((x) => /intensity/i.test(x));
  if (iInt < 0) throw new Error(`Ember: no "intensity" column. Header was: ${h.join(" | ")}`);
  process.stderr.write(`  Ember intensity column: "${h[iInt]}"\n`);
  const byIso = new Map<string, GridRow>();
  let world: { g: number; year: number } | null = null;
  for (const r of rows.slice(1)) {
    if (r[iSource] !== "Total generation" || r[iInt] === "" || r[iInt] === undefined) continue;
    const year = Number(r[iYear]);
    const g = Number(r[iInt]);
    if (!Number.isFinite(g) || !Number.isFinite(year)) continue;
    if (r[iArea] === "World") { if (!world || year > world.year) world = { g, year }; continue; }
    if (r[iType] !== "Country or economy" || !r[iIso]) continue;
    const prev = byIso.get(r[iIso]);
    if (!prev || year > prev.year) byIso.set(r[iIso], { g, year, twh: Number(r[iGen]) || 0, emberContinent: iCont >= 0 ? r[iCont] : "" });
  }
  return { byIso, world };
}

/** Older Ember long layout: Category / Subcategory / Variable / Unit / Value rows. */
function parseEmberLong(rows: string[][]): { byIso: Map<string, GridRow>; world: { g: number; year: number } | null } {
  const h = rows[0];
  const iIso = columnIndex(h, "ISO 3 code", "Ember (long)");
  const iArea = columnIndex(h, "Area", "Ember (long)");
  const iYear = columnIndex(h, "Year", "Ember (long)");
  const iType = columnIndex(h, "Area type", "Ember (long)");
  const iVar = columnIndex(h, "Variable", "Ember (long)");
  const iUnit = columnIndex(h, "Unit", "Ember (long)");
  const iVal = columnIndex(h, "Value", "Ember (long)");
  const iCont = h.findIndex((x) => x.trim() === "Continent");
  const intensity = new Map<string, { g: number; year: number; cont: string }>();
  const generation = new Map<string, number>(); // key iso|year -> TWh
  let world: { g: number; year: number } | null = null;
  for (const r of rows.slice(1)) {
    const year = Number(r[iYear]);
    const v = Number(r[iVal]);
    if (!Number.isFinite(v) || !Number.isFinite(year)) continue;
    const variable = r[iVar];
    if (/intensity/i.test(variable)) {
      if (r[iArea] === "World") { if (!world || year > world.year) world = { g: v, year }; continue; }
      if (r[iType] !== "Country or economy" || !r[iIso]) continue;
      const prev = intensity.get(r[iIso]);
      if (!prev || year > prev.year) intensity.set(r[iIso], { g: v, year, cont: iCont >= 0 ? r[iCont] : "" });
    } else if (/^total generation$/i.test(variable) && /twh/i.test(r[iUnit]) && r[iIso]) {
      generation.set(`${r[iIso]}|${year}`, v);
    }
  }
  const byIso = new Map<string, GridRow>();
  for (const [iso, x] of intensity) byIso.set(iso, { g: x.g, year: x.year, twh: generation.get(`${iso}|${x.year}`) ?? 0, emberContinent: x.cont });
  return { byIso, world };
}

async function buildGrid(accessed: string): Promise<void> {
  let parsed: ReturnType<typeof parseEmberWide>;
  let used = EMBER.url;
  let lastModified: string | null = null;
  try {
    const dl = await download(EMBER.url);
    lastModified = dl.lastModified;
    parsed = parseEmberWide(parseCsv(dl.text));
  } catch (err) {
    process.stderr.write(`Primary Ember download failed (${(err as Error).message}); trying the long-format file.\n`);
    used = EMBER.fallbackUrl;
    const dl = await download(EMBER.fallbackUrl);
    lastModified = dl.lastModified;
    parsed = parseEmberLong(parseCsv(dl.text));
  }
  const { byIso, world } = parsed;

  const grid = new Map<string, { g: number; year: number }>();
  const weights: Record<Continent, { gw: number; w: number; n: number }> = Object.fromEntries(CONTINENTS.map((c) => [c, { gw: 0, w: 0, n: 0 }])) as never;
  const unmapped: string[] = [];
  for (const [iso, row] of byIso) {
    const m = ISO3[iso];
    if (!m) { unmapped.push(iso); continue; }
    grid.set(m.a2, { g: round(row.g, 1), year: row.year });
    if (row.emberContinent && row.emberContinent !== m.continent) process.stderr.write(`note: Ember files ${iso} under "${row.emberContinent}", the app uses "${m.continent}"\n`);
    if (row.twh > 0) { const w = weights[m.continent]; w.gw += row.g * row.twh; w.w += row.twh; w.n += 1; }
  }
  if (unmapped.length) process.stderr.write(`Ember codes without an alpha-2 mapping (skipped): ${unmapped.join(", ")}\n`);
  const continent = Object.fromEntries(CONTINENTS.map((c) => {
    const w = weights[c];
    if (w.w === 0) throw new Error(`Ember: no generation data for continent ${c}`);
    return [c, round(w.gw / w.w, 1)];
  })) as Record<Continent, number>;

  // Plausibility checks — fail loudly rather than ship nonsense.
  const fr = grid.get("fr")?.g, pl = grid.get("pl")?.g, ind = grid.get("in")?.g;
  if (fr === undefined || fr >= 100) throw new Error(`Ember sanity check failed: France ${fr} gCO2/kWh (expected well under 100)`);
  if (pl === undefined || pl < 300) throw new Error(`Ember sanity check failed: Poland ${pl} gCO2/kWh (expected several hundred)`);
  if (ind === undefined || ind < 300) throw new Error(`Ember sanity check failed: India ${ind} gCO2/kWh`);
  if (grid.size < 150) throw new Error(`Ember sanity check failed: only ${grid.size} countries mapped`);

  const lines: string[] = [];
  lines.push(`// GENERATED by scripts/build-factors.ts on ${accessed}. Do not edit by hand; re-run the script instead.`);
  lines.push(`// Source: ${EMBER.name}. Licence: ${EMBER.licence}.`);
  lines.push(`// Country values are the latest year available for each country (years differ: see each entry).`);
  lines.push(`// GRID_CONTINENT is the GENERATION-WEIGHTED mean of the countries in each continent (weights = that country's`);
  lines.push(`// total generation in TWh for its latest year), using the app's own continent grouping from src/data/countries.ts.`);
  lines.push(`export const GRID_SOURCE = {`);
  lines.push(`  name: ${JSON.stringify(EMBER.name)},`);
  lines.push(`  page: ${JSON.stringify(EMBER.page)},`);
  lines.push(`  url: ${JSON.stringify(used)},`);
  lines.push(`  licence: ${JSON.stringify(EMBER.licence)},`);
  lines.push(`  accessed: ${JSON.stringify(accessed)},`);
  lines.push(`  fileLastModified: ${JSON.stringify(lastModified ?? "unknown")},`);
  lines.push(`  unit: "g CO2e per kWh of generation (Ember labels the column \\"Emissions intensity (gCO2e/kWh)\\")",`);
  lines.push(`  countries: ${grid.size},`);
  lines.push(`} as const;`);
  lines.push(``);
  lines.push(`/** Grid carbon intensity by lowercase ISO 3166-1 alpha-2 code: g CO2e per kWh, and the data year. */`);
  lines.push(`export const GRID: Record<string, { g: number; year: number }> = {`);
  for (const [k, v] of sortedRecord(grid)) lines.push(`  ${k}: { g: ${v.g}, year: ${v.year} },`);
  lines.push(`};`);
  lines.push(``);
  lines.push(`/** Generation-weighted continent means, g CO2e per kWh. */`);
  lines.push(`export const GRID_CONTINENT: Record<"Africa" | "Asia" | "Europe" | "North America" | "South America" | "Oceania", number> = {`);
  for (const c of CONTINENTS) lines.push(`  ${JSON.stringify(c)}: ${continent[c]},`);
  lines.push(`};`);
  lines.push(``);
  lines.push(`/** Ember's own "World" aggregate for its latest year, g CO2e per kWh. */`);
  lines.push(`export const GRID_WORLD: { g: number; year: number } ${world ? `= { g: ${round(world.g, 1)}, year: ${world.year} }` : `| null = null`};`);
  lines.push(``);
  writeFileSync(resolve(OUT_DIR, "grid.generated.ts"), lines.join("\n"));
  process.stderr.write(`Wrote src/data/grid.generated.ts: ${grid.size} countries; fr=${fr} pl=${pl} in=${ind}; continents=${JSON.stringify(continent)}\n`);
}

// ---------------------------------------------------------------- Our World in Data

async function buildAverages(accessed: string): Promise<void> {
  const dl = await download(OWID.url);
  const rows = parseCsv(dl.text);
  const h = rows[0];
  const iIso = columnIndex(h, "iso_code", "OWID");
  const iYear = columnIndex(h, "year", "OWID");
  const iPc = columnIndex(h, "co2_per_capita", "OWID");
  const iPop = columnIndex(h, "population", "OWID");
  const iCountry = columnIndex(h, "country", "OWID");

  const latest = new Map<string, { t: number; year: number; pop: number }>();
  let world: { t: number; year: number } | null = null;
  const unmapped = new Set<string>();
  for (const r of rows.slice(1)) {
    const iso = r[iIso];
    if (r[iPc] === "" || r[iPc] === undefined) continue;
    const year = Number(r[iYear]);
    const t = Number(r[iPc]);
    if (!Number.isFinite(t) || !Number.isFinite(year)) continue;
    // OWID's aggregate rows (World, continents, income groups) carry no iso_code; only World is kept.
    if (r[iCountry] === "World" || iso === "OWID_WRL") { if (!world || year > world.year) world = { t, year }; continue; }
    if (!iso) continue;
    const m = ISO3[iso];
    if (!m) { if (!iso.startsWith("OWID_")) unmapped.add(iso); continue; }
    const prev = latest.get(m.a2);
    if (!prev || year > prev.year) latest.set(m.a2, { t, year, pop: Number(r[iPop]) || 0 });
  }
  if (unmapped.size) process.stderr.write(`OWID codes without an alpha-2 mapping (skipped): ${[...unmapped].join(", ")}\n`);

  const perCapita = new Map<string, { t: number; year: number }>();
  const weights: Record<Continent, { tp: number; p: number }> = Object.fromEntries(CONTINENTS.map((c) => [c, { tp: 0, p: 0 }])) as never;
  const a2ToContinent = new Map(Object.values(ISO3).map((v) => [v.a2, v.continent]));
  for (const [a2, v] of latest) {
    perCapita.set(a2, { t: round(v.t, 3), year: v.year });
    if (v.pop > 0) { const w = weights[a2ToContinent.get(a2)!]; w.tp += v.t * v.pop; w.p += v.pop; }
  }
  const continent = Object.fromEntries(CONTINENTS.map((c) => {
    const w = weights[c];
    if (w.p === 0) throw new Error(`OWID: no population data for continent ${c}`);
    return [c, round(w.tp / w.p, 2)];
  })) as Record<Continent, number>;

  const us = perCapita.get("us")?.t, ind = perCapita.get("in")?.t, gb = perCapita.get("gb")?.t;
  if (us === undefined || us < 10 || us > 20) throw new Error(`OWID sanity check failed: US ${us} t/person (expected roughly 14)`);
  if (ind === undefined || ind >= 3) throw new Error(`OWID sanity check failed: India ${ind} t/person (expected under 3)`);
  if (gb === undefined || gb < 3 || gb > 8) throw new Error(`OWID sanity check failed: UK ${gb} t/person`);
  if (perCapita.size < 150) throw new Error(`OWID sanity check failed: only ${perCapita.size} countries mapped`);

  const lines: string[] = [];
  lines.push(`// GENERATED by scripts/build-factors.ts on ${accessed}. Do not edit by hand; re-run the script instead.`);
  lines.push(`// Source: ${OWID.name}. Licence: ${OWID.licence}.`);
  lines.push(`// co2_per_capita = fossil-fuel and industry CO2 (excluding land-use change), tonnes per person, per the OWID codebook.`);
  lines.push(`// Country values are the latest year available for each country. PER_CAPITA_CONTINENT is POPULATION-WEIGHTED`);
  lines.push(`// (sum of co2_per_capita x population over the countries in each continent, divided by the summed population,`);
  lines.push(`// each at its latest year), using the app's continent grouping from src/data/countries.ts.`);
  lines.push(`export const PER_CAPITA_SOURCE = {`);
  lines.push(`  name: ${JSON.stringify(OWID.name)},`);
  lines.push(`  page: ${JSON.stringify(OWID.page)},`);
  lines.push(`  url: ${JSON.stringify(OWID.url)},`);
  lines.push(`  codebook: ${JSON.stringify(OWID.codebook)},`);
  lines.push(`  licence: ${JSON.stringify(OWID.licence)},`);
  lines.push(`  accessed: ${JSON.stringify(accessed)},`);
  lines.push(`  fileLastModified: ${JSON.stringify(dl.lastModified ?? "unknown")},`);
  lines.push(`  unit: "tonnes CO2 per person per year (fossil fuels and industry; excludes land-use change)",`);
  lines.push(`  countries: ${perCapita.size},`);
  lines.push(`} as const;`);
  lines.push(``);
  lines.push(`/** CO2 per person by lowercase ISO 3166-1 alpha-2 code: tonnes per year, and the data year. */`);
  lines.push(`export const PER_CAPITA: Record<string, { t: number; year: number }> = {`);
  for (const [k, v] of sortedRecord(perCapita)) lines.push(`  ${k}: { t: ${v.t}, year: ${v.year} },`);
  lines.push(`};`);
  lines.push(``);
  lines.push(`/** Population-weighted continent means, tonnes CO2 per person per year. */`);
  lines.push(`export const PER_CAPITA_CONTINENT: Record<"Africa" | "Asia" | "Europe" | "North America" | "South America" | "Oceania", number> = {`);
  for (const c of CONTINENTS) lines.push(`  ${JSON.stringify(c)}: ${continent[c]},`);
  lines.push(`};`);
  lines.push(``);
  lines.push(`/** OWID's own "World" row for its latest year, tonnes CO2 per person. */`);
  lines.push(`export const PER_CAPITA_WORLD: { t: number; year: number } ${world ? `= { t: ${round(world.t, 3)}, year: ${world.year} }` : `| null = null`};`);
  lines.push(``);
  writeFileSync(resolve(OUT_DIR, "averages.generated.ts"), lines.join("\n"));
  process.stderr.write(`Wrote src/data/averages.generated.ts: ${perCapita.size} countries; us=${us} in=${ind} gb=${gb}; continents=${JSON.stringify(continent)}\n`);
}

// ---------------------------------------------------------------- main

async function main(): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true });
  checkAgainstCountriesTs();
  const accessed = localDate();
  await buildGrid(accessed);
  await buildAverages(accessed);
  process.stderr.write("Done.\n");
}

main().catch((err) => {
  process.stderr.write(`build-factors failed: ${err instanceof Error ? err.stack ?? err.message : String(err)}\n`);
  process.exit(1);
});
