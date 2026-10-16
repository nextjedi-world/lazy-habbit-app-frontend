// Writes src/environments/environment.ts (and environment.prod.ts) from environment.example.ts
// when they are missing, so a fresh clone or CI can build without secrets. Existing files are
// never touched: they are git-ignored and hold the real Supabase values.
import { copyFileSync, existsSync } from 'node:fs';

const dir = 'src/environments';
const example = `${dir}/environment.example.ts`;
for (const name of ['environment.ts', 'environment.prod.ts']) {
  const target = `${dir}/${name}`;
  if (!existsSync(target)) {
    copyFileSync(example, target);
    console.log(`ensure-env: wrote ${target} from environment.example.ts (placeholder values)`);
  }
}
