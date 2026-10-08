import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  architecture,
  brainNames,
  capacityDisclaimer,
  comparisonKeys,
  maturityLegend,
  noEvidence,
  primeSteps,
  solanaSteps,
  type CurrentEvidence,
  type Maturity,
  type Mode,
  type ShowcaseContext,
  type ShowcaseEvidenceAdapter,
} from "./model";
import {
  evidenceRevision,
  loadCachedEvidence,
  subscribeEvidence,
} from "./cache";
import { CompletionRoadmap, SolanaEngineering, WhySolana } from "./ReviewDepth";
import {
  Copilot,
  ShowcaseCopilotProvider,
  type CopilotBridge,
} from "./copilot";
import "./showcase.css";

export function MaturityBadge({ value }: { value: Maturity }) {
  return (
    <span
      className={`badge badge-${value.toLowerCase().replaceAll(" ", "-")}`}
      title={maturityLegend[value]}
    >
      {value}
      <span className="sr-only">: {maturityLegend[value]}</span>
    </span>
  );
}
const nav = [
  ["system", "The full system"],
  ["thinking", "PRIME thinking"],
  ["fabric", "Logical fabric"],
  ["solana-path", "Solana path"],
  ["comparison", "Current vs completed"],
  ["finished", "What will be finished"],
  ["why-solana", "Why Solana"],
  ["evidence", "Evidence"],
  ["copilot", "Copilot"],
];
function Flow({
  title,
  steps,
  onFocus,
}: {
  title: string;
  steps: readonly (readonly string[])[];
  onFocus?: (key: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const id = useId();
  return (
    <div className="flow">
      <div className="flow-steps" aria-label={title}>
        {steps.map((step, i) => (
          <button
            key={step[0]}
            aria-label={`${String(i + 1).padStart(2, "0")} ${step[0]}`}
            aria-pressed={i === index}
            aria-controls={id}
            onClick={() => {
              setIndex(i);
              if (step[2]) onFocus?.(step[2]);
            }}
          >
            <span>{String(i + 1).padStart(2, "0")}</span>
            {step[0]}
            <span aria-hidden="true">↓</span>
          </button>
        ))}
      </div>
      <div className="flow-explanation" id={id} aria-live="polite">
        <span className="ordinal">
          STAGE {index + 1} / {steps.length}
        </span>
        <h3>{steps[index][0]}</h3>
        <p>{steps[index][1]}</p>
        <MaturityBadge value="TARGET" />
        <p className="small">
          This flow explains the completed architecture. Published evidence
          below defines the current implementation scope.
        </p>
        <div className="flow-controls">
          <button disabled={index === 0} onClick={() => setIndex(index - 1)}>
            Previous stage
          </button>
          <button
            disabled={index === steps.length - 1}
            onClick={() => setIndex(index + 1)}
          >
            Next stage
          </button>
        </div>
      </div>
    </div>
  );
}
function EvidenceCard({
  record,
  onOpen,
}: {
  record: CurrentEvidence;
  onOpen: (key: string) => void;
}) {
  return (
    <article className="evidence-card">
      <div>
        <MaturityBadge value={record.maturity} />
        <span className="small">{record.domain}</span>
      </div>
      <h3>{record.title}</h3>
      <p>{record.summary}</p>
      <p className="small">
        Observed: {record.observedAt ?? "Not supplied"} · Verified:{" "}
        {record.verifiedAt ?? "Not supplied"}
      </p>
      <button onClick={() => onOpen(record.safeKey)}>
        Inspect evidence and limitations ↗
      </button>
    </article>
  );
}
export interface ShowcaseProps {
  adapter: ShowcaseEvidenceAdapter;
  reviewerTier?: string;
  ownerPreview?: boolean;
  pendingSummary?: {
    count: number;
    categories: readonly (
      "PRIME" | "Solana" | "Multichain" | "Issuance" | "Applications"
    )[];
  };
  copilotBridge?: CopilotBridge;
}
export function Showcase({
  adapter,
  reviewerTier = "reviewer",
  ownerPreview = false,
  pendingSummary,
  copilotBridge,
}: ShowcaseProps) {
  const revision = useSyncExternalStore(
    useCallback((listener) => subscribeEvidence(adapter, listener), [adapter]),
    useCallback(() => evidenceRevision(adapter), [adapter]),
  );
  const [mode, setMode] = useState<Mode>("full_vision");
  const [section, setSection] = useState("system");
  const [selected, setSelected] = useState<string>();
  const [contextNode, setContextNode] = useState<string>();
  const [opened, setOpened] = useState<string>();
  const [records, setEvidence] = useState<CurrentEvidence[]>([]);
  const [authority, setAuthority] = useState<{
    adapter: ShowcaseEvidenceAdapter;
    tier: string;
    revision: number;
    ownerPreview: boolean;
  }>();
  const evidence =
    authority?.adapter === adapter &&
    authority.tier === reviewerTier &&
    authority.revision === revision &&
    authority.ownerPreview === ownerPreview
      ? records
      : [];
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [prompt, setPrompt] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const context: ShowcaseContext = {
    reviewerTier,
    mode,
    ownerPreview,
    currentSection: section,
    selectedNode: contextNode,
  };
  useEffect(() => {
    let cancelled = false;
    loadCachedEvidence(adapter, {
      reviewerTier,
      ownerPreview,
      mode: "current_proof",
      currentSection: "system",
    })
      .then((records) => {
        if (!cancelled) {
          setEvidence(records);
          setAuthority({ adapter, tier: reviewerTier, revision, ownerPreview });
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setEvidence([]);
          setStatus("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [adapter, reviewerTier, ownerPreview, revision]);
  useEffect(() => {
    const readHash = () => {
      const hash = window.location.hash.slice(1);
      const key = hash === "roadmap" ? "finished" : hash;
      if (nav.some(([id]) => id === key)) {
        setSection(key);
        setOpened(undefined);
        setSelected(undefined);
        requestAnimationFrame(() =>
          document.getElementById(key)?.scrollIntoView(),
        );
      }
      const match = /^#evidence\/([a-z][a-z0-9-]{0,63})$/.exec(
        window.location.hash,
      );
      if (match) {
        setOpened(match[1]);
        setSelected(undefined);
      }
    };
    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, []);
  useEffect(() => {
    if (selected || opened) {
      previousFocus.current = document.activeElement as HTMLElement;
      dialog.current?.showModal();
    } else if (dialog.current?.open) {
      dialog.current.close();
      previousFocus.current?.focus();
    }
  }, [selected, opened]);
  const recordsFor = (key: string) =>
    evidence.filter(
      (r) =>
        r.relatedNodes.includes(key) ||
        (key === "brains" &&
          r.relatedNodes.some((k) =>
            architecture.some((n) => n.key === k && n.group === "brain"),
          )),
    );
  const currentNode = architecture.find((n) => n.key === selected);
  const currentRecord = evidence.find((r) => r.safeKey === opened);
  const close = () => {
    setSelected(undefined);
    setOpened(undefined);
    if (window.location.hash.startsWith("#evidence/"))
      history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
  };
  const openEvidence = (key: string) => {
    setSelected(undefined);
    setOpened(key);
  };
  const bridge: CopilotBridge = (payload) => {
    if (copilotBridge) copilotBridge(payload);
    else setPrompt(payload.prompt);
  };
  const mapNodes =
    mode === "full_vision"
      ? architecture
      : architecture.filter((n) => recordsFor(n.key).length > 0);
  return (
    <ShowcaseCopilotProvider bridge={bridge}>
      <div className="showcase">
        <a className="skip-link" href="#main">
          Skip to showcase
        </a>
        <header className="topbar">
          <a
            className="wordmark"
            href="#system"
            aria-label="SYNAPZ showcase home"
          >
            <span className="logo-mark" aria-hidden="true">
              S
            </span>
            SYNAPZ<span className="edition">TECHNICAL SHOWCASE</span>
          </a>
          <span className="read-only">READ-ONLY / NO EXECUTION</span>
        </header>
        <div className="shell">
          <aside className="sidebar">
            <p className="ordinal">SYSTEM INDEX</p>
            <nav aria-label="Showcase sections">
              {nav.map(([key, label], i) => (
                <a
                  key={key}
                  href={`#${key}`}
                  aria-current={section === key ? "location" : undefined}
                  onClick={() => setSection(key)}
                >
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  {label}
                </a>
              ))}
            </nav>
            <p className="sidebar-note">
              Architecture is a target.
              <br />
              Evidence defines the present.
            </p>
            <a href="#legend">Maturity vocabulary ↗</a>
          </aside>
          <main id="main">
            <div className="modebar">
              <div role="group" aria-label="Showcase mode">
                <button
                  aria-pressed={mode === "full_vision"}
                  onClick={() => setMode("full_vision")}
                >
                  FULL VISION
                </button>
                <button
                  aria-pressed={mode === "current_proof"}
                  onClick={() => setMode("current_proof")}
                >
                  CURRENT PROOF
                </button>
              </div>
              <span
                className={
                  adapter.dataLabel === "DEMO DATA ONLY"
                    ? "demo-label"
                    : "host-label"
                }
              >
                {adapter.dataLabel === "DEMO DATA ONLY"
                  ? "DEMO DATA ONLY"
                  : "HOST APPROVED EVIDENCE"}
              </span>
            </div>
            <p className="mode-description" role="status">
              {mode === "full_vision"
                ? "Complete target architecture. No target is a current implementation claim."
                : "Current evidence projection only. Unapproved or unpublished records are excluded by the host."}
            </p>
            {adapter.dataLabel === "DEMO DATA ONLY" && (
              <p className="demo-notice">
                Synthetic snapshots illustrate adapter behavior. They are not
                approved disclosure records or live engineering status.
              </p>
            )}
            {status === "error" && (
              <p role="alert" className="error">
                Evidence unavailable or unsafe. Current claims fail closed; no
                evidence is displayed.
              </p>
            )}
            {status === "loading" && (
              <p role="status">Loading authorized evidence…</p>
            )}
            {ownerPreview && (
              <aside className="pending">
                <strong>Newer engineering evidence awaiting approval</strong>
                {pendingSummary &&
                  Number.isSafeInteger(pendingSummary.count) &&
                  pendingSummary.count >= 0 && (
                    <span>
                      {" "}
                      · {pendingSummary.count} pending ·{" "}
                      {pendingSummary.categories
                        .filter((c) =>
                          [
                            "PRIME",
                            "Solana",
                            "Multichain",
                            "Issuance",
                            "Applications",
                          ].includes(c),
                        )
                        .join(", ")}
                    </span>
                  )}
              </aside>
            )}
            <section id="system" aria-labelledby="system-title">
              <div className="hero">
                <div>
                  <p className="ordinal">01 / ARCHITECTURE AT SYSTEM SCALE</p>
                  <h1 id="system-title" aria-label="THE FULL SYNAPZ SYSTEM">
                    THE FULL
                    <br />
                    SYNAPZ SYSTEM
                  </h1>
                  <p className="lede">
                    One governed intelligence fabric.
                    <br />
                    From objective to controlled outcome.
                  </p>
                </div>
                <div className="hero-aside">
                  <span className="small">
                    SOLANA FOUNDATION REVIEW EXPERIENCE
                  </span>
                  <p>
                    Full vision.
                    <br />
                    Current proof.
                    <br />
                    Explicit boundaries.
                  </p>
                  <span className="small">
                    Independent showcase. No Solana Foundation endorsement is
                    implied.
                  </span>
                </div>
              </div>
              <div
                className="architecture-map"
                aria-label="Interactive system architecture"
              >
                <div className="map-axis">
                  <span>SYNAPZ / OMEGA</span>
                  <span>INTELLIGENCE → CONTROL → INTEGRATION</span>
                </div>
                {(
                  ["control", "brain", "fabric", "solana", "domain"] as const
                ).map((group) => (
                  <div className={`map-layer layer-${group}`} key={group}>
                    <p className="layer-label">
                      {
                        {
                          control: "CENTRAL CONTROL PLANE",
                          brain: "SEVEN FUNCTIONAL STAGES",
                          fabric: "OPERATING FABRIC",
                          solana: "SOLANA INTEGRATION",
                          domain: "SYSTEM CAPABILITIES",
                        }[group]
                      }
                    </p>
                    <div className="node-row">
                      {mapNodes
                        .filter((n) => n.group === group)
                        .map((n) => (
                          <button
                            key={n.key}
                            aria-label={`${n.title} ${
                              mode === "full_vision"
                                ? "TARGET"
                                : recordsFor(n.key)
                                    .map((r) => r.maturity)
                                    .join(" ")
                            }`}
                            className={`map-node ${n.key === "prime" ? "prime-node" : ""}`}
                            onClick={() => {
                              setSelected(n.key);
                              setContextNode(n.key);
                              setOpened(undefined);
                              setSection("system");
                            }}
                          >
                            <span>{n.title}</span>
                            <span
                              className="node-state"
                              title={
                                mode === "full_vision"
                                  ? maturityLegend.TARGET
                                  : recordsFor(n.key)
                                      .map((r) => maturityLegend[r.maturity])
                                      .join(" ")
                              }
                            >
                              {mode === "full_vision"
                                ? "TARGET"
                                : recordsFor(n.key)
                                    .map((r) => r.maturity)
                                    .filter((v, i, a) => a.indexOf(v) === i)
                                    .join(" · ")}{" "}
                              <span aria-hidden="true">↗</span>
                            </span>
                          </button>
                        ))}
                    </div>
                    {mode === "current_proof" &&
                      !mapNodes.some((n) => n.group === group) && (
                        <p className="empty">{noEvidence}</p>
                      )}
                  </div>
                ))}
              </div>
              <p className="boundary">
                PRIME is the central governed intelligence/control plane. The
                seven brains are functional stages/modules, not seven
                personalities. Select a node for its role, maturity, limitations
                and remaining work.
              </p>
            </section>
            <>
              <section id="thinking">
                <div className="section-heading">
                  <span className="ordinal">02 / DECISION LIFECYCLE</span>
                  <h2>How PRIME Actually Thinks</h2>
                  <p>
                    TARGET lifecycle: work preparation, independent evaluation,
                    governance and execution are separate responsibilities. The
                    six TARGET brain stages are not claimed as deployed. Current
                    Proof is the separately authorized evidence feed;
                    qualification of governance does not qualify this full
                    pipeline.
                  </p>
                </div>
                <div className="brain-strip">
                  {brainNames.map((b) => (
                    <span key={b}>{b}</span>
                  ))}
                </div>
                <Flow title="PRIME ordered thinking flow" steps={primeSteps} />
                <p className="boundary">
                  Missing identity/policy/evidence/approval/simulation/signer
                  requirements fail closed. Specialists prepare work but do not
                  self-approve. Execution and evidence are distinct stages.
                </p>
              </section>
              <section id="fabric">
                <div className="section-heading">
                  <span className="ordinal">
                    03 / CAPACITY WITHOUT CONFUSION
                  </span>
                  <h2>How 1,024 Logical Nodes Work</h2>
                </div>
                <div className="capacity">
                  <div>
                    <p className="ordinal">TARGET CAPACITY</p>
                    <strong>1,024</strong>
                    <p>logical workers / architecture capacity</p>
                    <MaturityBadge value="TARGET" />
                  </div>
                  <div>
                    <p className="ordinal">PRESENT FABRIC</p>
                    {recordsFor("fabric").length ? (
                      recordsFor("fabric").map((r) => (
                        <EvidenceCard
                          key={r.safeKey}
                          record={r}
                          onOpen={openEvidence}
                        />
                      ))
                    ) : (
                      <p>{noEvidence}</p>
                    )}
                    <p>
                      Runtime counts must come from a dated authorized host
                      snapshot. They are never inferred from the capacity
                      target.
                    </p>
                  </div>
                </div>
                <p className="disclaimer">{capacityDisclaimer}</p>
                <p className="boundary">
                  TARGET architecture: every fabric mechanism below requires
                  scoped implementation and qualification evidence.
                </p>
                <div className="fabric-grid">
                  {[
                    [
                      "Logical workers & role-aware classes",
                      "Workers represent scoped capabilities. A class determines task eligibility, not unrestricted authority.",
                    ],
                    [
                      "Task claims & permissions",
                      "Target claims have an owner, lease, expiry and attempt identity. Permission ceilings limit tools, data and destinations even after routing; reassignment must never enlarge authority.",
                    ],
                    [
                      "Routing & isolation",
                      "PRIME routes eligible work; isolation separates roles, state and consequential execution.",
                    ],
                    [
                      "Registry & observation",
                      "The registry records workers, claims and observed health with freshness requirements.",
                    ],
                    [
                      "Health & failure detection",
                      "Health checks and missed-liveness signals detect failure; ambiguous state blocks consequential work.",
                    ],
                    [
                      "Reassignment / recovery",
                      "Recover eligible claims without duplicating effects; preserve failure and recovery receipts.",
                    ],
                    [
                      "Capacity scaling",
                      "Expand logical capacity only after isolation, backpressure, health and recovery qualification.",
                    ],
                  ].map(([title, text]) => (
                    <article key={title}>
                      <h3>{title}</h3>
                      <p>{text}</p>
                    </article>
                  ))}
                </div>
              </section>
              <section id="solana-path">
                <div className="section-heading">
                  <span className="ordinal">04 / CHAIN TO CONTROL PLANE</span>
                  <h2>Full Solana Integration Path</h2>
                  <p>
                    Geyser/event ingestion and read-only observation feed the
                    system. Governed execution is a separate target pathway.
                  </p>
                </div>
                <Flow
                  title="Solana integration flow"
                  steps={solanaSteps}
                  onFocus={(key) => setSection(`solana-path:${key}`)}
                />
                <SolanaEngineering />
                <div className="boundary">
                  Current Geyser/read-only/golden-path evidence is supplied by
                  the host. Target execution, multichain architecture and
                  production/mainnet deployment remain separate claims.
                  QUALIFIED ≠ DEPLOYED. TESTNET ≠ MAINNET. PAPER/SHADOW ≠ live
                  trading.
                </div>
              </section>
            </>
            <section id="comparison">
              <div className="section-heading">
                <span className="ordinal">05 / TWO DISTINCT ANSWERS</span>
                <h2>Current vs Completed</h2>
                <p>
                  What is evidenced today, and what the completed integration is
                  intended to do.
                </p>
              </div>
              <div
                className="comparison-table"
                role="region"
                aria-label="Current evidence versus completed integration target"
                tabIndex={0}
              >
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Subsystem</th>
                      <th scope="col">CURRENT EVIDENCE</th>
                      <th scope="col">COMPLETED INTEGRATION TARGET</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonKeys.map((key) => {
                      const n = architecture.find((n) => n.key === key);
                      return (
                        <tr key={key}>
                          <th scope="row">
                            {n?.title ?? "Seven brain functions"}
                          </th>
                          <td>
                            {recordsFor(key).length
                              ? recordsFor(key).map((r) => (
                                  <div key={r.safeKey}>
                                    <MaturityBadge value={r.maturity} />
                                    <p>{r.summary}</p>
                                    <button
                                      onClick={() => openEvidence(r.safeKey)}
                                    >
                                      Inspect {r.title}
                                    </button>
                                  </div>
                                ))
                              : noEvidence}
                          </td>
                          <td>
                            {mode === "full_vision" ? (
                              <>
                                <MaturityBadge value="TARGET" />
                                <p>
                                  {n?.role ??
                                    "Self-Model, Instinct Router, Simulation, Memory, Specialists, Evaluation and Governance integrated as functional stages inside PRIME."}
                                </p>
                              </>
                            ) : (
                              <p>
                                Switch to Full Vision to inspect the completed
                                integration target.
                              </p>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
            <CompletionRoadmap />
            <WhySolana />
            <section id="evidence">
              <div className="section-heading">
                <span className="ordinal">08 / INSPECT THE CLAIM</span>
                <h2>Latest Engineering Snapshot</h2>
                <p>
                  Dated, scoped records from the read-only adapter. Observed and
                  verified dates are distinct.
                </p>
              </div>
              {evidence.length ? (
                <div className="evidence-list">
                  {evidence.map((r) => (
                    <EvidenceCard
                      key={r.safeKey}
                      record={r}
                      onOpen={openEvidence}
                    />
                  ))}
                </div>
              ) : (
                <p className="empty">{noEvidence}</p>
              )}
              <details id="legend">
                <summary>
                  Maturity legend — every state has its own meaning
                </summary>
                <dl>
                  {Object.entries(maturityLegend).map(([key, meaning]) => (
                    <div key={key}>
                      <dt>
                        <MaturityBadge value={key as Maturity} />
                      </dt>
                      <dd>{meaning}</dd>
                    </div>
                  ))}
                </dl>
              </details>
            </section>
            <Copilot
              context={context}
              evidence={evidence}
              connected={!!copilotBridge}
            />
            {prompt && (
              <div className="prompt-preview" role="status">
                <strong>Suggested host prompt</strong>
                <p>{prompt}</p>
                <p className="small">
                  Mode: {mode} · Section: {section} · Node: {selected ?? "none"}{" "}
                  · Visible records: {evidence.length}. Connect
                  ShowcaseCopilotProvider through the host bridge to send this
                  context.
                </p>
              </div>
            )}
            <footer>
              <span>SYNAPZ / OMEGA</span>
              <p>
                Target architecture is not implementation evidence. No wallet
                signing, trading or blockchain writes are available in this
                module.
              </p>
            </footer>
          </main>
        </div>
        <dialog
          ref={dialog}
          onCancel={close}
          onClose={() => {
            if (selected || opened) close();
          }}
          aria-labelledby="drawer-title"
        >
          <div className="drawer-header">
            <span className="ordinal">SYSTEM DETAIL / READ-ONLY</span>
            <button onClick={close} aria-label="Close detail panel">
              Close ×
            </button>
          </div>
          {currentNode ? (
            <>
              <h2 id="drawer-title">{currentNode.title}</h2>
              <h3>End-state role</h3>
              <MaturityBadge value="TARGET" />
              <p>{currentNode.role}</p>
              <h3>Current evidence</h3>
              {recordsFor(currentNode.key).length ? (
                recordsFor(currentNode.key).map((r) => (
                  <EvidenceCard
                    key={r.safeKey}
                    record={r}
                    onOpen={openEvidence}
                  />
                ))
              ) : (
                <p>{noEvidence}</p>
              )}
              <h3>Current maturity</h3>
              {recordsFor(currentNode.key).length ? (
                recordsFor(currentNode.key).map((r) => (
                  <MaturityBadge key={r.safeKey} value={r.maturity} />
                ))
              ) : (
                <p>No published maturity claim.</p>
              )}
              <h3>Limitations</h3>
              <p>{currentNode.limitations}</p>
              <h3>What remains</h3>
              <p>{currentNode.remains}</p>
            </>
          ) : currentRecord ? (
            <>
              <h2 id="drawer-title">{currentRecord.title}</h2>
              <MaturityBadge value={currentRecord.maturity} />
              <p>{currentRecord.summary}</p>
              <h3>Scope and dates</h3>
              <p>{currentRecord.domain}</p>
              <p>
                Observed: {currentRecord.observedAt ?? "Not supplied"}
                <br />
                Verified: {currentRecord.verifiedAt ?? "Not supplied"}
              </p>
              <h3>Limitations</h3>
              <ul>
                {currentRecord.limitations.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
              <h3>Safe evidence links</h3>
              {currentRecord.evidenceRefs.length ? (
                currentRecord.evidenceRefs.map((ref) => (
                  <a
                    className="evidence-link"
                    href={ref.href}
                    key={ref.href}
                    onClick={() => openEvidence(ref.href.slice(10))}
                  >
                    {ref.label} ↗
                  </a>
                ))
              ) : (
                <p>No visible evidence links supplied.</p>
              )}
            </>
          ) : (
            <>
              <h2 id="drawer-title">Evidence unavailable</h2>
              <p>
                This reference is not in the authorized projection. Access fails
                closed.
              </p>
            </>
          )}
        </dialog>
      </div>
    </ShowcaseCopilotProvider>
  );
}
