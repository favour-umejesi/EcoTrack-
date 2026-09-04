import type { Inputs, Category } from "@/lib/engine";

export const DEFAULT_INPUTS: Inputs = {
  country: "gb", mode: "car", fuel: "petrol", commuteKm: 30, electricityKwh: 260, gasQty: 12, gasType: "lpg",
  meatMeals: 5, flights: 2, flightClass: "short", clothingItems: 3, secondhandItems: 1, distanceUnit: "mi", gasUnit: "kg",
};

export const STORAGE_KEY = "ecotrack.inputs";
export function parseInputs(raw: string | null): Inputs {
  try { if (raw) return { ...DEFAULT_INPUTS, ...JSON.parse(raw) }; } catch {}
  return DEFAULT_INPUTS;
}

export type Note = { category: Category; kicker: string; text: string; source: string; action: keyof typeof ACTION_LABELS; where?: string[] };
export const ACTION_LABELS = {
  twoBusDays: "two bus days a week",
  meatFreeDay: "meat-free Mondays",
  thriftTwoOfThree: "thrift two of every three",
  laundryOffPeak: "laundry off-peak",
} as const;

/** Field notes from the Climate Almanac. In the real app these come from retrieval over the curated library; here they are hand-written stand-ins with real sources. */
export const NOTES: Note[] = [
  { category: "commute", kicker: "Commute", text: "Road vehicles make up roughly 70% of transport emissions worldwide, so swapping even two driving days a week for the bus or train is the single largest change available to most commuters.", source: "IPCC AR6 Working Group III, Chapter 10: Transport (2022)", action: "twoBusDays" },
  { category: "food", kicker: "Food", text: "What you eat matters more than where it came from. Beef and lamb emit tens of times more per kilogram than beans and lentils, so one meat-free day a week does more than buying local ever could.", source: "Poore and Nemecek, Science (2018), via Our World in Data", action: "meatFreeDay" },
  { category: "clothing", kicker: "Clothing", text: "A new pair of jeans costs the air about 33 kg CO₂e and a great deal of water; a second-hand pair costs almost nothing. Thrift first, mend second, buy new last.", source: "Levi Strauss & Co. jeans life-cycle assessment (2015); Ellen MacArthur Foundation, A New Textiles Economy (2017)", action: "thriftTwoOfThree", where: ["Vinted", "Depop", "local charity shop"] },
  { category: "electricity", kicker: "Electricity", text: "Grids are cleaning up fast where coal is leaving, so each kilowatt-hour emits less than a decade ago. Using less at the evening peak, when gas plants fill the gap, is still the cheapest cut.", source: "Ember, Electricity Data Explorer (2025)", action: "laundryOffPeak" },
  { category: "flights", kicker: "Flights", text: "One long-haul return flight can outweigh a year of commuting. Where a train exists, it usually emits a tenth as much per passenger for the same journey.", source: "UK Government greenhouse gas conversion factors (2025)", action: "twoBusDays" },
  { category: "gas", kicker: "Cooking gas", text: "Bottled gas burns cleaner than charcoal or kerosene, and an induction hob on a clean grid cleaner still. The bigger lever is usually the meal, not the flame.", source: "IPCC AR6 Working Group III, Chapter 9: Buildings (2022)", action: "meatFreeDay" },
];

export const HISTORY = [
  { month: "Jan", kg: 400 }, { month: "Feb", kg: 390 }, { month: "Mar", kg: 372 }, { month: "Apr", kg: 360 },
  { month: "May", kg: 345 }, { month: "Jun", kg: 330 }, { month: "Jul", kg: 352 }, { month: "Aug", kg: 330 },
];
export const CHANGES = [
  { icon: "zap", name: "Electricity", delta: "−22%", note: "Cooler evenings, fan off", good: true },
  { icon: "car", name: "Commute", delta: "−4%", note: "Two bus days logged", good: true },
  { icon: "sprout", name: "Food", delta: "+6%", note: "A holiday week. No points lost.", good: false },
];
export const POINTS_MONTH = [
  { what: "Logged four weeks in a row", pts: 40 },
  { what: "Adopted “Meat-free Mondays”", pts: 50 },
  { what: "Shared an action with the community", pts: 25 },
];
export const POINTS_LEDGER = [
  { date: "28 Aug", what: "Logged this week", pts: 10 },
  { date: "25 Aug", what: "Adopted “Meat-free Mondays”", pts: 50 },
  { date: "21 Aug", what: "Logged this week", pts: 10 },
  { date: "19 Aug", what: "Shared “Turned a thrifted denim jacket into a tote bag”", pts: 25 },
  { date: "14 Aug", what: "Logged this week", pts: 10 },
];
export const ADOPTED = [["Meat-free Mondays", "since 25 Aug"], ["Two bus days a week", "since 3 Aug"], ["Laundry off-peak", "since 19 Jul"]];
export const STREAK = { weeks: 6, pattern: ["done", "done", "done", "grace", "done", "done", "done", "now"] as const };

