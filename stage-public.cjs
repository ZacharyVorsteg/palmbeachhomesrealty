const fs = require('node:fs');
const path = require('node:path');
const entries = ["404.html", "apple-touch-icon.png", "assets", "blog", "favicon.png", "googlea09d70eb2ac56a46.html", "index.html", "privacy.html", "robots.txt", "sitemap.xml", "styles.css", "terms.html"];
const out = path.join(__dirname, 'public');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const entry of entries) {
  fs.cpSync(path.join(__dirname, entry), path.join(out, entry), {
    recursive: true,
    filter(source) {
      if (fs.lstatSync(source).isSymbolicLink()) throw new Error('Symlink in public output');
      const name = path.basename(source);
      return !name.startsWith('_') && !name.startsWith('.') && !/\.(?:md|env|toml|sql|test\.js)$/.test(name);
    },
  });
}
console.log(`Staged ${entries.length} public entries.`);
