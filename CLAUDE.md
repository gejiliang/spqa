# CLAUDE.md — SPQA Development Guide

## Project Overview

**SPQA (Senatus Populusque Agentium)** is an AI-Native organizational architecture inspired by the Roman Republic's governance system, built on OpenClaw 3.11. It provides multi-agent orchestration where a human "Caesar" directs AI agents through a structured hierarchy: Consul (chief assistant) → Praetor (issue analyst) → Senatus (multi-perspective deliberation) → Legionarii (task execution).

**Product architecture**: Three-layer stack — Dashboard (React SPA) → Engine API Server (Node.js) → OpenClaw Runtime.

**Primary language**: Chinese (zh-CN) for documentation and prompts. Code and config files use English identifiers.

## Repository Structure

```
SPQA/
├── ARCHITECTURE.md          # Core design philosophy (primary reference)
├── HANDOFF.md               # Session handoff context document
├── README.md                # Public-facing overview
├── .claude/launch.json      # Claude Code launch configurations
├── agents/                  # Design-layer agent definitions
│   ├── _template/           # Template for creating new agents
│   ├── consul/              # Consul (chief assistant) design docs
│   ├── annalist/            # Annalist (archivist) design docs
│   ├── curator/             # Curator Aquarum (ops/monitoring) design docs
│   ├── explorator/          # Explorator (intelligence) design docs
│   └── quaestor/            # Quaestor (finance) design docs
├── cohorts/                 # Praetorian Guard squad templates
│   └── _template/           # Template for new cohorts
├── docs/                    # Detailed design documents
│   ├── RESEARCH_NOTES.md    # OpenClaw deep research + design decisions
│   ├── OPENCLAW_BASELINE.md # OpenClaw 3.11 API signatures
│   ├── OPENCLAW_INTEGRATION.md  # Agent protocols + workspace structure
│   ├── A2A_PROTOCOL.md      # Agent-to-Agent communication protocol
│   ├── MERCENARII.md         # Mercenary system (ACP external AI)
│   ├── PRAETORIAN.md         # Praetorian Guard lifecycle
│   ├── DASHBOARD.md          # Frontend architecture
│   ├── THEME_SYSTEM.md       # Theme/skin system
│   ├── PRODUCT_FORM.md       # Commercial positioning
│   ├── MULTI_INSTANCE.md     # Multi-instance topology
│   └── OFFICIUM.md           # Office roles schema
├── openclaw/                # ★ OpenClaw configuration layer (MVP core)
│   ├── openclaw.json        # Global agent config (dmScope, visibility, A2A)
│   ├── agents/              # OpenClaw agent workspaces
│   │   ├── consul/          # Consul workspace (SOUL/AGENTS/BOOT/TOOLS/MEMORY/USER.md + skills/)
│   │   ├── annalist/        # Annalist workspace
│   │   └── curator/         # Curator workspace
│   ├── spqa/
│   │   ├── config.yaml      # SPQA global parameters
│   │   ├── senators/        # 12 senator templates (s-*.md)
│   │   └── themes/          # Theme files (spqa-roman/)
│   ├── engine/
│   │   ├── server.js        # API server (zero external deps, pure Node.js builtins)
│   │   ├── config.js        # Path configuration (auto-detects project root)
│   │   ├── lib/             # Server library modules
│   │   ├── package.json     # Engine package config
│   │   └── Dockerfile       # Engine container config
│   ├── dashboard/
│   │   ├── index.html       # React 18 SPA (CDN-loaded React + Tailwind + Babel)
│   │   ├── preview.html     # Static preview (zero deps, double-click to open)
│   │   ├── src/             # Component source (api.js, pages/, components/)
│   │   ├── package.json     # Dashboard package config
│   │   └── nginx.conf       # Reverse proxy config
│   └── docker-compose.yml   # Three-service orchestration
└── archive/                 # Archived/legacy files
```

## Running Locally

```bash
# Terminal 1: Engine API Server (port 3000)
cd openclaw/engine && node server.js

# Terminal 2: Dashboard dev server (port 5173)
cd openclaw/dashboard && python3 -m http.server 5173

# Open http://localhost:5173 in browser
```

Requires **Node.js 22+**. No `npm install` needed for basic operation (engine uses zero external dependencies).

## Key Technical Constraints

From OpenClaw 3.11 runtime limitations:

