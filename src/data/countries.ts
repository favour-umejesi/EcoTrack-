export type Continent = "Africa" | "Asia" | "Europe" | "North America" | "South America" | "Oceania";
export type Country = { code: string; name: string; continent: Continent };

const raw: Record<Continent, string> = {
  Africa: "dz Algeria|ao Angola|bj Benin|bw Botswana|bf Burkina Faso|bi Burundi|cv Cabo Verde|cm Cameroon|cf Central African Republic|td Chad|km Comoros|cg Congo|cd DR Congo|ci Côte d'Ivoire|dj Djibouti|eg Egypt|gq Equatorial Guinea|er Eritrea|sz Eswatini|et Ethiopia|ga Gabon|gm Gambia|gh Ghana|gn Guinea|gw Guinea-Bissau|ke Kenya|ls Lesotho|lr Liberia|ly Libya|mg Madagascar|mw Malawi|ml Mali|mr Mauritania|mu Mauritius|ma Morocco|mz Mozambique|na Namibia|ne Niger|ng Nigeria|rw Rwanda|st São Tomé and Príncipe|sn Senegal|sc Seychelles|sl Sierra Leone|so Somalia|za South Africa|ss South Sudan|sd Sudan|tz Tanzania|tg Togo|tn Tunisia|ug Uganda|zm Zambia|zw Zimbabwe",
  Asia: "af Afghanistan|am Armenia|az Azerbaijan|bh Bahrain|bd Bangladesh|bt Bhutan|bn Brunei|kh Cambodia|cn China|cy Cyprus|ge Georgia|in India|id Indonesia|ir Iran|iq Iraq|il Israel|jp Japan|jo Jordan|kz Kazakhstan|kw Kuwait|kg Kyrgyzstan|la Laos|lb Lebanon|my Malaysia|mv Maldives|mn Mongolia|mm Myanmar|np Nepal|kp North Korea|om Oman|pk Pakistan|ps Palestine|ph Philippines|qa Qatar|sa Saudi Arabia|sg Singapore|kr South Korea|lk Sri Lanka|sy Syria|tw Taiwan|tj Tajikistan|th Thailand|tl Timor-Leste|tr Türkiye|tm Turkmenistan|ae United Arab Emirates|uz Uzbekistan|vn Vietnam|ye Yemen",
  Europe: "al Albania|ad Andorra|at Austria|by Belarus|be Belgium|ba Bosnia and Herzegovina|bg Bulgaria|hr Croatia|cz Czechia|dk Denmark|ee Estonia|fi Finland|fr France|de Germany|gr Greece|hu Hungary|is Iceland|ie Ireland|it Italy|xk Kosovo|lv Latvia|li Liechtenstein|lt Lithuania|lu Luxembourg|mt Malta|md Moldova|mc Monaco|me Montenegro|nl Netherlands|mk North Macedonia|no Norway|pl Poland|pt Portugal|ro Romania|ru Russia|sm San Marino|rs Serbia|sk Slovakia|si Slovenia|es Spain|se Sweden|ch Switzerland|ua Ukraine|gb United Kingdom|va Vatican City",
  "North America": "ag Antigua and Barbuda|bs Bahamas|bb Barbados|bz Belize|ca Canada|cr Costa Rica|cu Cuba|dm Dominica|do Dominican Republic|sv El Salvador|gd Grenada|gt Guatemala|ht Haiti|hn Honduras|jm Jamaica|mx Mexico|ni Nicaragua|pa Panama|kn Saint Kitts and Nevis|lc Saint Lucia|vc Saint Vincent and the Grenadines|tt Trinidad and Tobago|us United States",
  "South America": "ar Argentina|bo Bolivia|br Brazil|cl Chile|co Colombia|ec Ecuador|gy Guyana|py Paraguay|pe Peru|sr Suriname|uy Uruguay|ve Venezuela",
  Oceania: "au Australia|fj Fiji|ki Kiribati|mh Marshall Islands|fm Micronesia|nr Nauru|nz New Zealand|pw Palau|pg Papua New Guinea|ws Samoa|sb Solomon Islands|to Tonga|tv Tuvalu|vu Vanuatu",
};

export const CONTINENTS = Object.keys(raw) as Continent[];
export const COUNTRIES: Country[] = CONTINENTS.flatMap((continent) =>
  raw[continent].split("|").map((entry) => { const i = entry.indexOf(" "); return { code: entry.slice(0, i), name: entry.slice(i + 1), continent }; }),
);
export const COUNTRY_BY_CODE: Record<string, Country> = Object.fromEntries(COUNTRIES.map((c) => [c.code, c]));
export const countryName = (code: string) => COUNTRY_BY_CODE[code]?.name ?? "the world";
