import {
  engineering,
  reviewQuestions,
  workstreams,
  whySolana,
} from "./reviewContent";

export function SolanaEngineering() {
  return (
    <div className="engineering">
      <h3>Current Proof — qualification boundaries</h3>
      <p>
        The 2026-10-08 forensic audit reports PRIME Phase 2 safe read-only
        Solana path: QUALIFIED; RIG V1.1 local-validator / Token-2022:
        QUALIFIED; Multichain: development/testnet boundary. These are
        audit-reported owner-summary references, not independent validation or
        new approved feed records.
      </p>
      <p className="disclaimer">
        No unrestricted signing. No unrestricted broadcast. No mainnet claim. No
        real-funds claim. Token-2022 extensions remain disabled pending separate
        review.
      </p>
      <h3>Engineering decisions and evidence gaps</h3>
      <p>
        These are review requirements for the TARGET path, not descriptions of
        deployed mechanisms.
      </p>
      <div className="fabric-grid">
        {engineering.map(([title, requirement]) => (
          <article key={title}>
            <h4>{title}</h4>
            <p>{requirement}</p>
            <p className="small">NOT YET EVIDENCED / DESIGN DECISION PENDING</p>
          </article>
        ))}
      </div>
      <h3>Solana engineering Q&amp;A</h3>
      <p>
        The audit’s 20 reviewer questions. Each answer distinguishes the
        available record from the evidence needed to close its gap.
      </p>
      <div className="review-questions">
        {reviewQuestions.map(([question, answer, required], index) => (
          <details key={question}>
            <summary>
              {index + 1}. {question}
            </summary>
            <p>{answer}</p>
            <p className="small">NOT YET EVIDENCED / DESIGN DECISION PENDING</p>
            <p>
              <strong>Evidence required to close:</strong> {required}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}

export function CompletionRoadmap() {
  return (
    <section id="finished">
      <span id="roadmap" aria-hidden="true" />
      <div className="section-heading">
        <span className="ordinal">06 / COMPLETION GATES</span>
        <h2>What Will Be Finished</h2>
        <p>
          Remaining work and acceptance standards. TARGET work stays unfinished
          until scoped evidence closes its gate. No dates or percentages are
          implied.
        </p>
      </div>
      <ol className="roadmap">
        {workstreams.map(([name, proof, remaining, standard]) => (
          <li key={name}>
            <article>
              <h3>{name}</h3>
              <p>
                <strong>Current Proof:</strong> {proof}
              </p>
              <p>
                <strong>Remaining Work:</strong> {remaining}
              </p>
              <p>
                <strong>Completion Standard:</strong> {standard}
              </p>
            </article>
            <span className="badge badge-planned">
              PLANNED
              <span className="sr-only">
                : Unfinished work with no implementation claim.
              </span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function WhySolana() {
  return (
    <section id="why-solana">
      <div className="section-heading">
        <span className="ordinal">07 / TECHNICAL FIT</span>
        <h2>Why Solana</h2>
        <p>
          A technical design rationale. Platform capabilities do not establish
          SYNAPZ implementation or performance.
        </p>
      </div>
      <h3>Why Solana for SYNAPZ</h3>
      <div className="why-grid">
        {whySolana.map(([title, text, href]) => (
          <article key={title}>
            <h4>{title}</h4>
            <p>{text}</p>
            <a href={href} target="_blank" rel="noreferrer">
              Solana documentation: {title}
            </a>
          </article>
        ))}
      </div>
      <h3>Why SYNAPZ could matter to Solana</h3>
      <p>
        The TARGET contribution is governed financial infrastructure:
        role-separated proposals, independent evaluation, explicit policy gates
        and inspectable receipts for issuance, payments and settlement. Reusable
        failure tests and evidence could help teams review agent actions. This
        value remains a hypothesis until reproducible integrations and ecosystem
        adoption are evidenced; no endorsement is implied.
      </p>
      <h3>Engineering challenges</h3>
      <p>
        High-throughput event architecture and low-latency state changes put
        pressure on ingestion queues, state freshness and independent
        evaluation. Account contention, RPC quotas, dropped connections,
        duplicate events, blockhash expiry, compute budgets and priority fees
        all require bounded failure handling. Finality must be reconciled before
        settlement. Token authorities, extension compatibility and signer
        custody require separate security review. No measured SYNAPZ throughput,
        latency or production reliability is asserted.
      </p>
    </section>
  );
}