| Constraint | Limit | SPQA Strategy |
|------------|-------|---------------|
| Concurrent spawn | 8-10 triggers watchdog restart | SPQA limits to ≤6 concurrent |
| bootstrapMaxChars | 20,000 chars/file | Senator prompts ≤15k chars |
| bootstrapTotalMaxChars | 150,000 chars | Monitor combined prompt size |
| Senator prompt budget | ~2,000 chars each | 12 senators total ~8.4k (44% utilization) |

## Engine API Endpoints

17 endpoints on port 3000, all prefixed `/api`:
- `GET /api/agents`, `GET /api/agents/:id` — Agent listing/details
- `POST /api/senate/deliberate`, `GET /api/senate/active` — Senate deliberation
- `GET /api/tasks`, `POST /api/tasks` — Task management
- `GET /api/mercenarii`, `GET /api/mercenarii/stats` — Mercenary statistics
- `GET /api/config/openclaw`, `GET /api/config/spqa` — Configuration
- `GET /api/theme`, `GET /api/theme/roles` — Theme data
- `GET /api/health` — Health check

Dashboard API base URL: `http://localhost:3000/api` (CORS enabled in server.js).

## Architecture Concepts

### Four-Level Task Routing
- **L0 Trivium**: Consul handles directly (calendar, messages, minor decisions)
- **L1 Mercenarium**: External AI tools via ACP (code, scripts, reports)
- **L2 Deliberatio**: Praetor → Senate deliberation → Legionarii execution
- **L3 Praetoriana**: Persistent Praetorian Guard project teams

### Senate Deliberation (Ordo Deliberandi) — 4 Phases
1. **Cogitatio** — Independent parallel thinking (senators invisible to each other)
2. **Contentio** — Red/Blue team adversarial debate
3. **Consensus** — Delphi method convergence voting (max 3 rounds)
4. **Decretum** — Structured resolution output (Senatus Consultum)

### Agent Lifecycle Types
- **Always-on**: Consul, Annalist, Curator (24/7 infrastructure)
- **Project-persistent**: Praetorian Guard squads (project duration)
- **Ephemeral**: Senators, Legionarii (spawn and destroy per task)

## Design Principles (Must Not Violate)

1. **Zero-modification principle**: All SPQA customization via standard OpenClaw config files — never fork OpenClaw
2. **No direct senator communication**: Phase 1 senators are invisible to each other; Phase 2+ Consul aggregates and injects
3. **Consul is explicit orchestrator**: Follows fixed Skill-based flow, not hierarchical delegation
4. **Multi-perspective > single-point review**: Senate model hedges against LLM single-point overconfidence
5. **Ephemeral agents use `sessions_spawn`**: Not Workspace directories (deprecated)
6. **Chinese-first**: language=zh-CN for user-facing content; code uses English

## Code Conventions

- **Engine server**: Zero external npm dependencies — uses only Node.js builtins (`http`, `fs`, `path`)
- **Dashboard**: Single-file React SPA loaded via CDN (React 18 + Tailwind + Babel standalone)
- **Theme colors**: Dark Roman theme — `#1a1a2e` (background), `#DAA520` (gold), `#8B0000` (deep red)
- **Agent definitions**: Each agent follows OpenClaw workspace structure with `SOUL.md`, `AGENTS.md`, `BOOT.md`, `TOOLS.md`, `MEMORY.md`, `USER.md`
- **Senator templates**: Stored as `s-*.md` files in `openclaw/spqa/senators/`, each under 2,000 chars
- **Config format**: YAML for SPQA config (`config.yaml`), JSON for OpenClaw config (`openclaw.json`)

## Known Issues

**High priority:**
- Engine lacks WebSocket support (ws module needs `npm install ws`)
- Dashboard components use hardcoded mock data instead of real API fetch
- Root `senators/` directory has duplicate early-version files — needs cleanup

**Medium priority:**
- Senate deliberation requires real OpenClaw Gateway connection for spawn
- Annalist archiving and Curator health checks not yet implemented
- `config.yaml` YAML-lite parser doesn't support arrays or multiline strings

## Key Files to Read First

1. `ARCHITECTURE.md` — Full design philosophy and role definitions
2. `HANDOFF.md` — Quick-start context for new sessions
3. `docs/RESEARCH_NOTES.md` — OpenClaw research and design decisions
4. `openclaw/engine/server.js` — Engine API implementation
5. `openclaw/dashboard/index.html` — Dashboard SPA
6. `openclaw/agents/consul/` — Consul agent workspace (core orchestrator)
