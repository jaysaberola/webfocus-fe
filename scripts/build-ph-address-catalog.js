const fs = require("fs");
const path = require("path");

const sqlPath = process.argv[2];
const outPath = process.argv[3];
const sql = fs.readFileSync(sqlPath, "utf8");
const start = sql.indexOf("VALUES");
const body = sql.slice(start + 6);

function unquote(value) {
  const trimmed = value.trim();
  if (trimmed === "NULL") return "";
  return trimmed.replace(/^'|'$/g, "").replace(/\\'/g, "'").replace(/''/g, "'");
}

const rows = [];
const tupleRe = /\(([^)]+)\)/g;
let match;
while ((match = tupleRe.exec(body))) {
  const parts = match[1].split(",").map((part) => part.trim());
  if (parts.length < 7) continue;
  const division = unquote(parts[1]);
  const provinceRaw = unquote(parts[2]);
  const cityRaw = unquote(parts[3]);
  const location = unquote(parts[4]);
  const zip = unquote(parts[5]);
  if (!zip) continue;

  const province =
    !provinceRaw || /^ncr$/i.test(division) || /^ncr$/i.test(provinceRaw)
      ? "Metro Manila"
      : provinceRaw;
  const street = location.replace(/\s+/g, " ").trim();
  const city = (cityRaw || location).replace(/\s+/g, " ").trim();
  if (!city) continue;

  rows.push({
    street: street && street.toLowerCase() !== city.toLowerCase() ? street : "",
    city,
    province: province.replace(/\s+/g, " ").trim(),
    zip: zip.trim(),
    country: "Philippines",
  });
}

const seen = new Set();
const unique = [];
for (const row of rows) {
  const key = `${row.street.toLowerCase()}|${row.city.toLowerCase()}|${row.province.toLowerCase()}|${row.zip}`;
  if (seen.has(key)) continue;
  seen.add(key);
  unique.push(row);
}

unique.sort(
  (a, b) =>
    a.city.localeCompare(b.city) ||
    a.street.localeCompare(b.street) ||
    a.province.localeCompare(b.province) ||
    a.zip.localeCompare(b.zip)
);

fs.writeFileSync(outPath, JSON.stringify(unique));
console.log(`Wrote ${unique.length} places to ${outPath}`);
