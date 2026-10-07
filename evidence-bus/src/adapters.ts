import type { EvidenceBus } from './service.js';
import type { Principal } from './model.js';
/** Principal MUST come from verified server session claims, never browser input. */
export function reviewerAdapters(bus: EvidenceBus, session: Principal) {
  const principal=structuredClone(session);
  return Object.freeze({
    current:(system?:string,domain?:string)=>bus.projection(principal,system,domain),
    evidence:(system:string)=>bus.projection(principal,system),
    changes:(since?:string,system?:string)=>bus.feed(principal,since,system),
    maturityHistory:(system:string)=>bus.feed(principal,undefined,system),
    domainSnapshot:(domain:string)=>bus.projection(principal,undefined,domain),
    copilotContext:(system?:string,since?:string)=>bus.copilot(principal,system,since)
  });
}
