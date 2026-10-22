import type { Entry } from "../lib/entries";
import { base, repoUrl, entryUrl } from "../lib/entries";

const entries: Entry[] = JSON.parse(
  document.querySelector("#entries-data")!.textContent!,
);
const byId = new Map(entries.map((entry) => [entry.id, entry]));
const get = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const dialog = get<HTMLDialogElement>("submission-dialog");
const book = get<HTMLElement>("book-page");
const previousButton = get<HTMLButtonElement>("previous");
const autoButton = get<HTMLButtonElement>("autoplay");
let active = entries[0];
let queue: string[] = shuffle(entries.slice(1).map((entry) => entry.id));
let history = [active.id];
let historyIndex = 0;
let autoEnabled = true;
let remaining = duration(active);
let ready = active.images.length === 0;
let hovering = false;
let lastTick = performance.now();
let toastTimeout: ReturnType<typeof setTimeout>;

function shuffle<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}
function duration(entry: Entry) {
  return entry.images.length ? 15000 : 30000;
}
function showToast(message: string) {
  const toast = get("toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("visible"), 2600);
}
function render(id: string) {
  active = byId.get(id)!;
  get("active-id").textContent = active.id;
  get("active-question").textContent = active.question;
  get("active-answer").textContent = active.answer;
  const permalink = get<HTMLAnchorElement>("active-permalink");
  permalink.href = entryUrl(active.id);
  permalink.setAttribute("aria-label", `打开记录 ${active.id} 的独立页面`);
  get("active-tags").replaceChildren(
    ...active.tags.map((tag) => {
      const span = document.createElement("span");
      span.textContent = tag;
      return span;
    }),
  );
  ready = active.images.length === 0;
  const images = active.images.map((image) => {
    const img = new Image();
    img.alt = image.alt;
    img.tabIndex = 0;
    img.setAttribute("role", "button");
    img.setAttribute("aria-label", `查看大图：${image.alt}`);
    img.addEventListener("click", () => openImage(img));
    img.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openImage(img);
      }
    });
    return { img, src: `${base}${image.src}` };
  });
  const loaded = images.map(
    ({ img, src }) =>
      new Promise<void>((resolve) => {
        img.onload = img.onerror = () => resolve();
        img.src = src;
        if (img.complete) resolve();
      }),
  );
  get("active-images").replaceChildren(...images.map((image) => image.img));
  void Promise.all(loaded).then(() => {
    if (active.id === id) {
      ready = true;
      lastTick = performance.now();
    }
  });
  remaining = duration(active);
  get("countdown").textContent = `${Math.ceil(remaining / 1000)}s`;
  previousButton.disabled = historyIndex === 0;
  const inner = get("book-entry");
  inner.classList.remove("changing");
  void inner.offsetWidth;
  inner.classList.add("changing");
}
function takeNext() {
  if (entries.length < 2) return;
  if (historyIndex < history.length - 1) {
    render(history[++historyIndex]);
    return;
  }
  if (queue.length === 0) {
    queue = shuffle(entries.map((entry) => entry.id));
    if (queue[0] === active.id) [queue[0], queue[1]] = [queue[1], queue[0]];
  }
  const id = queue.shift()!;
  history.push(id);
  historyIndex = history.length - 1;
  if (history.length > 200) {
    history.shift();
    historyIndex--;
  }
  render(id);
}
get("next").addEventListener("click", takeNext);
get("shuffle").addEventListener("click", takeNext);
previousButton.disabled = true;
previousButton.addEventListener("click", () => {
  if (historyIndex > 0) render(history[--historyIndex]);
});
function updatePlayButton() {
  autoButton.setAttribute("aria-pressed", String(autoEnabled));
  get("play-symbol").textContent = autoEnabled ? "Ⅱ" : "▷";
  get("play-label").textContent = autoEnabled ? "暂停翻页" : "自动翻页";
  autoButton.setAttribute(
    "aria-label",
    autoEnabled ? "暂停自动翻页" : "开始自动翻页",
  );
}
autoButton.addEventListener("click", () => {
  autoEnabled = !autoEnabled;
  lastTick = performance.now();
  updatePlayButton();
});
book.addEventListener("mouseenter", () => {
  hovering = true;
});
book.addEventListener("mouseleave", () => {
  hovering = false;
  lastTick = performance.now();
});
document.addEventListener("visibilitychange", () => {
  lastTick = performance.now();
});
setInterval(() => {
  const now = performance.now();
  const elapsed = now - lastTick;
  lastTick = now;
  if (
    !autoEnabled ||
    document.hidden ||
    !ready ||
    hovering ||
    document.querySelector("dialog[open]") ||
    book.contains(document.activeElement)
  )
    return;
  remaining -= elapsed;
  if (remaining <= 0) takeNext();
  get("countdown").textContent = `${Math.max(0, Math.ceil(remaining / 1000))}s`;
}, 200);
updatePlayButton();
if (active.images.length) render(active.id);

