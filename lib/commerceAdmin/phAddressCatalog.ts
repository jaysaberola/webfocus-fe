import places from "./phAddressPlaces.json";

export type PhAddressPlace = {
  street?: string;
  city: string;
  province: string;
  zip: string;
  country: string;
};

const PH = "Philippines";

export const PH_ADDRESS_PLACES = places as PhAddressPlace[];

export const PH_COUNTRIES = [PH];

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

export const PH_PROVINCES = uniqueSorted(PH_ADDRESS_PLACES.map((place) => place.province));

export const PH_CITIES = uniqueSorted(PH_ADDRESS_PLACES.map((place) => place.city));

export const PH_ZIPS = uniqueSorted(PH_ADDRESS_PLACES.map((place) => place.zip));

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function findPlaceByCity(city: string, province?: string): PhAddressPlace | null {
  const needle = normalize(city);
  if (!needle) return null;
  const provinceNeedle = province ? normalize(province) : "";
  const matches = PH_ADDRESS_PLACES.filter((place) => normalize(place.city) === needle);
  if (!matches.length) {
    return (
      PH_ADDRESS_PLACES.find(
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
  return PH_ADDRESS_PLACES.find((place) => place.zip === needle) ?? null;
}

export function findPlaceByStreet(street: string, city?: string, province?: string): PhAddressPlace | null {
  const needle = normalize(street);
  if (!needle) return null;
  const cityNeedle = city ? normalize(city) : "";
  const provinceNeedle = province ? normalize(province) : "";
  const matches = PH_ADDRESS_PLACES.filter((place) => normalize(place.street || "") === needle);
  if (!matches.length) {
    return (
      PH_ADDRESS_PLACES.find(
        (place) =>
          Boolean(place.street) &&
          (normalize(place.street || "").includes(needle) || needle.includes(normalize(place.street || "")))
      ) ?? null
    );
  }
  return (
    matches.find(
      (place) =>
        (!cityNeedle || normalize(place.city) === cityNeedle) &&
        (!provinceNeedle || normalize(place.province) === provinceNeedle)
    ) ?? matches[0]
  );
}

export function streetsForPlace(city?: string, province?: string) {
  const cityNeedle = city ? normalize(city) : "";
  const provinceNeedle = province ? normalize(province) : "";
  return PH_ADDRESS_PLACES.filter((place) => {
    if (!place.street) return false;
    if (cityNeedle && normalize(place.city) !== cityNeedle) return false;
    if (provinceNeedle && normalize(place.province) !== provinceNeedle) return false;
    return true;
  });
}

export function citiesForProvince(province: string) {
  const needle = normalize(province);
  if (!needle) return PH_ADDRESS_PLACES;
  return PH_ADDRESS_PLACES.filter((place) => normalize(place.province) === needle);
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
