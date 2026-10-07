import type { Source } from './model.js';
import type { Credential } from './server.js';
import pg from 'pg';
import { Store } from './store.js';
import { EvidenceBus } from './service.js';
import { bearerAuth } from './server.js';
export function configured() {
  const database=process.env.DATABASE_URL, sources=process.env.EVIDENCE_SOURCES_JSON, credentials=process.env.EVIDENCE_AUTH_JSON;
  if (!database || !sources || !credentials) throw new Error('missing_server_configuration');
  const sourceList=JSON.parse(sources) as Source[], authList=JSON.parse(credentials) as Credential[];
  if (!Array.isArray(sourceList) || !sourceList.length || !Array.isArray(authList) || !authList.length) throw new Error('empty_server_configuration');
  const store=new Store(new pg.Pool({connectionString:database,max:10,connectionTimeoutMillis:5000,statement_timeout:10000}));
  return { store, bus:new EvidenceBus(store,sourceList), authenticate:bearerAuth(authList) };
}
