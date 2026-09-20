from playwright.sync_api import sync_playwright
from pathlib import Path

svg = Path("/workspace/public/favicon.svg").read_text()
page_path = Path("/workspace/.grok/favicon-preview.html")
page_path.write_text(
    """<!doctype html>
<html><head><style>
  body { margin:0; background:#3a3d42; }
  .row { display:flex; gap:24px; padding:24px; align-items:flex-end; }
  .box { display:flex; flex-direction:column; align-items:center; gap:6px; color:#eceae4; font:12px sans-serif; }
  .box > div svg { width:100%; height:100%; display:block; }
</style></head>
<body>
<div class="row">
  <div class="box"><div style="width:16px;height:16px">"""
    + svg
    + """</div>16</div>
  <div class="box"><div style="width:32px;height:32px">"""
    + svg
    + """</div>32</div>
  <div class="box"><div style="width:64px;height:64px">"""
    + svg
    + """</div>64</div>
</div>
</body></html>"""
)

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 400, "height": 160})
    page.goto(page_path.as_uri())
    page.screenshot(path="/workspace/.grok/favicon-preview.png")
    browser.close()
print("wrote /workspace/.grok/favicon-preview.png")
