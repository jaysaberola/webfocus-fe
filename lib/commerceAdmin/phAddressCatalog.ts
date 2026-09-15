import catalog from "./phAddressPlaces.json";

export type PhAddressPlace = {
  street?: string;
  city: string;
  region?: string;
  province: string;
  zip: string;
  country: string;
};

type StreetEntry = string | { street?: string; zip?: string };

type AddressCatalog = {
  cities: PhAddressPlace[];
  streets: Record<string, StreetEntry[]>;
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

export const PH_REGIONS = uniqueSorted(PH_ADDRESS_CITIES.map((place) => String(place.region || "")));

const REGION_PROVINCES: Record<string, string[]> = PH_ADDRESS_CITIES.reduce(
  (groups, place) => {
    const region = String(place.region || "").trim();
    const province = String(place.province || "").trim();
    if (!region || !province) return groups;
    const list = groups[region] || [];
    if (!list.includes(province)) list.push(province);
    groups[region] = list;
    return groups;
  },
  {} as Record<string, string[]>,
);

Object.values(REGION_PROVINCES).forEach((list) => list.sort((a, b) => a.localeCompare(b)));

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
  "metro manila": "metro manila",
  "ncr manila": "metro manila",
  "ncr first district": "metro manila",
  "ncr second district": "metro manila",
  "ncr third district": "metro manila",
  "ncr fourth district": "metro manila",
  "ncr 1st district": "metro manila",
  "ncr 2nd district": "metro manila",
  "ncr 3rd district": "metro manila",
  "ncr 4th district": "metro manila",
  "taguig pateros": "metro manila",
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

export function findPlaceByZip(zip: string, city?: string, province?: string): PhAddressPlace | null {
  const needle = zip.trim();
  if (!needle) return null;
  const matches = PH_ADDRESS_CITIES.filter((place) => place.zip === needle);
  if (!matches.length) return null;
  if (city || province) {
    const scored = matches
      .map((place) => {
        let score = 0;
        if (city && normalize(place.city) === normalize(city)) score += 50;
        if (province && sameProvince(place.province, province)) score += 40;
        return { place, score };
      })
      .sort((left, right) => right.score - left.score);
    return scored[0]?.place ?? matches[0];
  }
  return matches[0];
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
    const region = cityRow?.region || "";

    for (const item of barangays || []) {
      const street = typeof item === "string" ? item : String(item?.street || "");
      if (!street) continue;
      const zip = typeof item === "string" ? cityRow?.zip || "" : String(item?.zip || cityRow?.zip || "");
      rows.push({
        street,
        city: displayCity,
        region,
        province: displayProvince,
        zip,
        country: PH,
      });
    }
  }

  return rows;
}

export function resolveStreetZip(street?: string, city?: string, province?: string, fallbackZip?: string) {
  const place = findPlaceByStreet(String(street || ""), city, province);
  if (place?.zip) return place.zip;
  return String(fallbackZip || "").trim();
}

export function streetsForPlace(city?: string, province?: string): PhAddressPlace[] {
  const rows = collectStreets(city, province);
  if (rows.length || !province) return rows;
  return collectStreets(city, "");
}

export function zipsForPlace(city?: string, province?: string, street?: string): PhAddressPlace[] {
  const streetRows = streetsForPlace(city, province).filter((place) => Boolean(place.zip));
  const streetNeedle = normalize(street || "");
  const preferred = streetNeedle
    ? streetRows.filter((place) => normalize(place.street || "") === streetNeedle)
    : [];
  const list = preferred.length ? preferred : streetRows;
  const seen = new Set<string>();
  return list.filter((place) => {
    const key = `${place.zip}|${place.street}|${place.city}|${place.province}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function zipSuggestOptions(city?: string, province?: string, street?: string) {
  const rows = zipsForPlace(city, province, street);
  const uniqueByZip = new Map<string, PhAddressPlace[]>();
  for (const place of rows) {
    const list = uniqueByZip.get(place.zip) || [];
    list.push(place);
    uniqueByZip.set(place.zip, list);
  }
  return [...uniqueByZip.entries()].map(([zip, places]) => {
    const place = places[0];
    const area =
      places.length === 1 && place.street
        ? `${place.street}, ${place.city}`
        : place.city;
    return {
      value: zip,
      label: `${zip} — ${area}`,
      street: places.length === 1 ? place.street : undefined,
      city: place.city,
      region: place.region,
      province: place.province,
      zip,
      country: place.country,
    };
  });
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
  const match = PH_ADDRESS_CITIES.find((place) => canonicalProvince(place.province) === needle);
  if (match?.region) return match.region;
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
  const needle = canonicalProvince(province);
  return PH_PROVINCES.some((item) => canonicalProvince(item) === needle);
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
