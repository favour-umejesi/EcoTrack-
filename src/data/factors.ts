/**
 * Hand-transcribed emission factors, each with its citation.
 *
 * Every number here was copied from the cited document on 2026-09-05 (see docs/factors.md for the source list,
 * licences and a row-by-row table). Where a value could not be found in a primary source it is `null` and the
 * note says why. Values marked "derived" in their note are arithmetic on cited numbers with the assumption stated.
 *
 * Country grid intensities and per-capita averages are NOT here: they are generated from Ember and Our World in
 * Data by scripts/build-factors.ts into grid.generated.ts and averages.generated.ts.
 */
export type Cited = { value: number | null; unit: string; source: string; url: string; table?: string; year: number; note?: string };
export const FACTOR_VERSION = "2025.1";

// ---- shared citation fragments -------------------------------------------------------------------------------

const DESNZ = "UK Department for Energy Security and Net Zero (DESNZ), Greenhouse gas reporting: conversion factors 2025 (published 10 June 2025), flat file, column 'GHG Conversion Factor 2025', GHG/Unit 'kg CO2e'";
const DESNZ_URL = "https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2025";
const DESNZ_FULL = "UK Department for Energy Security and Net Zero (DESNZ), Greenhouse gas reporting: conversion factors 2025, full set (for advanced users)";
const DESNZ_METHOD = "DESNZ, 2025 Government greenhouse gas conversion factors for company reporting: Methodology paper (June 2025)";
const DESNZ_METHOD_URL = "https://assets.publishing.service.gov.uk/media/6846b0870392ed9b784c0187/2025-GHG-CF-methodology-paper.pdf";
const SCARBOROUGH = "Scarborough P., Clark M., Cobiac L. et al. (2023) Vegans, vegetarians, fish-eaters and meat-eaters in the UK show discrepant environmental impacts. Nature Food 4, 565-574. doi:10.1038/s43016-023-00795-w (CC BY 4.0)";
const SCARBOROUGH_URL = "https://doi.org/10.1038/s43016-023-00795-w";
const LEVIS = "Levi Strauss & Co. (2015) The Life Cycle of a Jean: understanding the environmental impact of a pair of Levi's 501 jeans (ISO 14040/14044 LCA, panel reviewed)";
const LEVIS_URL = "https://www.levistrauss.com/wp-content/uploads/2015/03/Full-LCA-Results-Deck-FINAL.pdf";
const EMBER_CSV = "https://files.ember-energy.org/public-downloads/generation/outputs/release_generation_yearly_global.csv";

const CAR_UNIT = "kg CO2e per vehicle-km";
const CAR_NOTE = "Scope 1 (tailpipe) CO2e only: DESNZ's upstream well-to-tank factors are a separate table and are not included. Size bands are DESNZ's engine-size bands (see docs/factors.md). Per vehicle, not per passenger: divide by occupancy if the car is shared.";
const car = (value: number, size: string, fuel: string, id: string): Cited => ({
  value, unit: CAR_UNIT, source: DESNZ, url: DESNZ_URL, year: 2025,
  table: `Passenger vehicles > Cars (by size) > ${size} > ${fuel} > km (flat-file ID ${id})`, note: CAR_NOTE,
});

const FLIGHT_UNIT = "kg CO2e per passenger-km, including DESNZ's 1.7 radiative-forcing multiplier on the CO2 component";
const FLIGHT_NOTE = "'With RF' rows. DESNZ applies a 1.7 multiplier to CO2 only (methodology paper paras 8.43-8.44, central estimate after Lee et al. 2021) to stand in for contrails, NOx and other non-CO2 effects; it calls the value 'subject to significant uncertainty'. Factors are built from 2023 UK CAA statistics for flights to/from the UK and include an 8% great-circle distance uplift. For flights between two non-UK countries DESNZ also publishes 'International, to/from non-UK' rows (with RF: economy 0.10916, premium economy 0.17465, business 0.31656), which are a blend of short and long haul.";
const flight = (value: number | null, haul: string, cls: string, id: string | null, extra?: string): Cited => ({
  value, unit: FLIGHT_UNIT, source: DESNZ, url: DESNZ_URL, year: 2025,
  table: id ? `Business travel- air > Flights > ${haul} > ${cls} > With RF > passenger.km (flat-file ID ${id})` : `Business travel- air > Flights > ${haul}: no '${cls}' row published`,
  note: extra ? `${extra} ${FLIGHT_NOTE}` : FLIGHT_NOTE,
});
const MEDIUM_NOTE = "Same DESNZ row as `short`: DESNZ has no medium band. It splits flights into Domestic (within the UK, CAA average sector 434 km), Short-haul (UK to Europe/North Africa, roughly up to 3,700 km, CAA average 1,484 km) and Long-haul (beyond, CAA average 6,799 km). The app's 3-6 h band (roughly 2,000-4,500 km) straddles the 3,700 km boundary; short-haul is used because most flights in the band fall inside it, and the long-haul economy factor (0.11704) differs by only about 7%.";
const SHORT_PREMIUM_NOTE = "DESNZ publishes premium-economy factors only for long-haul and 'International, to/from non-UK' flights; there is no short-haul premium-economy row (short-haul has Average passenger 0.12786, Economy 0.12576, Business 0.18863). The engine must fall back explicitly, e.g. to economy.";
const SHORT_NOTE = "The app's 'short' band (under 3 h) is mapped to DESNZ 'Short-haul, to/from UK', not 'Domestic, to/from UK': a sub-3-hour flight is up to roughly 2,000 km, inside DESNZ's short-haul definition, whereas DESNZ's domestic factor (Average passenger, with RF: 0.22928 kg CO2e per passenger-km) describes UK-internal hops averaging 434 km and would overstate a 1,000 km flight by about 80%. Use the domestic figure only for such short hops.";

