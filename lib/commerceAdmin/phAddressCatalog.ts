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

function streetKey(city: string, province: string) {
  return `${normalize(city)}|${normalize(province)}`;
}

const CITY_BY_KEY = new Map(
  PH_ADDRESS_CITIES.map((place) => [`${normalize(place.city)}|${normalize(place.province)}`, place])
);

export function findPlaceByCity(city: string, province?: string): PhAddressPlace | null {
  const needle = normalize(city);
  if (!needle) return null;
  const provinceNeedle = province ? normalize(province) : "";
  const matches = PH_ADDRESS_CITIES.filter((place) => normalize(place.city) === needle);
  if (!matches.length) {
    return (
      PH_ADDRESS_CITIES.find(
        (place) => normalize(place.city).includes(needle) || needle.includes(normalize(place.city))
      ) ?? null
    );
  }
  if (provinceNeedle) {
    return matches.find((place) => normalize(place.province) === provinceNeedle) ?? matches[0];
  }
  return matches[0];
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

export function streetsForPlace(city?: string, province?: string): PhAddressPlace[] {
  const cityNeedle = normalize(city || "");
  const provinceNeedle = normalize(province || "");
  const rows: PhAddressPlace[] = [];

  for (const [key, barangays] of Object.entries(DATA.streets)) {
    const [cityKey, provinceKey] = key.split("|");
    if (cityNeedle && cityKey !== cityNeedle && !cityKey.includes(cityNeedle) && !cityNeedle.includes(cityKey)) {
      continue;
    }
    if (provinceNeedle && provinceKey !== provinceNeedle) continue;

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

function titleFromKey(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function citiesForProvince(province: string) {
  const needle = normalize(province);
  if (!needle) return PH_ADDRESS_CITIES;
  return PH_ADDRESS_CITIES.filter((place) => normalize(place.province) === needle);
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