export type Post = { id: string; persona: string; character: string; category: string; title: string; body: string; photo: string; caption: string; tutorial?: string; impactKg: number; didIt: number; helpful: number; ago: string };
export const POSTS: Post[] = [
  { id: "p1", persona: "Quiet Fern", character: "fern", category: "Fashion", title: "Turned a thrifted denim jacket into a tote bag", body: "Took one evening and a borrowed sewing machine. The tutorial has six steps with photos, and the only thing you really need is a seam ripper.", photo: "/images/community-tote.jpg", caption: "Quiet Fern, thrifted denim, one evening", tutorial: "Tutorial, 6 steps", impactKg: 12, didIt: 34, helpful: 58, ago: "2 days ago" },
  { id: "p2", persona: "Blue Heron", character: "heron", category: "Transport", title: "Switched two commute days a week to the bus", body: "Costs me fifteen extra minutes each way. I read on the bus, so I stopped missing the time after week two.", photo: "/images/community-bus.jpg", caption: "Blue Heron, the 7:40 into town", impactKg: 480, didIt: 121, helpful: 96, ago: "2 days ago" },
];
export const CATEGORIES = ["All", "Transport", "Food", "Home", "Fashion", "Thrifted", "Garden", "Waste"];
export const CHALLENGE = { title: "One car-free commute", text: "Any day, any distance. Log it and it counts.", joined: 212 };
export const RULES = [
  ["check", "Share things you actually did, not things people should do."],
  ["check", "Be kind. Nobody here has a perfect ledger."],
  ["check", "New accounts cannot post links for their first week."],
  ["flag", "Report anything that looks off. A person reviews every report."],
];
export const CHARACTERS = [["fern", "sprout"], ["kettle", "coffee"], ["heron", "bird"], ["sun", "sun"], ["pebble", "droplet"]];

/** Canned Climate Almanac answers keyed by a word in the question. Stands in for retrieval + generation. */
export const ALMANAC: { match: RegExp; answer: string; sources: string[] }[] = [
  { match: /train|fly|flight|plane|paris|london/i, answer: "Take the train. For London to Paris, rail emits roughly a tenth of the CO₂e per passenger of flying the same route, and the journey time is similar once you count getting to the airport.", sources: ["UK Government greenhouse gas conversion factors (2025), rail and short-haul air", "IEA, Rail (2023)"] },
  { match: /meat|beef|vegan|vegetarian|food|diet/i, answer: "Cutting beef and lamb does the most. Per kilogram they emit tens of times more than beans, lentils or tofu, so one or two meat-free days a week beats almost any change to where your food comes from.", sources: ["Poore and Nemecek, Science (2018), via Our World in Data"] },
  { match: /cloth|jeans|fashion|thrift|second/i, answer: "Buying second-hand is the biggest clothing lever by far. A new pair of jeans is about 33 kg CO₂e before it reaches you; a thrifted pair carries almost none of that. Mend before you replace, and try Vinted, Depop or a charity shop before anything new.", sources: ["Levi Strauss & Co. jeans life-cycle assessment (2015)", "Ellen MacArthur Foundation, A New Textiles Economy (2017)"] },
];
export const ALMANAC_FALLBACK = { answer: "The Almanac could not find a passage in its library that answers this with confidence, so it will not guess. Try asking about travel, food, clothing, or home energy.", sources: [] as string[] };
