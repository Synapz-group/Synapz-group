import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
export const root = new URL(existsSync(new URL('../schema', import.meta.url)) ? '../' : '../../', import.meta.url);
export const asset = (path: string) => fileURLToPath(new URL(path, root));
