import catalog from "./phAddressPlaces.json";

export type PhAddressPlace = {
  street?: string;
  city: string;
  province: string;
  zip: string;
  country: string;
};

type AddressCatalog = {
  cities: PhAddressPlace[];
  streets: Record<string, string[]>;
};

const PH = "Philippines";
const DATA = catalog as AddressCatalog;

export const PH_ADDRESS_CITIES = DATA.cities;
export const PH_ADDRESS_PLACES = DATA.cities;
export const PH_COUNTRIES = [PH];

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

export const PH_PROVINCES = uniqueSorted(PH_ADDRESS_CITIES.map((place) => place.province));

export const PH_CITIES = uniqueSorted(PH_ADDRESS_CITIES.map((place) => place.city));

export const PH_ZIPS = uniqueSorted(PH_ADDRESS_CITIES.map((place) => place.zip));

export const PH_REGIONS = [
  "NCR — National Capital Region",
  "CAR — Cordillera Administrative Region",
  "Region I — Ilocos",
  "Region II — Cagayan Valley",
  "Region III — Central Luzon",
  "Region IV-A — CALABARZON",
  "Region IV-B — MIMAROPA",
  "Region V — Bicol",
  "Region VI — Western Visayas",
  "Region VII — Central Visayas",
  "Region VIII — Eastern Visayas",
  "Region IX — Zamboanga Peninsula",
  "Region X — Northern Mindanao",
  "Region XI — Davao",
  "Region XII — SOCCSKSARGEN",
  "Region XIII — Caraga",
  "BARMM — Bangsamoro",
];

const REGION_PROVINCES: Record<string, string[]> = {
  "NCR — National Capital Region": ["Metro Manila", "Taguig - Pateros"],
  "CAR — Cordillera Administrative Region": ["Abra", "Apayao", "Benguet", "Ifugao", "Kalinga", "Mountain Province"],
  "Region I — Ilocos": ["Ilocos Norte", "Ilocos Sur", "La Union", "Pangasinan"],
  "Region II — Cagayan Valley": ["Batanes", "Cagayan", "Isabela", "Nueva Vizcaya", "Quirino"],
  "Region III — Central Luzon": ["Aurora", "Bataan", "Bulacan", "Nueva Ecija", "Pampanga", "Tarlac", "Zambales"],
  "Region IV-A — CALABARZON": ["Batangas", "Cavite", "Laguna", "Quezon", "Rizal"],
  "Region IV-B — MIMAROPA": ["Marinduque", "Occidental Mindoro", "Oriental Mindoro", "Palawan", "Romblon"],
  "Region V — Bicol": ["Albay", "Camarines Norte", "Camarines Sur", "Catanduanes", "Masbate", "Sorsogon"],
  "Region VI — Western Visayas": ["Aklan", "Antique", "Capiz", "Guimaras", "Iloilo", "Negros Occidental"],
  "Region VII — Central Visayas": ["Bohol", "Cebu", "Negros Oriental", "Siquijor"],
  "Region VIII — Eastern Visayas": [
    "Biliran",
    "Eastern Samar",
    "Leyte",
    "Northern Samar",
    "Samar (Western Samar)",
    "Southern Leyte",
  ],
  "Region IX — Zamboanga Peninsula": ["Zamboanga Del Norte", "Zamboanga Del Sur", "Zamboanga Sibugay"],
  "Region X — Northern Mindanao": ["Bukidnon", "Camiguin", "Lanao Del Norte", "Misamis Occidental", "Misamis Oriental"],
  "Region XI — Davao": [
    "Compostela Valley",
    "Davao (Davao Del Norte)",
    "Davao Del Sur",
    "Davao Occidental",
    "Davao Oriental",
  ],
  "Region XII — SOCCSKSARGEN": ["Cotabato (North Cot.)", "Sarangani", "South Cotabato", "Sultan Kudarat"],
  "Region XIII — Caraga": [
    "Agusan Del Norte",
    "Agusan Del Sur",
    "Dinagat Islands",
    "Surigao Del Norte",
    "Surigao Del Sur",
  ],
  "BARMM — Bangsamoro": ["Basilan", "Lanao Del Sur", "Maguindanao", "Sulu", "Tawi-Tawi"],
};

