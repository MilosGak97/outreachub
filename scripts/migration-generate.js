const { spawnSync } = require('node:child_process');
const path = require('node:path');

const args = process.argv.slice(2);
const nameIndex = args.findIndex((arg) => arg === '-n' || arg === '--name');
const name = nameIndex >= 0 ? args[nameIndex + 1] : null;

if (!name) {
  console.error('Usage: npm run migration:generate -- -n CreateFilterPreset');
  process.exit(1);
}

const binPath = path.resolve(__dirname, '..', 'node_modules', '.bin', 'typeorm-ts-node-commonjs');
const result = spawnSync(
  binPath,
  ['migration:generate', `src/migrations/${name}`, '-d', 'src/data-source.ts'],
  { stdio: 'inherit' },
);

process.exit(result.status ?? 1);
