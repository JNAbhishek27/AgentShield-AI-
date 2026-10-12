# AgentShield: Evidence-Driven AI Incident Investigator & Remediation Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![AI Engine](https://img.shields.io/badge/Inference-NVIDIA%20Nemotron-76B900.svg)](https://tokenfactory.nebius.com)
[![Cloud](https://img.shields.io/badge/Platform-Nebius%20Token%20Factory-00D2FF.svg)](https://studio.nebius.ai)

> **AgentShield** is an evidence-driven AI incident investigation and remediation platform for software developers and engineering teams. It analyzes production logs, error traces, and system metrics to formulate verifiable root causes, generate guarded code patches, run sandboxed tests, and mandate human sign-off before consequential remediation.

---

## 1. Architectural Highlights & Core Philosophy

### Zero Fabricated Evidence (Anti-Hallucination)
Most generic AI incident bots hallucinate fake log lines or invent stack traces. AgentShield implements a **deterministic evidence verification graph**:
- Every citation points directly to an authentic ingested log entry (`file.log:lineNumber`) or stored runbook section.
- If an LLM suggests a citation that does not exist in the ingested logs, the citation is flagged and rejected by the validator.
- Distinct separation between **deterministic evidence confidence** (calculated through mathematical weighting of supporting vs. contradicting proofs) and **subjective model confidence**.

### NVIDIA Nemotron Inference via Nebius Token Factory
- Uses official NVIDIA open-source models (such as `nvidia/Llama-3.1-Nemotron-70B-Instruct-HF` or `nvidia/nemotron-4-340b-instruct`) served through **Nebius Token Factory** (`https://api.studio.nebius.ai/v1`).
- Clean **Provider Abstraction** with:
  1. **Nebius Provider**: Live OpenAI-compatible HTTP requests to Nebius Token Factory with official headers, token counting, and latency metrics.
  2. **Deterministic Mock Provider**: High-fidelity, reproducible fallback for zero-credential offline development, unit tests, and continuous evaluation.
  3. Runtime switching and health diagnostics directly from the UI or API.

### Isolated Sandbox Test Execution
- Synthesized code patches are subjected to **static safety guardrails** (AST syntax balance, timeout boundedness, forbidden privileged process execution).
- Verified patches are executed in a **containerized sandbox runner** with network egress disabled and strict execution timeouts.

### Mandatory Human Approval Protocol
- AgentShield **never** autonomously modifies external production infrastructure or deletes files.
- All state-changing remediation actions require explicit engineering authorization (`Approve`, `Reject`, or `Request Changes`) with cryptographic audit lineage.

---

## 2. 7-Stage Investigation Workflow

1. **Parse Incident Logs & Metrics**: Ingests raw logs or JSON; normalizes ISO timestamps; groups error templates; calculates baseline anomaly spike multiplier.
2. **Retrieve Relevant Log Entries**: Filters priority error frames, stack traces, and request IDs across affected microservices.
3. **Search Technical Docs & Runbooks**: Correlates architecture documentation and runbooks to identify known operational failure modes.
4. **Generate Hypotheses via NVIDIA Nemotron**: AI agent reasons over observed anomalies and error traces to formulate competing failure hypotheses.
5. **Rank Hypotheses & Verify Citations**: Cross-references citations against raw log lines. Evaluates contradicting evidence (e.g. healthy probes that refute total host crash).
6. **Synthesize Remediation Patch & Run Static Checks**: Drafts minimal safe patch; validates AST integrity; runs isolated sandbox test suites.
7. **Compile Audit Trail & Await Approval**: Generates structured postmortem markdown report and enters pending human review state.

---

## 3. Pre-Seeded Interactive Demos

1. **Demo 1: HTTP 500 Spike & Connection Pool Starvation (`INC-8942`)**
   - Microservice: `payment-gateway`
   - Anomaly: 8.4x error spike following deployment v2.4.1.
   - Root cause: Pool max capacity of 10 exhausted during checkout surge, resulting in `TimeoutError: ResourceRequest timed out after 5000ms`.
   - Remediation: Scales pool to 50 connections and wraps operations in `withTransaction` finally block. Unit tests pass in sandbox.

2. **Demo 2: Hypothesis Revision on Contradictory Evidence (`INC-7104`)**
   - Microservice: `catalog-service`
   - Initial hypothesis: Upstream Redis cache cluster degraded.
   - Contradiction: Diagnostics reveal `REDIS INFO` hit ratio is 99.6% and memory is healthy.
   - Revised root cause: Read-replica `pg_stat_replication` lag spiked to 48s due to an unindexed migration lock.

3. **Demo 3: Heap Saturation & V8 Garbage Collection Freeze (`INC-9318`)**
   - Microservice: `report-generator`
   - Root cause: Unbuffered CSV export buffering 2.5M rows in memory triggering Mark-sweep allocation failure and SIGABRT (exit code 134).
   - Remediation: Converts aggregation to Node.js stream pipeline.

---

## 4. Evaluation Benchmark Suite (10 Scenarios)

AgentShield features an automated benchmark test suite running across 10 distinct synthetic production failure modes:
1. `SCENARIO-01`: PostgreSQL Connection Starvation
2. `SCENARIO-02`: V8 Heap Memory Saturation
3. `SCENARIO-03`: Expired TLS Leaf Certificate
4. `SCENARIO-04`: Third-Party SMS Gateway 429 Throttle
5. `SCENARIO-05`: JWT Clock Skew Authentication Failure
6. `SCENARIO-06`: Deadlock on Concurrent Inventory Decrement
7. `SCENARIO-07`: Circular Dependency Import Trap
8. `SCENARIO-08`: Redis Cache Read Replica Lag
9. `SCENARIO-09`: Disk I/O IOPS Throttling on Log Volume
10. `SCENARIO-10`: DNS Resolution Flapping in CoreDNS

**Measured Metrics**:
- Root-cause category accuracy (%)
- Citation validity rate (100% verified against real lines)
- Log parsing success rate (%)
- Patch test pass rate (%)
- Average model inference latency (ms)

---

## 5. Technology Stack & Installation

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide React, Motion.
- **Backend / Live Server**: Node.js / Express with TypeScript / Vite middleware on Port 3000.
- **Python Backend**: FastAPI, SQLite3 repository, Pydantic, HTTPX, Pytest in `/backend`.
- **Inference**: NVIDIA Nemotron (`nvidia/Llama-3.1-Nemotron-70B-Instruct-HF`) via Nebius Token Factory.

### Quickstart

1. **Clone & install dependencies**:
   ```bash
   git clone https://github.com/example/agentshield.git
   cd agentshield
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your Nebius Token Factory API key:
   ```env
   NEBIUS_API_KEY="your-nebius-token-factory-api-key"
   NEBIUS_BASE_URL="https://api.studio.nebius.ai/v1"
   NEBIUS_MODEL="nvidia/Llama-3.1-Nemotron-70B-Instruct-HF"
   AI_PROVIDER="mock" # Set to "nebius" for live inference
   PORT=3000
   ```

3. **Start the Live Application**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. **Run Python Tests (FastAPI module)**:
   ```bash
   python3 backend/test_agent.py
   ```

5. **Run via Docker Compose**:
   ```bash
   docker-compose up --build
   ```

---

## 6. Security & Limitations

- **No Secret Leakage**: API keys are handled server-side only and never exposed in browser bundles, DOM attributes, or git commits.
- **Sandboxed Execution**: Untrusted code executed during patch validation runs in a sandbox with network access disabled and time limits.
- **Zero Autonomous Production Modification**: All changes require human approval.
- **Known Limitations**: Direct kernel memory dumps or network packet captures require host-level agents not included in container log streams.

---

## 7. License
MIT License. See [LICENSE](LICENSE) for details.
