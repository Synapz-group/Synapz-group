"""Emit the language-neutral v1 JSON Schema; runtime consumes the checked-in JSON."""
import json
from pathlib import Path

def text(maximum=1000, pattern=None):
    result = {"type": "string", "minLength": 1, "maxLength": maximum}
    if pattern:
        result["pattern"] = pattern
    return result

def enum(*values):
    return {"type": "string", "enum": list(values)}

def obj(properties, optional=()):
    return {"type": "object", "additionalProperties": False, "properties": properties,
            "required": [key for key in properties if key not in optional]}

def array(items, minimum=0, maximum=50):
    return {"type": "array", "items": items, "minItems": minimum, "maxItems": maximum, "uniqueItems": True}

boolean = {"type": "boolean"}
count = {"type": "integer", "minimum": 0, "maximum": 10000000}
key = text(100, r"^[a-zA-Z0-9][a-zA-Z0-9_.-]*$")
date = {"type": "string", "format": "date-time", "pattern": r"Z$"}
tier = enum("public", "partner", "restricted")
schema = obj({
    "schemaVersion": {"const": "1.0"}, "eventId": {"type": "string", "format": "uuid"},
    "sourceSystem": key, "sourceRepoSafeKey": key, "sourceType": enum("ci", "supervisor", "deployment", "manual"),
    "branch": text(120, r"^[a-zA-Z0-9][a-zA-Z0-9_./-]*$"), "commitSha": text(40, r"^[0-9a-f]{40}$"),
    "emittedAt": date, "observedAt": date,
    "environment": enum("local", "development", "testnet", "staging", "production"),
    "maturity": enum("VERIFIED", "QUALIFIED", "DEPLOYED", "TESTNET", "PAPER", "SHADOW", "DEVELOPMENT", "PROTOTYPE", "PLANNED", "TARGET", "INTEGRATION_IN_PROGRESS"),
    "result": enum("pass", "fail", "partial", "pending"), "title": text(160), "summary": text(2000),
    "evidence": array(obj({"type": enum("test_report", "build_report", "runtime_evidence", "deployment_observation", "transaction_receipt", "security_scan", "dependency_audit", "supervisor_completion", "generated_artifact", "documentation", "human_review_required"),
                            "artifactKey": key, "sha256": text(64, r"^[0-9a-f]{64}$"), "summary": text(),
                            "url": text(500, r"^https://[a-zA-Z0-9.-]+/[^\s]*$")}, ("url",)), 1),
    "tests": obj({"passed": count, "failed": count, "skipped": count, "subtests": count}),
    "build": obj({"status": enum("pass", "fail", "pending"), "artifactKey": key}),
    "deployment": obj({"state": enum("none", "observed", "deployed"), "providerLive": boolean, "liveJobs": count}),
    "runtime": obj({"state": enum("healthy", "degraded", "stopped", "unknown"), "positions": count, "orders": count,
                    "paperEquity": {"type": "number", "minimum": 0, "maximum": 1e12}}, ("paperEquity",)),
    "blockchain": obj({"network": enum("none", "local", "testnet", "mainnet"), "signing": boolean, "broadcast": boolean,
                       "realFunds": boolean, "custody": boolean, "addresses": array(key)}),
    "limitations": array(text(), 1), "nextSteps": array(text()), "tags": array(key), "relationships": array(key),
    "disclosureClass": tier, "autoPublishEligible": boolean, "synthetic": boolean,
    "risk": obj({name: boolean for name in ("regulatory", "namedParties", "commercial", "sensitive", "realExecution")}),
    "supersedes": {"type": "string", "format": "uuid"}, "correlationId": key,
    "signature": obj({"algorithm": {"const": "hmac-sha256"}, "keyId": key})
}, ("observedAt", "tests", "build", "deployment", "runtime", "blockchain", "supersedes", "correlationId"))
schema.update({"$schema": "http://json-schema.org/draft-07/schema#", "$id": "https://schemas.synapz.example/evidence/v1.json", "title": "SYNAPZ Evidence Manifest v1"})
Path("schema/manifest-v1.json").write_text(json.dumps(schema, indent=2) + "\n", encoding="utf-8")
