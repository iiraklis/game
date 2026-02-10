import fs from "fs";
import path from "path";
import { chromium } from "playwright";

function isGameDir(name) {
  return /^game\d+$/.test(name);
}
function gameNumber(name) {
  const m = name.match(/^game(\d+)$/);
  return m ? parseInt(m[1], 10) : -1;
}

const root = process.cwd();
const dirs = fs.readdirSync(root, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)
  .filter(isGameDir)
  .sort((a, b) => gameNumber(a) - gameNumber(b));

if (dirs.length === 0) {
  console.log("No game directories found.");
  process.exit(0);
}

let target = null;
for (let i = dirs.length - 1; i >= 0; i--) {
  const g = dirs[i];
  const indexPath = path.join(root, g, "index.html");
  const previewPath = path.join(root, g, "preview.png");
  if (fs.existsSync(indexPath) && !fs.existsSync(previewPath)) {
    target = g;
    break;
  }
}

if (!target) {
  console.log("All games already have preview.png");
  process.exit(0);
}

const gameDir = path.join(root, target);
const indexFile = path.join(gameDir, "index.html");
const previewFile = path.join(gameDir, "preview.png");

const fileUrl = "file://" + indexFile;

console.log("Generating preview for:", target);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

await page.goto(fileUrl, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);

await page.screenshot({ path: previewFile, fullPage: true });

await browser.close();
console.log("Saved:", previewFile);
