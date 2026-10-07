import copy
import hashlib
import hmac
import json
from pathlib import Path
import unittest
from emitter import create_manifest, prepare, validate_manifest, submit, unique_object

class EmitterTests(unittest.TestCase):
    def setUp(self):
        self.manifest = json.loads((Path(__file__).resolve().parents[1] / "fixtures/prime.json").read_text(encoding="utf-8"))

    def test_create_assigns_event_and_time(self):
        m = create_manifest(self.manifest)
        self.assertNotEqual(m["eventId"], self.manifest["eventId"])
        self.assertEqual(m["limitations"], self.manifest["limitations"])

    def test_schema_additional_field(self):
        self.manifest["approved"] = True
        with self.assertRaises(ValueError):
            validate_manifest(self.manifest)

    def test_signature_protocol(self):
        secret = "synthetic-test-material-" * 3
        body, headers = prepare(self.manifest, secret, "1700000000000", "synthetic-nonce-12345")
        raw = "\n".join(["SYNAPZ-EVIDENCE-V1", "POST", "/v1/ingest", "prime", "prime-v1", "1700000000000", "synthetic-nonce-12345", hashlib.sha256(body).hexdigest()])
        self.assertEqual(headers["X-Evidence-Signature"], hmac.new(secret.encode(), raw.encode(), hashlib.sha256).hexdigest())

    def test_short_key(self):
        with self.assertRaises(ValueError):
            prepare(self.manifest, "short")

    def test_dry_run_no_network(self):
        self.assertEqual(submit(self.manifest, "", "", True)["status"], "dry_run")

    def test_unsafe_external_endpoint(self):
        with self.assertRaises(ValueError):
            submit(self.manifest, "http://example.com/v1/ingest", "synthetic-test-material-" * 3)

    def test_privacy_and_url_attacks(self):
        for value in ["<script>run</script>", "owner@example.com", "api_key=private-value", "C:\\Users\\private\\test"]:
            with self.subTest(value=value):
                m = copy.deepcopy(self.manifest)
                m["summary"] = value
                with self.assertRaises(ValueError):
                    validate_manifest(m)
        for value in ["javascript:alert(1)", "https://127.0.0.1/private", "https://evidence.example/x?token=value"]:
            m = copy.deepcopy(self.manifest)
            m["evidence"][0]["url"] = value
            with self.assertRaises(ValueError):
                validate_manifest(m)

    def test_all_source_fixtures(self):
        for file in (Path(__file__).resolve().parents[1] / "fixtures").glob("*.json"):
            with self.subTest(source=file.stem):
                self.assertTrue(validate_manifest(json.loads(file.read_text(encoding="utf-8")))["synthetic"])

    def test_ambiguous_json(self):
        for raw in ['{"x":1,"x":2}', '{"x":1,"\\u0078":2}', '{"__proto__":{}}']:
            with self.assertRaises(ValueError):
                json.loads(raw, object_pairs_hook=unique_object)

    def test_invalid_datetime_and_nonfinite_number(self):
        m = copy.deepcopy(self.manifest)
        m["emittedAt"] = "invalidZ"
        with self.assertRaises(ValueError):
            validate_manifest(m)
        m = copy.deepcopy(self.manifest)
        m["runtime"] = {"state": "healthy", "positions": 0, "orders": 0, "paperEquity": float("nan")}
        with self.assertRaises(ValueError):
            validate_manifest(m)

if __name__ == "__main__":
    unittest.main()
