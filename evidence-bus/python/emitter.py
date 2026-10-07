"""SYNAPZ structured manifest emitter. Never parse prose as engineering evidence."""
import argparse
import hashlib
import hmac
import json
import math
import os
from pathlib import Path
import re
import ssl
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from datetime import datetime, timezone

from jsonschema import Draft7Validator, FormatChecker

ROOT = Path(__file__).resolve().parents[1]
SCHEMA = json.loads((ROOT / "schema/manifest-v1.json").read_text(encoding="utf-8"))
VALIDATOR = Draft7Validator(SCHEMA, format_checker=FormatChecker())
UNSAFE = re.compile(r"[A-Z]:[\\/]|/(?:Users|home|etc|var)/|[\w.+-]+@[\w.-]+\.[a-z]{2,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:gh[pousr]_[A-Za-z0-9]{20,}|AKIA[A-Z0-9]{16}|sk-[A-Za-z0-9]{20,})\b|(?:password|secret|api[_-]?key|access[_-]?token)\s*[:=]\s*\S+|</?[a-z][^>]*>|\x00", re.I)

def validate_manifest(manifest):
    if not VALIDATOR.is_valid(manifest):
        raise ValueError("schema_invalid")
    raw = json.dumps(manifest, ensure_ascii=False)
    if UNSAFE.search(raw) or ".." in raw or re.search(r'(?:__proto__|constructor|prototype)"\s*:', raw):
        raise ValueError("unsafe_content")
    emitted = datetime.fromisoformat(manifest["emittedAt"])
    observed = datetime.fromisoformat(manifest.get("observedAt", manifest["emittedAt"]))
    if observed > emitted:
        raise ValueError("observation_after_emission")
    for evidence in manifest["evidence"]:
        if "url" not in evidence:
            continue
        url = urllib.parse.urlsplit(evidence["url"])
        host = url.hostname or ""
        if url.scheme != "https" or url.username or url.password or url.port or url.query or url.fragment or "." not in host or re.fullmatch(r"[\d.]+", host) or ":" in host or host.endswith((".local", ".internal", ".localhost")):
            raise ValueError("unsafe_evidence_url")
    if manifest.get("tests", {}).get("failed", 0) and manifest["result"] == "pass":
        raise ValueError("inconsistent_test_result")
    if not math.isfinite(manifest.get("runtime", {}).get("paperEquity", 0)):
        raise ValueError("number_invalid")
    chain = manifest.get("blockchain", {})
    if manifest["maturity"] in ("PAPER", "SHADOW") and (manifest["risk"]["realExecution"] or chain.get("realFunds") or chain.get("custody")):
        raise ValueError("inconsistent_execution_boundary")
    env = manifest["environment"]
    if env in ("testnet", "local") and chain.get("network", "none") not in ("none", env):
        raise ValueError("inconsistent_network")
    if manifest["sourceSystem"] == "kyro" and chain.get("network", "none") != "none":
        raise ValueError("media_is_not_blockchain_evidence")
    return manifest

def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result or key in ("__proto__", "prototype", "constructor"):
            raise ValueError("json_ambiguous")
        result[key] = value
    return result

def read_manifest(path):
    return json.loads(Path(path).read_text(encoding="utf-8"), object_pairs_hook=unique_object)

def create_manifest(structured):
    manifest = dict(structured)
    manifest.update(schemaVersion="1.0", eventId=str(uuid.uuid4()), emittedAt=datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z"))
    return validate_manifest(manifest)

def prepare(manifest, secret, timestamp=None, nonce=None):
    validate_manifest(manifest)
    if len(secret) < 32:
        raise ValueError("signing_key_too_short")
    body = json.dumps(manifest, separators=(",", ":"), ensure_ascii=False, allow_nan=False).encode("utf-8")
    timestamp = timestamp or str(int(time.time() * 1000))
    nonce = nonce or str(uuid.uuid4())
    parts = ["SYNAPZ-EVIDENCE-V1", "POST", "/v1/ingest", manifest["sourceSystem"], manifest["signature"]["keyId"], timestamp, nonce, hashlib.sha256(body).hexdigest()]
    signature = hmac.new(secret.encode(), "\n".join(parts).encode(), hashlib.sha256).hexdigest()
    return body, {"Content-Type": "application/json", "X-Evidence-Source": manifest["sourceSystem"], "X-Evidence-Key": manifest["signature"]["keyId"], "X-Evidence-Timestamp": timestamp, "X-Evidence-Nonce": nonce, "X-Evidence-Signature": signature}

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ValueError("redirect_rejected")

def submit(manifest, endpoint, secret, dry_run=False):
    validate_manifest(manifest)
    if dry_run:
        return {"eventId": manifest["eventId"], "status": "dry_run", "decision": "not_submitted"}
    url = urllib.parse.urlsplit(endpoint)
    if url.username or url.password or url.query or url.fragment or url.path != "/v1/ingest" or (url.scheme != "https" and not (url.scheme == "http" and url.hostname in ("127.0.0.1", "localhost"))):
        raise ValueError("unsafe_ingest_endpoint")
    body, headers = prepare(manifest, secret)
    opener = urllib.request.build_opener(NoRedirect(), urllib.request.HTTPSHandler(context=ssl.create_default_context()))
    try:
        with opener.open(urllib.request.Request(endpoint, body, headers, method="POST"), timeout=10) as response:
            if response.status != 202:
                raise ValueError("ingest_response_invalid")
            value = json.loads(response.read(8192))
    except urllib.error.HTTPError as error:
        raise ValueError(f"ingest_rejected_{error.code}") from None
    if value.get("eventId") != manifest["eventId"] or value.get("status") not in ("needs_review", "auto_refreshed", "conflict") or value.get("decision") not in ("owner_review", "auto_refresh", "conflict"):
        raise ValueError("ingest_response_invalid")
    return value

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", nargs="?")
    parser.add_argument("--schema", action="store_true", help="Print language-neutral JSON Schema")
    parser.add_argument("--create", action="store_true", help="Assign fresh event ID and emission timestamp to structured input")
    parser.add_argument("--output")
    parser.add_argument("--send", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    if args.schema:
        print(json.dumps(SCHEMA, indent=2))
        return
    if not args.manifest:
        parser.error("manifest path required")
    data = read_manifest(args.manifest)
    manifest = create_manifest(data) if args.create else validate_manifest(data)
    if args.output:
        with open(args.output, "w", encoding="utf-8") as handle:
            os.chmod(args.output, 0o600)
            handle.write(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
    if args.send:
        result = submit(manifest, os.environ.get("EVIDENCE_INGEST_URL", ""), os.environ.get("EVIDENCE_SIGNING_KEY", ""), args.dry_run)
    else:
        result = {"eventId": manifest["eventId"], "status": "validated"}
    print(json.dumps(result))

if __name__ == "__main__":
    try:
        main()
    except (ValueError, OSError, KeyError):
        # Never echo user-supplied data, secrets or URLs in CLI errors.
        raise SystemExit("Emitter failed; validate configuration and structured input.") from None
