import { readdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
const failures = [];
async function files(dir) {
  const all = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) all.push(...(await files(p)));
    else all.push(p);
  }
  return all;
}
const patterns = [
  [
    "credential material",
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:ghp_|github_pat_|sk_live_|AKIA)[a-zA-Z0-9_]{16,}/,
  ],
  ["local path", /[A-Z]:\\(?:Users|private)\\|\/(?:home|Users)\/[a-zA-Z]/],
  ["private repository", /https?:\/\/(?:github|gitlab)\.com\//],
  ["owner email", /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i],
  [
    "internal endpoint",
    /https?:\/\/(?:localhost|127\.0\.0\.1|10\.\d|192\.168\.)/,
  ],
  ["transaction/address material", /\b0x[a-fA-F0-9]{40,}\b/],
  ["unfinished implementation marker", /\bTODO\b|\bFIXME\b|\bPLACEHOLDER\b/],
  [
    "unsafe HTML or write API",
    /dangerouslySetInnerHTML|\beval\(|eth_sendTransaction|signTransaction|sendRawTransaction|wallet\.connect/,
  ],
];
const targets = [...(await files("src")), ...(await files("dist"))];
for (const path of targets) {
  const text = await readFile(path, "utf8");
  for (const [name, pattern] of patterns) {
    // React DOM contains the feature name dangerouslySetInnerHTML even when the
    // application never uses it. Still scan all application source for that API,
    // and scan built output for every executable wallet/write API independently.
    const effective =
      path.startsWith("dist/") && name === "unsafe HTML or write API"
        ? /\beval\(|eth_sendTransaction|signTransaction|sendRawTransaction|wallet\.connect/
        : pattern;
    if (effective.test(text)) failures.push(`${path}: ${name}`);
  }
}
// Inspect the serialized fixture projection as well as source and built output.
const require = createRequire(import.meta.url);
const esbuild = require("esbuild");
const compiled = await esbuild.build({
  entryPoints: ["src/showcase/demo.ts"],
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
});
const fixtureModule = await import(
  `data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString("base64")}`
);
const data = await fixtureModule.demoAdapter.listVisibleEvidence({
  mode: "current_proof",
  reviewerTier: "reviewer",
  ownerPreview: false,
  currentSection: "system",
});
for (const [name, pattern] of patterns) {
  if (pattern.test(JSON.stringify(data)))
    failures.push(`demo projection: ${name}`);
}
const entry = await readFile("src/showcase/index.ts", "utf8");
if (/from ['"].*demo/.test(entry))
  failures.push("host entry imports demo data");
const handoff = await readFile(
  "docs/solana-foundation-showcase/REPLIT_HANDOFF.md",
  "utf8",
);
for (const required of [
  "Files to import",
  "Dependencies",
  "/solana-showcase",
  "Navigation",
  "Adapter",
  "approved",
  "published",
  "Copilot",
  "Owner preview",
  "CSS",
  "Environment",
  "Post-integration tests",
])
  if (!handoff.includes(required))
    failures.push(`handoff missing: ${required}`);
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(
  `PASS: secret/marker/privacy scan (${targets.length} source/build files + ${data.length} serialized demo records); host export isolation; Replit handoff completeness.`,
);
