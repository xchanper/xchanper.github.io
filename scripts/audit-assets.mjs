import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentDir = path.join(root, "content");
const publicDir = path.join(root, "public");
const auditedDirs = ["img", "assets"];

const refs = new Map();

for (const file of [
  ...walk(contentDir).filter((item) => item.endsWith(".md")),
  path.join(root, "scripts", "build.mjs"),
]) {
  const text = fs.readFileSync(file, "utf8");

  for (const match of text.matchAll(/!\[[^\]]*]\(([^)]+)\)/g)) {
    addRef(normalizeAssetRef(match[1]), file);
  }

  for (const match of text.matchAll(/\b(?:src|href)=["']([^"']+)["']/gi)) {
    addRef(normalizeAssetRef(match[1]), file);
  }

  for (const match of text.matchAll(/["'`]((?:\/)?(?:img|assets)\/[^"'`)\s]+)["'`]/g)) {
    addRef(normalizeAssetRef(match[1]), file);
  }

  for (const match of text.matchAll(/(?:^|[\s:[{,])((?:\/)?(?:img|assets)\/[^\s"'`)\]}>,]+)/gm)) {
    addRef(normalizeAssetRef(match[1]), file);
  }
}

const publicFiles = auditedDirs
  .flatMap((dir) => walk(path.join(publicDir, dir)))
  .filter((file) => fs.statSync(file).isFile())
  .map((file) => path.relative(publicDir, file).split(path.sep).join("/"))
  .sort();

const missing = [...refs.keys()]
  .filter((ref) => !fs.existsSync(path.join(publicDir, ref)))
  .sort();

const unused = publicFiles
  .filter((file) => file.endsWith(".DS_Store") || !refs.has(file))
  .sort();

printSection("Missing assets", missing);
printSection("Unused assets", unused);

console.log(`Checked ${refs.size} referenced assets against ${publicFiles.length} files in public/{${auditedDirs.join(",")}}.`);

if (missing.length) {
  process.exitCode = 1;
}

function addRef(ref, file) {
  if (!ref) return;
  if (!refs.has(ref)) refs.set(ref, []);
  refs.get(ref).push(path.relative(root, file));
}

function normalizeAssetRef(url) {
  if (!url || /^(https?:|\/\/|data:|blob:|#|mailto:)/i.test(url)) return null;

  let ref = url.trim();
  const legacyPrefix = "../../src/.vuepress/public/";

  if (ref.startsWith(legacyPrefix)) {
    ref = `/${ref.slice(legacyPrefix.length)}`;
  } else if (ref.startsWith("./img/")) {
    ref = `/${ref.slice(2)}`;
  } else if (ref.startsWith("./assets/")) {
    ref = `/${ref.slice(2)}`;
  } else if (ref.startsWith("img/")) {
    ref = `/${ref}`;
  } else if (ref.startsWith("assets/")) {
    ref = `/${ref}`;
  }

  if (!ref.startsWith("/img/") && !ref.startsWith("/assets/")) return null;

  ref = ref.split("#")[0].split("?")[0];

  try {
    ref = decodeURI(ref);
  } catch {
    // Keep the original string; the build will still catch missing files.
  }

  return ref.slice(1);
}

function printSection(title, items) {
  if (!items.length) {
    console.log(`${title}: 0`);
    return;
  }

  console.log(`${title}: ${items.length}`);
  for (const item of items) {
    console.log(`- ${item}`);
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}
