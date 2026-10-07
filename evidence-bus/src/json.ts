import { BusError } from './validation.js';
/** Reject ambiguous duplicate keys rather than inheriting JSON.parse's last-key-wins behavior. */
export function strictJson(body: string): unknown {
  let value: unknown;
  try {value=JSON.parse(body);}catch{throw new BusError('json_invalid');}
  const stack: {object:boolean;key:boolean;keys:Set<string>}[]=[];
  const tokens=body.match(/"(?:\\.|[^"\\])*"|[{}[\]:,]|true|false|null|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g) ?? [];
  for(const token of tokens){
    const top=stack.at(-1);
    if(token==='{' || token==='[')stack.push({object:token==='{',key:token==='{',keys:new Set()});
    else if(token==='}' || token===']')stack.pop();
    else if(token===',' && top?.object)top.key=true;
    else if(token===':' && top?.object)top.key=false;
    else if(token.startsWith('"') && top?.object && top.key){const key=JSON.parse(token) as string;if(top.keys.has(key) || ['__proto__','prototype','constructor'].includes(key))throw new BusError('json_ambiguous');top.keys.add(key);}
  }
  return value;
}
