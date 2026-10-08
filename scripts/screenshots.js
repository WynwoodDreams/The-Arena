// Captures a thumbnail for every project in board/portfolio.json from its first link.
// Usage: npm run screenshots            (all projects)
//        npm run screenshots -- emriders (one project id)
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const root = path.join(__dirname, "..", "board");
const file = path.join(root, "portfolio.json");
const only = process.argv.slice(2);

(async () => {
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const browser = await chromium.launch();
  for (const [id, p] of Object.entries(data.items)) {
    if (only.length && !only.includes(id)) continue;
    const link = (p.links || [])[0];
    if (!link || !/^https?:\/\//.test(link.url)) { console.log(`skip ${id}: no link`); continue; }
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    try {
      await page.goto(link.url, { waitUntil: "networkidle", timeout: 45000 });
      await page.waitForTimeout(1500);
      const dest = path.join(root, "thumbs", `${id}.jpg`);
      await page.screenshot({ path: dest, type: "jpeg", quality: 84, clip: { x: 0, y: 0, width: 1440, height: 900 } });
      console.log(`saved ${path.relative(process.cwd(), dest)}`);
    } catch (e) {
      console.log(`failed ${id}: ${e.message.split("\n")[0]}`);
    } finally {
      await page.close();
    }
  }
  await browser.close();
})();
