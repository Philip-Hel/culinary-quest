export default function normalizeCountryName(name) {
  if (!name) return "";

  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .trim();
}