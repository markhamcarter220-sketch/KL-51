# CHANGELOG_KL51

## Overview

KL51 promotes the Better Bets MVP from KL50 into a testing-ready, deployable build.

## Changes from KL50 → KL51

### 1. Versioning & Structure
- Cloned KL50 into a dedicated `KL51/` workspace.
- Marked this build as **KL51 Testing-Ready** in `README.md`.

### 2. Backend Hardening
- Standardized backend environment variables:
  - Added `PORT`, `ODDS_API_KEY`, and `BETTERBETS_API_KEY` to `backend/.env.example`.
  - Updated `backend/.env` with:
    - `PORT=4000`
    - `ODDS_API_KEY=131e2e6a84c784df78d1c94ea6b6a495`
    - `BETTERBETS_API_KEY=test-secret-key`
- Adopted a single odds pipeline (the `fetchOddsFromApi` implementation in `backend/server.js`).
- Removed legacy odds pipeline artifacts:
  - `backend/services/oddsService.js`
  - `backend/services/oddsApi.js`
  - `backend/controllers/oddsController.js`
  - `backend/routes/odds.js`
- Updated `/api/odds` error handling to return a consistent JSON shape:
  - `{ ok: false, error: string, details: any }`.

### 3. Tests & CI Flow
- Created a root `package.json` with scripts:
  - `npm run test` (backend + frontend)
  - `npm run test:backend`
  - `npm run test:frontend`
  - `npm run check` (runs structure enforcement + tests).
- Updated backend tests to respect `BETTERBETS_API_KEY`:
  - `tests/backend/odds.test.js`
  - `tests/backend/health.test.js`
- Confirmed tests use `x-betterbets-key` header aligned with `BETTERBETS_API_KEY`.

### 4. Frontend Cleanup
- Ensured the main scan button disables during EV and bonus scans by wiring the shared `loading` state into `scanEV` and `FiltersPanel`.
- Replaced the placeholder `ResultsList` with a status-aware component:
  - Shows loading, error, “no results”, and initial “Tap Scan” empty states.
  - Renders a simple list of serialized result rows for now.
- Wired `App.jsx` to pass `results`, `loading`, `error`, and `noResults` props into `ResultsList`.
- Removed legacy placeholder component:
  - Deleted `frontend/src/components/Filters.jsx`.
- Confirmed `FiltersPanel` continues to drive:
  - Mode, odds format, sport, market type, book, min edge, and bonus bet controls.

### 5. Documentation
- Updated `README.md` to:
  - Label this build as **KL51 Testing-Ready**.
  - Add a KL51 Quick Start section (clone, `cp backend/.env.example backend/.env`, fill keys, run backend + frontend).
  - Add Testing and Deploying sections describing:
    - `npm run test`, `npm run check`
    - Required environment variables for backend and frontend deployments.

