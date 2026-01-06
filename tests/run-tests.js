import { spawnSync } from 'child_process';

const tests = [
  'node tests/test-ehituskaup24.parse.test.js',
  'node tests/test-tooriistamaailm.parse.test.js',
  'node tests/test-impert24.parse.test.js',
  'node tests/test-inserv.parse.test.js',
  'node tests/test-krRauta.parse.test.js'
];
let failed = false;
for (const t of tests) {
  console.log('Running:', t);
  const r = spawnSync(t, { shell: true, stdio: 'inherit' });
  if (r.status !== 0) failed = true;
}
process.exit(failed ? 1 : 0);
