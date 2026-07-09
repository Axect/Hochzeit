import { readdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist', import.meta.url));

const cleanOriginals = async (dir: string): Promise<void> => {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const path = `${dir}/${entry.name}`;
    if (entry.name === '_originals') {
      await rm(path, { recursive: true, force: true });
      continue;
    }

    await cleanOriginals(path);
  }
};

await cleanOriginals(root);
