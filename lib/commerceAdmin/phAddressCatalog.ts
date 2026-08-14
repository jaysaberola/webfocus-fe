export type PhAddressPlace = {
  city: string;
  province: string;
  zip: string;
  country: string;
};

const PH = "Philippines";

export const PH_COUNTRIES = [PH];

export const PH_PROVINCES = [
  "Metro Manila",
  "Abra",
  "Agusan del Norte",
  "Agusan del Sur",
  "Aklan",
  "Albay",
  "Antique",
  "Apayao",
  "Aurora",
  "Basilan",
  "Bataan",
  "Batanes",
  "Batangas",
  "Benguet",
  "Biliran",
  "Bohol",
  "Bukidnon",
  "Bulacan",
  "Cagayan",
  "Camarines Norte",
  "Camarines Sur",
  "Camiguin",
  "Capiz",
  "Catanduanes",
  "Cavite",
  "Cebu",
  "Cotabato",
  "Davao de Oro",
  "Davao del Norte",
  "Davao del Sur",
  "Davao Occidental",
  "Davao Oriental",
  "Dinagat Islands",
  "Eastern Samar",
  "Guimaras",
  "Ifugao",
  "Ilocos Norte",
  "Ilocos Sur",
  "Iloilo",
  "Isabela",
  "Kalinga",
  "La Union",
  "Laguna",
  "Lanao del Norte",
  "Lanao del Sur",
  "Leyte",
  "Maguindanao del Norte",
  "Maguindanao del Sur",
  "Marinduque",
  "Masbate",
  "Misamis Occidental",
  "Misamis Oriental",
  "Mountain Province",
  "Negros Occidental",
  "Negros Oriental",
  "Northern Samar",
  "Nueva Ecija",
  "Nueva Vizcaya",
  "Occidental Mindoro",
  "Oriental Mindoro",
  "Palawan",
  "Pampanga",
  "Pangasinan",
  "Quezon",
  "Quirino",
  "Rizal",
  "Romblon",
  "Samar",
  "Sarangani",
  "Siquijor",
  "Sorsogon",
  "South Cotabato",
  "Southern Leyte",
  "Sultan Kudarat",
  "Sulu",
  "Surigao del Norte",
  "Surigao del Sur",
  "Tarlac",
  "Tawi-Tawi",
  "Zambales",
  "Zamboanga del Norte",
  "Zamboanga del Sur",
  "Zamboanga Sibugay",
] as const;