let selectedTag = "all";
const search = get<HTMLInputElement>("search");
const cards = [...document.querySelectorAll<HTMLElement>(".entry-card")];
function filterEntries() {
  const query = search.value.normalize("NFKC").trim().toLocaleLowerCase();
  let count = 0;
  for (const card of cards) {
    const tags: string[] = JSON.parse(card.dataset.tags!);
    const matches =
      (selectedTag === "all" || tags.includes(selectedTag)) &&
      card.dataset
        .search!.normalize("NFKC")
        .toLocaleLowerCase()
        .includes(query);
    card.hidden = !matches;
    if (matches) count++;
  }
  get("empty-message").hidden = count > 0;
  get("filter-status").textContent = `找到 ${count} 条记录`;
}
document.querySelectorAll<HTMLButtonElement>(".filter").forEach((button) => {
  button.addEventListener("click", () => {
    selectedTag = button.dataset.tag!;
    document.querySelectorAll(".filter").forEach((item) => {
      item.classList.toggle("active", item === button);
      item.setAttribute("aria-pressed", String(item === button));
    });
    filterEntries();
  });
});
search.addEventListener("input", filterEntries);
document
  .querySelectorAll<HTMLButtonElement>(".open-entry")
  .forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.id!;
      history = history.slice(0, historyIndex + 1);
      if (active.id !== id) history.push(id);
      historyIndex = history.length - 1;
      queue = shuffle(
        entries.filter((entry) => entry.id !== id).map((entry) => entry.id),
      );
      render(id);
      get("book").scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    });
  });

get("open-submission").addEventListener("click", () => dialog.showModal());
get("close-submission").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (
    event.target === dialog &&
    event.clientX < dialog.getBoundingClientRect().left
  )
    dialog.close();
});
dialog.addEventListener("close", () => {
  lastTick = performance.now();
});
const form = get<HTMLFormElement>("submission-form");
function draftText() {
  const text = get<HTMLTextAreaElement>("submission-text").value.trim();
  const source = get<HTMLInputElement>("submission-source").value.trim();
  const tags = get<HTMLInputElement>("submission-tags").value.trim();
  return {
    text,
    source,
    body: `### 笑话正文\n${text || "（请在此处补充图片）"}\n\n### 原帖链接\n${source || "未填写"}\n\n### 标签建议\n${tags || "未填写"}`,
  };
}
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const draft = draftText();
  const error = get("submission-error");
  if (!draft.text && !draft.source) {
    error.textContent =
      "写下一点内容，或填入原帖链接。图片可在 GitHub 页面添加。";
    return;
  }
  const url = new URL(`${repoUrl}/issues/new`);
  url.searchParams.set("template", "blank");
  url.searchParams.set(
    "title",
    `[投稿] ${draft.text.slice(0, 32) || "一笔新的仇恨"}`,
  );
  url.searchParams.set("body", draft.body);
  if (url.href.length > 7000) {
    error.textContent =
      "正文较长，请先复制投稿文字，再到 GitHub 新建 Issue 粘贴。";
    return;
  }
  error.textContent = "";
  window.open(url.href, "_blank", "noopener,noreferrer");
});
get("copy-draft").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(draftText().body);
    showToast("投稿文字已复制。");
  } catch {
    get("submission-error").textContent =
      "浏览器未允许复制，请选中正文手动复制。";
  }
});
document.querySelectorAll<HTMLButtonElement>(".dwarf").forEach((button) => {
  button.addEventListener("click", () => {
    get("dwarf-speech").textContent = button.dataset.speech!;
    button.classList.remove("jump");
    void button.offsetWidth;
    button.classList.add("jump");
  });
});

function openImage(image: HTMLImageElement) {
  const viewer = document.createElement("dialog");
  viewer.className = "lightbox";
  viewer.setAttribute("aria-label", image.alt);
  const close = document.createElement("button");
  close.textContent = "×";
  close.setAttribute("aria-label", "关闭大图");
  close.addEventListener("click", () => viewer.close());
  const full = new Image();
  full.src = image.src;
  full.alt = image.alt;
  viewer.append(close, full);
  viewer.addEventListener("close", () => {
    viewer.remove();
    lastTick = performance.now();
  });
  viewer.addEventListener("click", (event) => {
    if (event.target === viewer) viewer.close();
  });
  document.body.append(viewer);
  viewer.showModal();
}
