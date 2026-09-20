import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const svg = readFileSync("/workspace/public/favicon.svg", "utf8");
const htmlPath = "/workspace/.grok/favicon-preview.html";
writeFileSync(
  htmlPath,
  `<!doctype html>
<html><head><style>
  body { margin:0; background:#3a3d42; }
  .row { display:flex; gap:24px; padding:24px; align-items:flex-end; }
  .box { display:flex; flex-direction:column; align-items:center; gap:6px; color:#eceae4; font:12px sans-serif; }
  .box > div svg { width:100%; height:100%; display:block; }
</style></head>
<body>
<div class="row">
  <div class="box"><div style="width:16px;height:16px">${svg}</div>16</div>
  <div class="box"><div style="width:32px;height:32px">${svg}</div>32</div>
  <div class="box"><div style="width:64px;height:64px">${svg}</div>64</div>
</div>
</body></html>`,
);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 400, height: 160 } });
await page.goto(pathToFileURL(htmlPath).href);
await page.screenshot({ path: "/workspace/.grok/favicon-preview.png" });
await browser.close();
console.log("wrote preview");