export const PH_ADDRESS_PLACES: PhAddressPlace[] = [
  { city: "Manila", province: "Metro Manila", zip: "1000", country: PH },
  { city: "Quezon City", province: "Metro Manila", zip: "1100", country: PH },
  { city: "Makati", province: "Metro Manila", zip: "1200", country: PH },
  { city: "Pasig", province: "Metro Manila", zip: "1600", country: PH },
  { city: "Taguig", province: "Metro Manila", zip: "1630", country: PH },
  { city: "Pasay", province: "Metro Manila", zip: "1300", country: PH },
  { city: "Mandaluyong", province: "Metro Manila", zip: "1550", country: PH },
  { city: "San Juan", province: "Metro Manila", zip: "1500", country: PH },
  { city: "Parañaque", province: "Metro Manila", zip: "1700", country: PH },
  { city: "Las Piñas", province: "Metro Manila", zip: "1740", country: PH },
  { city: "Muntinlupa", province: "Metro Manila", zip: "1770", country: PH },
  { city: "Caloocan", province: "Metro Manila", zip: "1400", country: PH },
  { city: "Malabon", province: "Metro Manila", zip: "1470", country: PH },
  { city: "Navotas", province: "Metro Manila", zip: "1485", country: PH },
  { city: "Valenzuela", province: "Metro Manila", zip: "1440", country: PH },
  { city: "Marikina", province: "Metro Manila", zip: "1800", country: PH },
  { city: "Bacoor", province: "Cavite", zip: "4102", country: PH },
  { city: "Imus", province: "Cavite", zip: "4103", country: PH },
  { city: "Dasmariñas", province: "Cavite", zip: "4114", country: PH },
  { city: "Cavite City", province: "Cavite", zip: "4100", country: PH },
  { city: "Tagaytay", province: "Cavite", zip: "4120", country: PH },
  { city: "Antipolo", province: "Rizal", zip: "1870", country: PH },
  { city: "Cainta", province: "Rizal", zip: "1900", country: PH },
  { city: "Taytay", province: "Rizal", zip: "1920", country: PH },
  { city: "Santa Rosa", province: "Laguna", zip: "4026", country: PH },
  { city: "Calamba", province: "Laguna", zip: "4027", country: PH },
  { city: "San Pedro", province: "Laguna", zip: "4023", country: PH },
  { city: "Biñan", province: "Laguna", zip: "4024", country: PH },
  { city: "Los Baños", province: "Laguna", zip: "4030", country: PH },
  { city: "Batangas City", province: "Batangas", zip: "4200", country: PH },
  { city: "Lipa", province: "Batangas", zip: "4217", country: PH },
  { city: "Tanauan", province: "Batangas", zip: "4232", country: PH },
  { city: "Lucena", province: "Quezon", zip: "4301", country: PH },
  { city: "Malolos", province: "Bulacan", zip: "3000", country: PH },
  { city: "Meycauayan", province: "Bulacan", zip: "3020", country: PH },
  { city: "San Jose del Monte", province: "Bulacan", zip: "3023", country: PH },
  { city: "Angeles", province: "Pampanga", zip: "2009", country: PH },
  { city: "San Fernando", province: "Pampanga", zip: "2000", country: PH },
  { city: "Olongapo", province: "Zambales", zip: "2200", country: PH },
  { city: "Tarlac City", province: "Tarlac", zip: "2300", country: PH },
  { city: "Cabanatuan", province: "Nueva Ecija", zip: "3100", country: PH },
  { city: "Dagupan", province: "Pangasinan", zip: "2400", country: PH },
  { city: "San Fernando", province: "La Union", zip: "2500", country: PH },
  { city: "Baguio", province: "Benguet", zip: "2600", country: PH },
  { city: "Laoag", province: "Ilocos Norte", zip: "2900", country: PH },
  { city: "Vigan", province: "Ilocos Sur", zip: "2700", country: PH },
  { city: "Tuguegarao", province: "Cagayan", zip: "3500", country: PH },
  { city: "Santiago", province: "Isabela", zip: "3311", country: PH },
  { city: "Naga City", province: "Camarines Sur", zip: "4400", country: PH },
  { city: "Naga", province: "Camarines Sur", zip: "4400", country: PH },
  { city: "Iriga", province: "Camarines Sur", zip: "4431", country: PH },
  { city: "Pili", province: "Camarines Sur", zip: "4418", country: PH },
  { city: "Daet", province: "Camarines Norte", zip: "4600", country: PH },
  { city: "Legazpi", province: "Albay", zip: "4500", country: PH },
  { city: "Tabaco", province: "Albay", zip: "4511", country: PH },
  { city: "Sorsogon City", province: "Sorsogon", zip: "4700", country: PH },
  { city: "Masbate City", province: "Masbate", zip: "5400", country: PH },
  { city: "Virac", province: "Catanduanes", zip: "4800", country: PH },
  { city: "Iloilo City", province: "Iloilo", zip: "5000", country: PH },
  { city: "Bacolod", province: "Negros Occidental", zip: "6100", country: PH },
  { city: "Roxas City", province: "Capiz", zip: "5800", country: PH },
  { city: "Kalibo", province: "Aklan", zip: "5600", country: PH },
  { city: "Cebu City", province: "Cebu", zip: "6000", country: PH },
  { city: "Mandaue", province: "Cebu", zip: "6014", country: PH },
  { city: "Lapu-Lapu", province: "Cebu", zip: "6015", country: PH },
  { city: "Talisay", province: "Cebu", zip: "6045", country: PH },
  { city: "Dumaguete", province: "Negros Oriental", zip: "6200", country: PH },
  { city: "Tacloban", province: "Leyte", zip: "6500", country: PH },
  { city: "Ormoc", province: "Leyte", zip: "6541", country: PH },
  { city: "Catbalogan", province: "Samar", zip: "6700", country: PH },
  { city: "Calbayog", province: "Samar", zip: "6710", country: PH },
  { city: "Puerto Princesa", province: "Palawan", zip: "5300", country: PH },
  { city: "Cagayan de Oro", province: "Misamis Oriental", zip: "9000", country: PH },
  { city: "Iligan", province: "Lanao del Norte", zip: "9200", country: PH },
  { city: "Butuan", province: "Agusan del Norte", zip: "8600", country: PH },
  { city: "Surigao City", province: "Surigao del Norte", zip: "8400", country: PH },
  { city: "Davao City", province: "Davao del Sur", zip: "8000", country: PH },
  { city: "Tagum", province: "Davao del Norte", zip: "8100", country: PH },
  { city: "General Santos", province: "South Cotabato", zip: "9500", country: PH },
  { city: "Koronadal", province: "South Cotabato", zip: "9506", country: PH },
  { city: "Cotabato City", province: "Maguindanao del Norte", zip: "9600", country: PH },
  { city: "Zamboanga City", province: "Zamboanga del Sur", zip: "7000", country: PH },
  { city: "Pagadian", province: "Zamboanga del Sur", zip: "7016", country: PH },
  { city: "Dipolog", province: "Zamboanga del Norte", zip: "7100", country: PH },
];

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
      PH_ADDRESS_PLACES.find((place) => normalize(place.city).includes(needle) || needle.includes(normalize(place.city))) ??
      null
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
