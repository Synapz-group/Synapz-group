import { configured } from './config.js';
const {store}=configured();
try {await store.migrate();process.stdout.write('Migration applied\n');} finally {await store.pool.end();}
