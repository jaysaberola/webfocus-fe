const fs = require("fs");

const psgcPath = process.argv[2];
const sqlPath = process.argv[3];
const outPath = process.argv[4];

function titleCase(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\b([a-z])/g, (match) => match.toUpperCase())
    .replace(/\bPob\./g, "Pob.")
    .replace(/\b(Ncr|Ii|Iii|Iv|Vi|Vii|Viii)\b/g, (match) => match.toUpperCase());
}

function cleanCityName(raw) {
  let name = String(raw || "").replace(/\s+/g, " ").trim();
  name = name.replace(/^CITY OF\s+/i, "").replace(/^MUNICIPALITY OF\s+/i, "");
  if (/^CITY OF /i.test(String(raw || ""))) {
    name = `${name.replace(/\s+CITY$/i, "")} City`;
  }
  return titleCase(name);
}

function cleanProvinceName(raw) {
  const value = String(raw || "").replace(/\s+/g, " ").trim();
  if (/national capital region|ncr/i.test(value)) return "Metro Manila";
  return titleCase(value);
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/^city of\s+/g, "")
    .replace(/\s+city$/g, "")
    .replace(/^municipality of\s+/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function loadZipIndex(sqlFile) {
  const index = new Map();
  if (!sqlFile || !fs.existsSync(sqlFile)) return index;
  const sql = fs.readFileSync(sqlFile, "utf8");
  const start = sql.indexOf("VALUES");
  const body = sql.slice(start + 6);
  const tupleRe = /\(([^)]+)\)/g;
  let match;
  while ((match = tupleRe.exec(body))) {
    const parts = match[1].split(",").map((part) => part.trim());
    if (parts.length < 7) continue;
    const unquote = (value) => {
      const trimmed = value.trim();
      if (trimmed === "NULL") return "";
      return trimmed.replace(/^'|'$/g, "").replace(/\\'/g, "'").replace(/''/g, "'");
    };
    const division = unquote(parts[1]);
    const provinceRaw = unquote(parts[2]);
    const cityRaw = unquote(parts[3]);
    const location = unquote(parts[4]);
    const zip = unquote(parts[5]);
    if (!zip) continue;
    const province = !provinceRaw || /^ncr$/i.test(division) ? "Metro Manila" : provinceRaw;
    const city = cityRaw || location;
    const key = `${normalize(city)}|${normalize(province)}`;
    if (!index.has(key)) index.set(key, zip.trim());
    const cityOnly = normalize(city);
    if (cityOnly && !index.has(cityOnly)) index.set(cityOnly, zip.trim());
  }
  return index;
}

const psgc = JSON.parse(fs.readFileSync(psgcPath, "utf8"));
const zipIndex = loadZipIndex(sqlPath);

const cities = [];
const streets = {};
const citySeen = new Set();

for (const region of Object.values(psgc)) {
  const provinceList = region?.province_list || {};
  for (const [provinceName, provinceData] of Object.entries(provinceList)) {
    const province = cleanProvinceName(provinceName);
    const municipalityList = provinceData?.municipality_list || {};
    for (const [cityName, municipality] of Object.entries(municipalityList)) {
      const city = cleanCityName(cityName);
      const zip =
        zipIndex.get(`${normalize(city)}|${normalize(province)}`) ||
        zipIndex.get(normalize(city)) ||
        "";
      const cityKey = `${city}|${province}`;
      if (!citySeen.has(cityKey.toLowerCase())) {
        citySeen.add(cityKey.toLowerCase());
        cities.push({
          city,
          province,
          zip,
          country: "Philippines",
        });
      }
      const streetKey = `${normalize(city)}|${normalize(province)}`;
      const barangays = Array.isArray(municipality?.barangay_list) ? municipality.barangay_list : [];
      if (!streets[streetKey]) streets[streetKey] = [];
      const seenStreets = new Set(streets[streetKey].map((item) => item.toLowerCase()));
      for (const barangay of barangays) {
        const street = titleCase(String(barangay || "").replace(/\s+/g, " ").trim());
        if (!street || seenStreets.has(street.toLowerCase())) continue;
        seenStreets.add(street.toLowerCase());
        streets[streetKey].push(street);
      }
    }
  }
}

cities.sort((a, b) => a.city.localeCompare(b.city) || a.province.localeCompare(b.province));
for (const key of Object.keys(streets)) {
  streets[key].sort((a, b) => a.localeCompare(b));
}

fs.writeFileSync(outPath, JSON.stringify({ cities, streets }));
console.log(`Wrote ${cities.length} cities and ${Object.keys(streets).length} street groups to ${outPath}`);
