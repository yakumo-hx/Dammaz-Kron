import data from "../data/entries.json";

export type Entry = {
  id: string;
  question: string;
  answer: string;
  tags: string[];
  images: { src: string; alt: string }[];
};

export const entries: Entry[] = data;
export const tags = [...new Set(entries.flatMap((entry) => entry.tags))];
export const base = import.meta.env.BASE_URL.replace(/\/$/, "");
export const repoUrl = "https://github.com/yakumo-hx/Dammaz-Kron";
export const entryUrl = (id: string) => `${base}/entries/${id}/`;
