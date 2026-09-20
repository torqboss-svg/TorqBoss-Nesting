import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const OUT = "/workspace/.grok";
mkdirSync(OUT, { recursive: true });

const mark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <rect width="100" height="100" fill="#d7dbe0"/>
  <polygon points="50,16 84,86 16,86" fill="#0c0d0e"/>
  <polygon points="50,36 71,80 29,80" fill="#5f7d74"/>
</svg>`;

function htmlFor(size) {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  html, body { margin: 0; width: ${size}px; height: ${size}px; background: #d7dbe0; overflow: hidden; }
  svg { display: block; width: ${size}px; height: ${size}px; }
</style>
</head>
<body>${mark}</body>
</html>`;
}

const sizes = [
  { size: 180, file: "icon-180.png.tmp" },
  { size: 192, file: "icon-192.png.tmp" },
  { size: 512, file: "icon-512.png.tmp" },
];

const browser = await chromium.launch();
for (const { size, file } of sizes) {
  const htmlPath = `${OUT}/icon-${size}.html`;
  writeFileSync(htmlPath, htmlFor(size));
  const page = await browser.newPage({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  });
  await page.goto(pathToFileURL(htmlPath).href);
  await page.screenshot({
    path: `${OUT}/${file}`,
    type: "png",
    clip: { x: 0, y: 0, width: size, height: size },
    omitBackground: false,
  });
  await page.close();
  console.log("wrote", file);
}
await browser.close();