const DIET_UNIT = "kg CO2e per person per day (GWP100, diet standardised to 2,000 kcal per day)";
const DIET_NOTE = "Table 3 reports medians with 2.5th-97.5th percentiles (in brackets in `table`) from a 1,000-iteration Monte Carlo over each group's mean footprint; the paper gives no separate arithmetic mean. Cohort: 55,504 UK adults (EPIC-Oxford); food-level footprints from Poore & Nemecek (2018), so the numbers describe UK diets and global-average food production. Whole diet, not just meat, so use as an absolute per-day figure rather than adding it to other food inputs.";
const diet = (value: number, group: string, cells: string, extra?: string): Cited => ({
  value, unit: DIET_UNIT, source: SCARBOROUGH, url: SCARBOROUGH_URL, year: 2023,
  table: `Table 3 'Dietary GHG emissions by diet group aggregated using the GWP100, GTP100 and GWP20, standardized to 2,000 kcal and by age and gender', row '${group}', column 'GWP100 CO2e (kg d-1)': ${cells}`,
  note: extra ? `${extra} ${DIET_NOTE}` : DIET_NOTE,
});

// ---- the factor set --------------------------------------------------------------------------------------------

export const FACTORS = {
  // Cars: kg CO2e per vehicle-km, DESNZ 2025 "Passenger vehicles" > "Cars (by size)". Hybrid added because DESNZ publishes it.
  car: {
    small: { petrol: car(0.14308, "Small car", "Petrol", "4_301_3046_4_1"), diesel: car(0.1434, "Small car", "Diesel", "4_301_3045_4_1"), hybrid: car(0.11413, "Small car", "Hybrid", "4_301_3047_4_1") },
    medium: { petrol: car(0.17474, "Medium car", "Petrol", "4_301_3054_4_1"), diesel: car(0.17174, "Medium car", "Diesel", "4_301_3053_4_1"), hybrid: car(0.11724, "Medium car", "Hybrid", "4_301_3055_4_1") },
    large: { petrol: car(0.26828, "Large car", "Petrol", "4_301_3062_4_1"), diesel: car(0.21007, "Large car", "Diesel", "4_301_3061_4_1"), hybrid: car(0.1565, "Large car", "Hybrid", "4_301_3063_4_1") },
  },

  // Battery-electric car: electricity drawn per km, so the app multiplies by the user's own grid factor.
  carElectricKwhPerKm: {
    value: 0.20656, unit: "kWh per km", source: DESNZ_FULL, url: DESNZ_URL, year: 2025,
    table: "Sheet 'SECR kWh UK electricity for EVs' > Cars (by size) > Average car > Battery Electric Vehicle > km > 'kWh (net)'",
    note: "UK fleet-average electricity consumption per km for BEV cars (WLTP-based with a real-world uplift, per methodology paper section 5). DESNZ derives it by dividing its kg CO2e per km EV factor by the UK electricity factor; the sheet states these kWh figures exclude transmission and distribution losses, so a grid factor that includes T&D losses will slightly overstate. By size: small 0.18852, medium 0.19814, large 0.21449 kWh per km. Only the average is used because the app has a single 'electric' option.",
  } as Cited,

  bus: {
    value: 0.10385, unit: "kg CO2e per passenger-km", source: DESNZ, url: DESNZ_URL, year: 2025,
    table: "Business travel- land > Bus > Average local bus > passenger.km (flat-file ID 25_314_3145_11_1)",
    note: "UK average local bus, Scope 3 direct emissions (no well-to-tank). Alternatives in the same table: Local bus (not London) 0.12525, Local London bus 0.06875, Coach 0.02776.",
  } as Cited,

  rail: {
    value: 0.03546, unit: "kg CO2e per passenger-km", source: DESNZ, url: DESNZ_URL, year: 2025,
    table: "Business travel- land > Rail > National rail > passenger.km (flat-file ID 25_315_3147_11_1)",
    note: "UK national rail average (diesel and electric traction mix, using the UK grid). Alternatives in the same table: International rail (Eurostar) 0.00446, Light rail and tram 0.0286, London Underground 0.0278. Other countries' rail will differ with their grid and traction mix.",
  } as Cited,

  // Flights, kg CO2e per passenger-km INCLUDING radiative forcing. DESNZ bands: Domestic / Short-haul / Long-haul (all to/from UK).
  flight: {
    short: {
      economy: flight(0.12576, "Short-haul, to/from UK", "Economy class", "21_316_3164_11_1", SHORT_NOTE),
      premium: flight(null, "Short-haul, to/from UK", "Premium economy class", null, SHORT_PREMIUM_NOTE),
      business: flight(0.18863, "Short-haul, to/from UK", "Business class", "21_316_3166_11_1", SHORT_NOTE),
    },
    medium: {
      economy: flight(0.12576, "Short-haul, to/from UK", "Economy class", "21_316_3164_11_1", MEDIUM_NOTE),
      premium: flight(null, "Short-haul, to/from UK", "Premium economy class", null, `${SHORT_PREMIUM_NOTE} ${MEDIUM_NOTE}`),
      business: flight(0.18863, "Short-haul, to/from UK", "Business class", "21_316_3166_11_1", MEDIUM_NOTE),
    },
    long: {
      economy: flight(0.11704, "Long-haul, to/from UK", "Economy class", "21_316_3170_11_1"),
      premium: flight(0.18726, "Long-haul, to/from UK", "Premium economy class", "21_316_3172_11_1"),
      business: flight(0.3394, "Long-haul, to/from UK", "Business class", "21_316_3174_11_1"),
    },
  },

  // Representative one-way distances for the app's three bands: under 3 h, 3-6 h, over 6 h.
  flightRepresentativeKm: {
    short: {
      value: 1484, unit: "km, one-way", source: DESNZ_METHOD, url: DESNZ_METHOD_URL, year: 2025,
      table: "Table 36 'Illustrative short- and long-haul flight distances from the UK', row 'Short-haul > Average (CAA statistics)': 1,484 km",
      note: "Average short-haul sector for all flights to/from the UK in 2023 CAA statistics, i.e. the population the short-haul factor was built from; roughly a 2-2.5 h flight, inside the app's 'under 3 h' band. App assumption: that a UK-centred average also represents other users' short flights. Table 36 examples from London: Amsterdam 400 km, Prague 1,000 km, Malaga 1,700 km. The domestic average (434 km) is not used, see `flight.short`.",
    } as Cited,
    medium: {
      value: 3000, unit: "km, one-way", source: `App assumption, anchored to ${DESNZ_METHOD}`, url: DESNZ_METHOD_URL, year: 2025,
      table: "Table 36 lists Athens 2,400 km and Sharm El Sheikh 3,300 km as short-haul examples from London; 3,000 km sits between them",
      note: "No published average exists for a 3-6 h band, so this is an app assumption: a 3,000 km sector is about 4-4.5 h and lies just inside DESNZ's roughly 3,700 km short-haul boundary, matching the short-haul factor used for `flight.medium`. Change it and the factor together.",
    } as Cited,
    long: {
      value: 6799, unit: "km, one-way", source: DESNZ_METHOD, url: DESNZ_METHOD_URL, year: 2025,
      table: "Table 36 'Illustrative short- and long-haul flight distances from the UK', row 'Long-haul > Average (CAA statistics)': 6,799 km",
      note: "Average long-haul sector for all flights to/from the UK in 2023 CAA statistics, i.e. the population the long-haul factor was built from; roughly 8-9 h. Table 36 examples from London: Dubai 5,500 km, New York 5,600 km, Mumbai 7,200 km, Los Angeles 8,900 km, Hong Kong 9,700 km, Sydney 17,000 km. App assumption: that a UK-centred average also represents other users' long flights.",
    } as Cited,
  },

  naturalGasPerKwh: {
    value: 0.18296, unit: "kg CO2e per kWh (Gross CV)", source: DESNZ, url: DESNZ_URL, year: 2025,
    table: "Fuels > Gaseous fuels > Natural gas > kWh (Gross CV) (flat-file ID 1_100_1004_6_1)",
    note: "Gross calorific value basis, which is how UK gas bills are metered in kWh (methodology paper para 2.9). The Net CV row is 0.2027. Scope 1 combustion only; DESNZ's well-to-tank factor for gas is separate.",
  } as Cited,

  naturalGasPerM3: {
    value: 2.06672, unit: "kg CO2e per cubic metre", source: DESNZ, url: DESNZ_URL, year: 2025,
    table: "Fuels > Gaseous fuels > Natural gas > cubic metres (flat-file ID 1_100_1004_1_1)",
    note: "Standard cubic metres of UK-quality natural gas; other countries' gas has a slightly different calorific value. Scope 1 combustion only.",
  } as Cited,

  lpgPerKg: {
    value: 2.93936, unit: "kg CO2e per kg", source: DESNZ, url: DESNZ_URL, year: 2025,
    table: "Fuels > Gaseous fuels > LPG > tonnes: 2,939.36095 kg CO2e per tonne (flat-file ID 1_100_1003_15_1), divided by 1,000",
    note: "Unit conversion only (per tonne to per kg). DESNZ also gives 0.2145 kg CO2e per kWh (Gross CV). A typical 12.5 kg cooking cylinder is therefore about 36.7 kg CO2e. Scope 1 combustion only.",
  } as Cited,

  lpgPerLitre: {
    value: 1.55713, unit: "kg CO2e per litre", source: DESNZ, url: DESNZ_URL, year: 2025,
    table: "Fuels > Gaseous fuels > LPG > litres (flat-file ID 1_100_1003_8_1)",
    note: "Litres of liquid LPG (as sold for heating tanks or autogas). Scope 1 combustion only.",
  } as Cited,

  heatingOilPerLitre: {
    value: 2.54016, unit: "kg CO2e per litre", source: DESNZ, url: DESNZ_URL, year: 2025,
    table: "Fuels > Liquid fuels > Burning oil > litres (flat-file ID 1_101_1010_8_1)",
    note: "'Burning oil' is DESNZ's name for kerosene-type domestic heating oil (28-second oil). Gas oil (35-second, 'red diesel') is a different row in the same table and is not transcribed here. Scope 1 combustion only.",
  } as Cited,

  woodPerKg: {
    value: 0.04699, unit: "kg CO2e per kg", source: DESNZ, url: DESNZ_URL, year: 2025,
    table: "Bioenergy > Biomass > Wood logs > tonnes: 46.98508 kg CO2e per tonne (flat-file ID 2_104_1043_15_1), divided by 1,000",
    note: "Biogenic caveat. This Scope 1 factor counts only the CH4 and N2O from burning wood. The CO2 that actually leaves the chimney is reported separately by DESNZ as biogenic CO2 'Outside of scopes' (Biomass > Wood logs: 1,436.23 kg CO2 per tonne, i.e. 1.43623 kg per kg, flat-file ID 99_104_1043_15_2) on the GHG Protocol convention that regrowth re-absorbs it. If the app wants a 'what physically leaves the chimney' figure use 1.43623 + 0.04699 = 1.483 kg per kg; if it wants a 'sustainably sourced' figure use this 0.047. Upstream well-to-tank emissions for wood logs are a further 52.14 kg CO2e per tonne (ID 12_901_1043_15_1). Per kWh of heat the Scope 1 row is 0.0115 kg CO2e.",
  } as Cited,

  heatPumpCop: {
    value: 2.8, unit: "ratio: kWh of heat delivered per kWh of electricity, seasonal (SPFH4)", year: 2023,
    source: "Energy Systems Catapult for DESNZ (2023) Electrification of Heat Demonstration Project: Interim Heat Pump Performance Data Analysis Report",
    url: "https://es.catapult.org.uk/wp-content/uploads/2023/03/EoH-Interim-Heat-Pump-Performance-Data-Analysis-Report-1.pdf",
    table: "Table 1.2 'EoH and RHPP observed Air Source Heat Pump SPFs', row SPFH4, EoH column: median 2.80, interquartile range [2.53, 3.09], sample 291 systems",
    note: "Measured seasonal performance in 291 UK homes over 12 months, not a manufacturer's rated SCOP (rated values are typically 3-4). SPFH4 is the whole-heating-system boundary (heat pump, outdoor fan, circulation pumps, back-up immersion), which is what a household's electricity meter sees. SPFH2 (heat pump unit only) median 2.94. Heat pumps inside hybrid gas/electric systems averaged 2.37. Convert heat demand to electricity as kWh_heat / 2.8. The Energy Saving Trust page on air-source heat pumps could not be fetched (HTTP 403) so this field study is cited instead.",
  } as Cited,

  // Diet: kg CO2e per person per day by diet group, Scarborough et al. 2023, Table 3, GWP100.
  diet: {
    vegan: diet(2.47, "Vegans", "2.47 (2.09, 3.36)"),
    vegetarian: diet(4.16, "Vegetarians", "4.16 (3.31, 5.82)"),
    pescatarian: diet(4.74, "Fish-eaters", "4.74 (3.85, 6.27)", "Paper's 'fish-eaters' group (eat fish but no meat)."),
    low_meat: diet(5.37, "Low meat-eaters", "5.37 (4.26, 6.99)", "Paper's definition: 0 to <50 g of meat per day."),
    average: diet(7.04, "Medium meat-eaters", "7.04 (5.26, 9.39)", "The app's 'average' is mapped to the paper's medium meat-eaters (50 to <100 g of meat per day). This is the middle group, not a population-weighted UK mean, which the paper does not report."),
    high_meat: diet(10.24, "High meat-eaters", "10.24 (7.04, 15.95)", "Paper's definition: 100 g or more of meat per day."),
  },

  clothing: {
    newItem: {
      value: 20.0, unit: "kg CO2e per garment", source: LEVIS, url: LEVIS_URL, year: 2015,
      table: "Slide 'Levi's 501 jeans: climate change impact, cradle to grave climate change impacts, amount by phase (kg CO2-e)': fibre 2.9 + fabric production 9.0 + cut, sew, finish 2.6 + sundries and packaging 1.7 + transport, logistics, retail 3.8 = 20.0; consumer care 12.5 and end of life 0.9 excluded; full cradle-to-grave total 33.4 (slide 'Levi's 501 jean lifecycle impact')",
      note: "Derived by summing the published phase values: the cradle-to-retail share of the 33.4 kg cradle-to-grave figure for one pair of 501 jeans. Consumer washing and drying (12.5 kg over the jeans' life) is left out because the app already counts household electricity and gas. A pair of jeans is a heavy garment: Mistra Future Fashion's six-garment LCA (Sandin et al. 2019, RISE report ISBN 978-91-89049-05-5) puts whole-life-cycle impacts at roughly 1 kg CO2e (socks) to 20 kg (jacket) per garment, so 20 kg per 'item' will overstate T-shirts and understate coats. App assumption: one number for every garment type.",
    } as Cited,
    secondhandItem: {
      value: 5.5, unit: "kg CO2e per garment", year: 2010,
      source: "Farrant L., Olsen S.I., Wangel A. (2010) Environmental benefits from reusing clothes. International Journal of Life Cycle Assessment 15, 726-736. doi:10.1007/s11367-010-0197-y (displacement rate); new-garment figure from Levi Strauss & Co. 2015 (see clothing.newItem)",
      url: "https://doi.org/10.1007/s11367-010-0197-y",
      table: "Abstract: 'the purchase of 100 second-hand garments would save between 60 and 85 new garments'",
      note: "Derived, not transcribed: newItem x (1 - displacement) = 20.0 x (1 - 0.725) = 5.5 kg, using the midpoint of Farrant et al.'s 60-85% displacement range (3.0-8.0 kg across the range). Rationale: buying second-hand avoids the production of a new garment only 60-85% of the time, so the un-displaced share of a new garment's cradle-to-retail footprint is charged to the second-hand purchase. The collection, sorting and resale logistics of reuse are small in Farrant et al. and are ignored here. App assumption: the midpoint, and the same Levi's-based new-garment figure.",
    } as Cited,
  },

  worldGridGPerKwh: {
    value: 458.5, unit: "g CO2e per kWh", year: 2025,
    source: "Ember, Yearly Electricity Data, file release_generation_yearly_global.csv (CC BY 4.0), server file date 10 Aug 2026, accessed 2026-09-05",
    url: EMBER_CSV,
    table: "Row Area 'World', Electricity source 'Total generation', Year 2025, column 'Emissions intensity (gCO2e/kWh)': 458.54",
    note: "Ember's current release labels the column gCO2e/kWh (this file's spec asked for g CO2 per kWh; Ember's older long-format release of the same dataset labels it 'CO2 intensity, gCO2/kWh' and gives 458.49 for 2025). Ember's page (last updated 28 July 2026) says 2025 is complete for 91 countries covering about 93% of demand; the World row includes Ember's estimates for the rest. 2024: 471.5. scripts/build-factors.ts writes the same figure to grid.generated.ts as GRID_WORLD so it can be refreshed automatically.",
  } as Cited,
};
