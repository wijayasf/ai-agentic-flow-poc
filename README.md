# AI Agentic Flow POC

A deterministic AI-powered complaint resolution demo — built as a presentable proof of concept for enterprise AI agentic workflows.

**Live demo:** https://wijayasf.github.io/ai-agentic-flow-poc/

---

## What it demonstrates

A fully scripted, deterministic 10-minute scenario in which four AI agents (Customer Complaint, Policy, Workflow, Finance) coordinate to resolve a property complaint through five stages: Intake → Investigation → Conflict → Approval → Resolution.

Key behaviors shown:

- Real-time moment progression with a 600-second timeline (M01–M21)
- Multi-agent and multi-system activity panels
- Event reveal, artifact production, and approval gate
- Failure injection and recovery path (Presenter Mode)
- Automatic run with no manual intervention (Auto Mode)
- Exact restart to idle state

---

## Tech stack

- **Framework:** Vite 8 + React 19 + TypeScript 6
- **Deployment:** GitHub Pages (static SPA)
- **Testing:** Vitest + Testing Library
- **Runtime:** Pure deterministic reducer — no backend, no API, no database

---

## Local development

```bash
cd app
npm install
npm run dev
```

Runs at `http://localhost:5173/`.

## Run tests

```bash
cd app
npm test
```

## Build

```bash
cd app
npm run build
```

Output at `app/dist/`.

---

## Deployment

Deployed automatically to GitHub Pages via `.github/workflows/deploy-github-pages.yml` on every push to `main`.