function normalize(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^city of\s+/g, "")
    .replace(/\s+city$/g, "")
    .replace(/^municipality of\s+/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const PROVINCE_ALIASES: Record<string, string> = {
  ncr: "metro manila",
  "national capital region": "metro manila",
  manila: "metro manila",
  "ncr first district": "metro manila",
  "ncr second district": "metro manila",
  "ncr third district": "metro manila",
  "ncr fourth district": "metro manila",
  "ncr 1st district": "metro manila",
  "ncr 2nd district": "metro manila",
  "ncr 3rd district": "metro manila",
  "ncr 4th district": "metro manila",
};

function canonicalProvince(province: string) {
  const needle = normalize(province);
  return PROVINCE_ALIASES[needle] || needle;
}

function sameProvince(left?: string, right?: string) {
  if (!left || !right) return !left && !right;
  return canonicalProvince(left) === canonicalProvince(right);
}

function streetKey(city: string, province: string) {
  return `${normalize(city)}|${normalize(province)}`;
}

const CITY_BY_KEY = new Map(
  PH_ADDRESS_CITIES.map((place) => [`${normalize(place.city)}|${normalize(place.province)}`, place])
);

export function findPlaceByCity(city: string, province?: string): PhAddressPlace | null {
  const raw = String(city || "").trim();
  const needle = normalize(city);
  if (!needle) return null;

  const scored = PH_ADDRESS_CITIES
    .map((place) => {
      const cityKey = normalize(place.city);
      if (cityKey !== needle && !cityKey.includes(needle) && !needle.includes(cityKey)) {
        return null;
      }
      let score = 0;
      if (place.city.toLowerCase() === raw.toLowerCase()) score += 100;
      if (cityKey === needle) score += 50;
      if (province && sameProvince(place.province, province)) score += 40;
      if (place.zip) score += 1;
      return { place, score };
    })
    .filter((row): row is { place: PhAddressPlace; score: number } => Boolean(row))
    .sort((left, right) => right.score - left.score);

  return scored[0]?.place ?? null;
}

export function findPlaceByZip(zip: string): PhAddressPlace | null {
  const needle = zip.trim();
  if (!needle) return null;
  return PH_ADDRESS_CITIES.find((place) => place.zip === needle) ?? null;
}

export function findPlaceByStreet(street: string, city?: string, province?: string): PhAddressPlace | null {
  const rows = streetsForPlace(city, province);
  const needle = normalize(street);
  if (!needle) return null;
  return (
    rows.find((place) => normalize(place.street || "") === needle) ||
    rows.find(
      (place) =>
        Boolean(place.street) &&
        (normalize(place.street || "").includes(needle) || needle.includes(normalize(place.street || "")))
    ) ||
    null
  );
}

function collectStreets(city?: string, province?: string): PhAddressPlace[] {
  const cityNeedle = normalize(city || "");
  const provinceNeedle = province ? canonicalProvince(province) : "";
  const rows: PhAddressPlace[] = [];

  for (const [key, barangays] of Object.entries(DATA.streets)) {
    const [cityKey, provinceKey] = key.split("|");
    if (cityNeedle && cityKey !== cityNeedle && !cityKey.includes(cityNeedle) && !cityNeedle.includes(cityKey)) {
      continue;
    }
    if (provinceNeedle && canonicalProvince(provinceKey) !== provinceNeedle) continue;

    const cityRow = CITY_BY_KEY.get(key);
    const displayCity = cityRow?.city || titleFromKey(cityKey);
    const displayProvince = cityRow?.province || titleFromKey(provinceKey);
    const zip = cityRow?.zip || "";

    for (const street of barangays) {
      rows.push({
        street,
        city: displayCity,
        province: displayProvince,
        zip,
        country: PH,
      });
    }
  }

  return rows;
}

export function streetsForPlace(city?: string, province?: string): PhAddressPlace[] {
  const rows = collectStreets(city, province);
  if (rows.length || !province) return rows;
  return collectStreets(city, "");
}

export function zipsForPlace(city?: string, province?: string): PhAddressPlace[] {
  const cityNeedle = normalize(city || "");
  const scoped = PH_ADDRESS_CITIES.filter((place) => {
    if (!place.zip) return false;
    if (cityNeedle) {
      const placeCity = normalize(place.city);
      if (placeCity !== cityNeedle && !placeCity.includes(cityNeedle) && !cityNeedle.includes(placeCity)) {
        return false;
      }
    }
    if (province && !sameProvince(place.province, province)) return false;
    return true;
  });
  if (scoped.length) return scoped;
  return PH_ADDRESS_CITIES.filter((place) => Boolean(place.zip));
}

function titleFromKey(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function citiesForProvince(province: string) {
  const needle = canonicalProvince(province);
  if (!needle) return PH_ADDRESS_CITIES;
  const matches = PH_ADDRESS_CITIES.filter((place) => canonicalProvince(place.province) === needle);
  return matches.length ? matches : PH_ADDRESS_CITIES;
}

export function regionForProvince(province: string) {
  const needle = canonicalProvince(province);
  if (!needle) return "";
  for (const [region, provinces] of Object.entries(REGION_PROVINCES)) {
    if (provinces.some((item) => canonicalProvince(item) === needle)) return region;
  }
  return "";
}

export function provincesForRegion(region: string) {
  const needle = String(region || "").trim();
  if (!needle) return PH_PROVINCES;
  const listed = REGION_PROVINCES[needle] || [];
  const allowed = new Set(listed.map(normalize));
  return PH_PROVINCES.filter((province) => allowed.has(normalize(province)));
}

export function isKnownProvince(province: string) {
  const needle = normalize(province);
  return PH_PROVINCES.some((item) => normalize(item) === needle);
}

export function isKnownCity(city: string) {
  return Boolean(findPlaceByCity(city));
}

export function filterAddressOptions(query: string, options: string[], limit = 80) {
  const needle = normalize(query);
  const matched = needle
    ? options.filter((option) => normalize(option).includes(needle))
    : options;
  return matched.slice(0, limit);
}
