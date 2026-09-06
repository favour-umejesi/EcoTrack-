# Emission factors: sources, licences and transcription log

All values in `src/data/factors.ts` were copied by hand from the documents below on **2026-09-05**. Nothing was taken from memory. Where a number is arithmetic on cited numbers (a unit conversion or a stated assumption) the row says "derived". `src/data/grid.generated.ts` and `src/data/averages.generated.ts` are produced by `scripts/build-factors.ts` from the Ember and Our World in Data downloads and should be regenerated, not edited.

## Sources

| # | Source | URL | Licence | Accessed |
|---|--------|-----|---------|----------|
| 1 | UK DESNZ, *Greenhouse gas reporting: conversion factors 2025* (published 10 June 2025). Files used: **flat file** (`ghg-conversion-factors-2025-flat-format.xlsx`, sheet "Factors by Category", column "GHG Conversion Factor 2025", rows with GHG/Unit "kg CO2e"); **full set** (`ghg-conversion-factors-2025-full-set.xlsx`, sheet "SECR kWh UK electricity for EVs"); **methodology paper** (`2025-GHG-CF-methodology-paper.pdf`) | https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2025 (flat file: https://assets.publishing.service.gov.uk/media/6846b6ea57f3515d9611f0dd/ghg-conversion-factors-2025-flat-format.xlsx; full set: https://assets.publishing.service.gov.uk/media/6846a4f55e92539572806125/ghg-conversion-factors-2025-full-set.xlsx; methodology: https://assets.publishing.service.gov.uk/media/6846b0870392ed9b784c0187/2025-GHG-CF-methodology-paper.pdf) | Open Government Licence v3.0 (Crown copyright 2025) | 2026-09-05 |
| 2 | Scarborough P., Clark M., Cobiac L., Papier K., Knuppel A., Lynch J., Harrington R., Key T., Springmann M. (2023). *Vegans, vegetarians, fish-eaters and meat-eaters in the UK show discrepant environmental impacts.* Nature Food 4, 565-574 | https://doi.org/10.1038/s43016-023-00795-w (read via the open-access copy at https://pmc.ncbi.nlm.nih.gov/articles/PMC10365988/ because nature.com redirected to a login) | CC BY 4.0 | 2026-09-05 |
| 3 | Ember, *Yearly Electricity Data*, file `release_generation_yearly_global.csv` (server file date 10 Aug 2026; page "Last Updated: July 28, 2026") | https://ember-energy.org/data/yearly-electricity-data/ ; CSV: https://files.ember-energy.org/public-downloads/generation/outputs/release_generation_yearly_global.csv ; fallback long-format CSV used by the script only if the first fails: https://storage.googleapis.com/emb-prod-bkt-publicdata/public-downloads/yearly_full_release_long_format.csv | CC BY 4.0 ("All content is released under a Creative Commons Attribution Licence (CC-BY-4.0)") | 2026-09-05 |
| 4 | Our World in Data, *CO2 and Greenhouse Gas Emissions* dataset, `owid-co2-data.csv` (server file date 2 Jun 2026; CO2 from the Global Carbon Budget 2025) | https://github.com/owid/co2-data ; CSV: https://owid-public.owid.io/data/co2/owid-co2-data.csv ; codebook: https://owid-public.owid.io/data/co2/owid-co2-codebook.csv | CC BY 4.0 (third-party data under original licences) | 2026-09-05 |
| 5 | Energy Systems Catapult for DESNZ (2023). *Electrification of Heat Demonstration Project: Interim Heat Pump Performance Data Analysis Report* | https://es.catapult.org.uk/wp-content/uploads/2023/03/EoH-Interim-Heat-Pump-Performance-Data-Analysis-Report-1.pdf | Not stated in the document (DESNZ-funded report, "issued on their behalf"); quoted as a published figure | 2026-09-05 |
| 6 | Levi Strauss & Co. (2015). *The Life Cycle of a Jean: understanding the environmental impact of a pair of Levi's 501 jeans* (results deck; ISO 14040/14044, panel reviewed) | https://www.levistrauss.com/wp-content/uploads/2015/03/Full-LCA-Results-Deck-FINAL.pdf | Copyright Levi Strauss & Co.; no open licence, figures quoted with attribution | 2026-09-05 |
| 7 | Farrant L., Olsen S.I., Wangel A. (2010). *Environmental benefits from reusing clothes.* Int. J. Life Cycle Assess. 15, 726-736 | https://doi.org/10.1007/s11367-010-0197-y (abstract read at https://orbit.dtu.dk/en/publications/environmental-benefits-from-reusing-clothes) | Springer, subscription; only the abstract was used | 2026-09-05 |
| 8 | Sandin G., Roos S., Spak B., Zamani B., Peters G. (2019). *Environmental assessment of Swedish clothing consumption: six garments, sustainable futures.* Mistra Future Fashion / RISE, ISBN 978-91-89049-05-5. Used only as a cross-check for the clothing figure | https://research.chalmers.se/publication/514322/file/514322_Fulltext.pdf | Not stated | 2026-09-05 |

Could not be fetched: the Energy Saving Trust air-source heat pump page (HTTP 403 from both fetch routes), so the field-measured SPF from source 5 is used for the heat-pump COP instead.

## Transcribed values

Units are the ones the app's spec asked for. "Flat-file ID" is the `ID` column of DESNZ's flat file, which pins the exact row.

### Cars (DESNZ, Scope 1, per vehicle-km)

Flat file rows `Passenger vehicles > Cars (by size) > <size> > <fuel> > km`, GHG/Unit "kg CO2e". Size bands from the methodology paper (section 5 table of UK registrations): petrol small < 1.4 l, medium 1.4-2.0 l, large > 2.0 l; diesel small < 1.7 l, medium 1.7-2.0 l, large > 2.0 l.

| Key | Value (kg CO2e/km) | Flat-file ID |
|-----|-------------------:|--------------|
| car.small.petrol | 0.14308 | 4_301_3046_4_1 |
| car.small.diesel | 0.1434 | 4_301_3045_4_1 |
| car.small.hybrid (extra) | 0.11413 | 4_301_3047_4_1 |
| car.medium.petrol | 0.17474 | 4_301_3054_4_1 |
| car.medium.diesel | 0.17174 | 4_301_3053_4_1 |
| car.medium.hybrid (extra) | 0.11724 | 4_301_3055_4_1 |
| car.large.petrol | 0.26828 | 4_301_3062_4_1 |
| car.large.diesel | 0.21007 | 4_301_3061_4_1 |
| car.large.hybrid (extra) | 0.1565 | 4_301_3063_4_1 |

### Electric car, public transport

| Key | Value | Unit | Source row |
|-----|------:|------|------------|
| carElectricKwhPerKm | 0.20656 | kWh per km | DESNZ full set, sheet "SECR kWh UK electricity for EVs", table "Cars (by size)", row "Average car", column "Battery Electric Vehicle, kWh (net)". Size rows: small 0.18852, medium 0.19814, large 0.21449. Sheet text: the kWh factors "do not include the emissions associated with the transmission and distribution of electricity" |
| bus | 0.10385 | kg CO2e per passenger-km | Flat file `Business travel- land > Bus > Average local bus > passenger.km`, ID 25_314_3145_11_1 |
| rail | 0.03546 | kg CO2e per passenger-km | Flat file `Business travel- land > Rail > National rail > passenger.km`, ID 25_315_3147_11_1 |

### Flights (DESNZ "Business travel- air", rows "With RF", per passenger-km)

| Key | Value | Flat-file ID / row |
|-----|------:|--------------------|
| flight.short.economy | 0.12576 | 21_316_3164_11_1 (Short-haul, to/from UK, Economy class, With RF) |
| flight.short.premium | null | no short-haul premium-economy row exists in DESNZ 2025 |
| flight.short.business | 0.18863 | 21_316_3166_11_1 (Short-haul, to/from UK, Business class, With RF) |
| flight.medium.* | same three as short | DESNZ has no medium band; see flags |
| flight.long.economy | 0.11704 | 21_316_3170_11_1 (Long-haul, to/from UK, Economy class, With RF) |
| flight.long.premium | 0.18726 | 21_316_3172_11_1 (Long-haul, to/from UK, Premium economy class, With RF) |
| flight.long.business | 0.3394 | 21_316_3174_11_1 (Long-haul, to/from UK, Business class, With RF) |

Rows read but not used as primary values (all With RF, kg CO2e per passenger-km): Domestic, to/from UK, Average passenger 0.22928 (ID 21_316_3160_11_1; DESNZ publishes no class split for domestic); Short-haul Average passenger 0.12786; Long-haul Average passenger 0.15282, First class 0.46814; International, to/from non-UK: Average passenger 0.14253, Economy 0.10916, Premium economy 0.17465, Business 0.31656, First 0.43663. The "Without RF" equivalents are in the same table (e.g. short-haul economy 0.07435, long-haul economy 0.06926). RF uplift: methodology paper paras 8.43-8.44, multiplier 1.7 applied to the CO2 component only.

| Key | Value (km, one-way) | Basis |
|-----|--------------------:|-------|
| flightRepresentativeKm.short | 1,484 | Methodology paper Table 36, "Short-haul > Average (CAA statistics)" (all flights to/from the UK, 2023) |
| flightRepresentativeKm.medium | 3,000 | **App assumption**: between Table 36's short-haul examples Athens 2,400 km and Sharm El Sheikh 3,300 km, inside the roughly 3,700 km short-haul boundary |
| flightRepresentativeKm.long | 6,799 | Methodology paper Table 36, "Long-haul > Average (CAA statistics)" |

Table 36 also gives the domestic average, 434 km (not used, see flags).

### Home fuels (DESNZ, Scope 1)

| Key | Value | Unit | Flat-file row |
|-----|------:|------|---------------|
| naturalGasPerKwh | 0.18296 | kg CO2e per kWh (Gross CV) | `Fuels > Gaseous fuels > Natural gas > kWh (Gross CV)`, ID 1_100_1004_6_1 (Net CV row: 0.2027) |
| naturalGasPerM3 | 2.06672 | kg CO2e per m3 | `Fuels > Gaseous fuels > Natural gas > cubic metres`, ID 1_100_1004_1_1 |
| lpgPerKg | 2.93936 | kg CO2e per kg | **derived** (unit conversion): `Fuels > Gaseous fuels > LPG > tonnes` = 2,939.36095 kg CO2e per tonne, ID 1_100_1003_15_1, divided by 1,000 |
| lpgPerLitre | 1.55713 | kg CO2e per litre | `Fuels > Gaseous fuels > LPG > litres`, ID 1_100_1003_8_1 |
| heatingOilPerLitre | 2.54016 | kg CO2e per litre | `Fuels > Liquid fuels > Burning oil > litres`, ID 1_101_1010_8_1 |
| woodPerKg | 0.04699 | kg CO2e per kg | **derived** (unit conversion): `Bioenergy > Biomass > Wood logs > tonnes` = 46.98508 kg CO2e per tonne, ID 2_104_1043_15_1, divided by 1,000. Biogenic CO2, reported by DESNZ outside the scopes: `Outside of scopes > Biomass > Wood logs > tonnes` = 1,436.23 kg CO2 per tonne, ID 99_104_1043_15_2. Well-to-tank: 52.14 kg CO2e per tonne, ID 12_901_1043_15_1 |

### Heat pump

| Key | Value | Source row |
|-----|------:|------------|
| heatPumpCop | 2.80 | Source 5, Table 1.2 "EoH and RHPP observed Air Source Heat Pump SPFs", row SPFH4, EoH column: median 2.80, IQR [2.53, 3.09], 291 systems. Same table: SPFH2 median 2.94 [2.66, 3.20]. Table 1.3 (hybrids): SPFH4 2.37 [2.01, 2.81], 58 systems |

### Diet (Scarborough et al. 2023, Table 3, column "GWP100 CO2e (kg d-1)", standardised to 2,000 kcal/day)

| Key | Paper group | Value (kg CO2e per person per day) | 2.5th-97.5th percentile |
|-----|-------------|-----------------------------------:|-------------------------|
| diet.vegan | Vegans | 2.47 | 2.09-3.36 |
| diet.vegetarian | Vegetarians | 4.16 | 3.31-5.82 |
| diet.pescatarian (extra) | Fish-eaters | 4.74 | 3.85-6.27 |
| diet.low_meat | Low meat-eaters (0 to <50 g/day) | 5.37 | 4.26-6.99 |
| diet.average | Medium meat-eaters (50 to <100 g/day) | 7.04 | 5.26-9.39 |
| diet.high_meat | High meat-eaters (100 g/day or more) | 10.24 | 7.04-15.95 |

Group definitions quoted from the Methods: "low meat-eaters (0 to <50 g d-1), medium meat-eaters (>=50 to <100 g d-1) and high meat-eaters (>=100 g d-1)". Table 3's note: "All results are presented as median (2.5th percentile, 97.5th percentile) from a Monte Carlo analysis with 1,000 iterations."

### Clothing

| Key | Value (kg CO2e per garment) | Basis |
|-----|----------------------------:|-------|
| clothing.newItem | 20.0 | **derived** from source 6, slide "Levi's 501 jeans: climate change impact" (amount by phase, kg CO2-e): fibre 2.9 + fabric production 9.0 + cut/sew/finish 2.6 + sundries and packaging 1.7 + transport/logistics/retail 3.8 = 20.0. Excluded: consumer care 12.5, end of life 0.9. Cradle-to-grave total on slide "Levi's 501 jean lifecycle impact": 33.4 kg CO2-e (the seven phases sum to 33.4) |
| clothing.secondhandItem | 5.5 | **derived**: 20.0 x (1 - 0.725). Source 7 abstract: "the purchase of 100 second-hand garments would save between 60 and 85 new garments"; 0.725 is the midpoint (range 3.0-8.0 kg for 85%-60%) |

Cross-check (source 8, section 4.1): "Climate impact per garment life cycle spans from about 1 kg CO2 eq. for the socks to about 20 kg CO2 eq. for the jacket" (whole life cycle including use, Swedish electricity).

### World grid

| Key | Value | Source row |
|-----|------:|------------|
| worldGridGPerKwh | 458.5 g CO2e/kWh (file value 458.54) | Source 3 CSV, row Area "World", Electricity source "Total generation", Year 2025, column "Emissions intensity (gCO2e/kWh)". 2024: 471.5. The older long-format file gives 458.49 "gCO2/kWh" for 2025 |

## Generated files (scripts/build-factors.ts)

- `src/data/grid.generated.ts`: `GRID` for 209 countries/territories keyed by lowercase alpha-2 (each at its latest year: 91 at 2025, 103 at 2024, 14 at 2023, 1 at 2022), `GRID_CONTINENT` (generation-weighted by each country's total generation in TWh at its latest year, grouped with the app's continents from `src/data/countries.ts`, not Ember's), `GRID_WORLD` and `GRID_SOURCE`. Spot values: France 41.5, Poland 590.9, United Kingdom 217.3, United States 384.4, India 670.5, Norway 28.1, Kosovo 901.9 g/kWh. Continents: Africa 529.7, Asia 551.2, Europe 268.7, North America 369.2, South America 161.0, Oceania 469.6.
- `src/data/averages.generated.ts`: `PER_CAPITA` for 213 countries/territories (latest year, all 2024 for the countries checked), `PER_CAPITA_CONTINENT` (population-weighted: sum of co2_per_capita x population over the continent's countries divided by summed population), `PER_CAPITA_WORLD` and `PER_CAPITA_SOURCE`. Spot values: United States 14.197, India 2.201, United Kingdom 4.526, France 3.969, China 8.658, Nigeria 0.584, Qatar 41.271 t/person. Continents: Africa 0.99, Asia 4.87, Europe 6.55, North America 9.99, South America 2.55, Oceania 9.53. World 2024: 4.729.
- The alpha-3 to alpha-2 map lives in the script, grouped by continent; the script checks it against `countries.ts` at run time and warns on any drift (none today). Kosovo is `XKX` in Ember and `OWID_KOS` in OWID; both map to `xk`.

## Things to be aware of

1. **Flight bands.** The app's bands are by duration (under 3 h, 3-6 h, over 6 h); DESNZ's are Domestic / Short-haul / Long-haul to or from the UK. `short` uses DESNZ short-haul rather than domestic because DESNZ's domestic factor (0.22928 with RF) describes 434 km hops and would overstate a typical 1,000-2,000 km flight by roughly 80%. `medium` reuses the short-haul rows because DESNZ has no 3-6 h band; the long-haul economy factor differs by only about 7%, so this choice is low-risk. The representative distances 1,484 and 6,799 km are the CAA averages the DESNZ factors were built from; 3,000 km for the medium band is an app assumption. All three are UK-centred.
2. **Premium economy on short and medium flights is `null`.** DESNZ publishes it only for long-haul and international non-UK flights. The engine must fall back explicitly.
3. **Diet values are medians, not means.** Scarborough 2023 reports the median (and 2.5th-97.5th percentiles) of a Monte Carlo over each group's mean footprint; the paper does not report a plain arithmetic mean. `diet.average` is the paper's *medium meat-eaters* group, not a UK population average.
4. **Clothing is the least certain block.** Both values are derived: the new-item figure is the cradle-to-retail part of one Levi's 501 LCA (a heavy garment; whole-life garment impacts in Mistra's study range 1-20 kg), and the second-hand figure applies a displacement midpoint to it. Treat both as order-of-magnitude.
5. **Heat pump COP** is a measured UK field median (SPFH4 = whole-system boundary), deliberately lower than manufacturers' rated SCOPs. The Energy Saving Trust page was unreachable.
6. **Wood** uses DESNZ's Scope 1 convention (CH4 + N2O only, 0.047 kg/kg); the biogenic CO2 (1.436 kg/kg) is in the note so the app can choose.
7. **Ember unit label.** The current release says gCO2e/kWh; the app's spec said g CO2/kWh. `GRID_SOURCE.unit` records the label. Ember files Aruba under South America and Cyprus under Europe; the generated continents follow the app's grouping instead. Lesotho has no intensity value in Ember and is omitted from `GRID`.
8. **OWID World row** has a blank `iso_code` (not `OWID_WRL`), so the script identifies it by `country == "World"`. OWID's own continent rows are not used; the continent figures are recomputed from country rows as requested.
9. **Mixed years in continent weighting.** Each country contributes its latest year, so a continent mean can mix 2023-2025 data.
10. **`node --experimental-strip-types`** prints a `MODULE_TYPELESS_PACKAGE_JSON` warning because `package.json` has no `"type"` field; it is harmless and `npx tsx` does not show it. Adding `"type": "module"` would silence it but was out of scope.
11. **Extras beyond the requested shape:** `car.*.hybrid` and `diet.pescatarian` were added because the sources publish them; everything else matches the requested shape exactly.

## Commands run

```sh
npx tsx scripts/build-factors.ts
node --experimental-strip-types scripts/build-factors.ts
npx tsc --noEmit -p tsconfig.json
npx eslint scripts/build-factors.ts src/data/factors.ts src/data/grid.generated.ts src/data/averages.generated.ts
npx vitest run
```
