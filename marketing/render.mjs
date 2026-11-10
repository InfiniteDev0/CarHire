// Renders every promo design in templates/promo.html to marketing/promo/*.png
// using a locally installed Chromium browser (Edge or Chrome) in headless mode.
//
//   node marketing/render.mjs
//
// Needs internet access the first time so the Outfit font can load.
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, "promo");
mkdirSync(outDir, { recursive: true });

const DESIGNS = [
  ["status-launch", 1080, 1920],
  ["status-features", 1080, 1920],
  ["status-pricing", 1080, 1920],
  ["square-launch", 1080, 1080],
  ["square-features", 1080, 1080],
  ["square-free", 1080, 1080],
  ["og", 1200, 630],
  ["cover-wide", 1640, 624],
  ["cover-linkedin", 1128, 191],
  ["profile", 800, 800],
];

const browser = [
  process.env.BROWSER_PATH,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].find((p) => p && existsSync(p));
if (!browser) throw new Error("No Chromium browser found — set BROWSER_PATH.");

const template = pathToFileURL(path.join(here, "templates", "promo.html")).href;

for (const [name, w, h] of DESIGNS) {
  const out = path.join(outDir, `${name}-${w}x${h}.png`);
  execFileSync(
    browser,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      `--window-size=${w},${h}`,
      "--virtual-time-budget=8000",
      `--screenshot=${out}`,
      `${template}?d=${name}`,
    ],
    { stdio: "ignore" },
  );
  console.log("rendered", path.basename(out));
}

// The link-preview image is also served by the website.
copyFileSync(path.join(outDir, "og-1200x630.png"), path.join(here, "..", "public", "og.png"));
console.log("copied og image to public/og.png");
