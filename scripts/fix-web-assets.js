/**
 * Vercel ignores node_modules paths in static deploys.
 * This script renames dist/assets/node_modules → dist/assets/vendor
 * and updates all references in HTML/JS files.
 */
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const assetsDir = path.join(distDir, 'assets');
const nmDir = path.join(assetsDir, 'node_modules');
const vendorDir = path.join(assetsDir, 'vendor');

if (!fs.existsSync(nmDir)) {
  console.log('No node_modules in dist/assets — nothing to fix.');
  process.exit(0);
}

// Rename node_modules → vendor
if (fs.existsSync(vendorDir)) {
  fs.rmSync(vendorDir, { recursive: true });
}
fs.renameSync(nmDir, vendorDir);
console.log('Renamed dist/assets/node_modules → dist/assets/vendor');

// Update references in all HTML and JS files
function fixRefs(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      fixRefs(full);
    } else if (/\.(html|js)$/.test(entry.name)) {
      let content = fs.readFileSync(full, 'utf8');
      if (content.includes('/assets/node_modules/')) {
        content = content.replaceAll('/assets/node_modules/', '/assets/vendor/');
        fs.writeFileSync(full, content);
        console.log('Fixed refs in', path.relative(distDir, full));
      }
    }
  }
}

fixRefs(distDir);
console.log('Done.');
