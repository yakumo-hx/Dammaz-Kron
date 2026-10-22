import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const entries = JSON.parse(
  readFileSync(new URL("../src/data/entries.json", import.meta.url), "utf8"),
);
const seen = new Set();
for (const entry of entries) {
  if (!/^\d{4,}$/.test(entry.id))
    throw new Error(`Invalid entry ID: ${entry.id}`);
  if (seen.has(entry.id)) throw new Error(`Duplicate entry ID: ${entry.id}`);
  seen.add(entry.id);
  if (!entry.question?.trim() || !entry.answer?.trim())
    throw new Error(`Missing text: ${entry.id}`);
  if (
    !Array.isArray(entry.tags) ||
    !entry.tags.every((tag) => typeof tag === "string" && tag.trim())
  ) {
    throw new Error(`Invalid tags: ${entry.id}`);
  }
  if (!Array.isArray(entry.images))
    throw new Error(`Missing images array: ${entry.id}`);
  for (const image of entry.images) {
    if (
      !image.alt ||
      !image.src.startsWith("/images/") ||
      image.src.includes("..") ||
      !existsSync(resolve("public", image.src.slice(1)))
    ) {
      throw new Error(`Missing or invalid image: ${entry.id}: ${image.src}`);
    }
  }
}
console.log(
  `Content OK: ${entries.length} entries; unique IDs and valid media.`,
);
