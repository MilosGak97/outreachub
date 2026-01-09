const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const source = path.join(rootDir, 'node_modules', 'redoc', 'bundles', 'redoc.standalone.js');
const docsDir = path.join(rootDir, 'docs');
const destination = path.join(docsDir, 'redoc.standalone.js');

if (!fs.existsSync(source)) {
  console.warn('Redoc bundle not found, skipping docs copy.');
  process.exit(0);
}

fs.mkdirSync(docsDir, { recursive: true });
fs.copyFileSync(source, destination);
console.log('Redoc bundle copied to docs/redoc.standalone.js');
