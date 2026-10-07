import { configured } from './config.js';
import { createApp } from './server.js';
import type { AddressInfo } from 'node:net';
const {bus,store,authenticate}=configured();
await store.pool.query('SELECT 1 FROM bus_events LIMIT 0');
const server=createApp(bus,authenticate);
server.listen(Number(process.env.PORT ?? 4318),process.env.HOST ?? '127.0.0.1',()=>process.stdout.write(JSON.stringify({service:'evidence-bus',event:'listening',port:(server.address() as AddressInfo).port})+'\n'));
for (const signal of ['SIGINT','SIGTERM'] as const) process.on(signal,()=>{server.close(()=>{void store.pool.end();});});
