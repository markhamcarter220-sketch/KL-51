# Better Bets — KL51 Testing-Ready Build


Better Bets scans multiple sportsbooks in real time to surface:
- +EV (Expected Value) bets
- Arbitrage opportunities
- Bonus bet optimization
- Per‑bet “books used” count
- ALL‑sports scanning

## Tech
- **Frontend:** React + Vite + Tailwind (no CRA)
- **Backend:** Node.js + Express (port 4000)

## Run Locally
### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

env
ODDS_API_KEY=your_key
BETTERBETS_API_KEY=test-secret-key
CORS_ORIGINS=http://localhost:5173
```

## Notes
- Project scrubbed of Create React App scaffolding and Emergent sync artifacts.
- Keep Vite as the only frontend build system.

## KL51 Quick Start

1. Clone the repo and enter the project root.
2. Copy backend env template:

```bash
cp backend/.env.example backend/.env
```

3. Edit `backend/.env` and set:

```env
PORT=4000
ODDS_API_KEY=131e2e6a84c784df78d1c94ea6b6a495
BETTERBETS_API_KEY=test-secret-key
NODE_ENV=development
```

4. Install dependencies for backend and frontend:

```bash
cd backend
npm install
cd ../frontend
npm install
```

5. Start the backend (port 4000 by default):

```bash
cd backend
npm start
```

6. In a separate terminal, start the frontend (Vite dev server):

```bash
cd frontend
npm run dev
```

The app will be available on the Vite dev URL (usually http://localhost:5173) and will talk to the backend on http://localhost:4000.

## Testing

From the project root:

```bash
npm install  # installs devDependencies for Jest / supertest / RTL
npm run test         # runs backend + frontend tests
npm run test:backend # runs backend tests only
npm run test:frontend# runs frontend tests only
```

To run the structure enforcement + tests gate:

```bash
npm run check
```

`npm run check` executes:

```bash
node scripts/enforce-structure.js && npm test
```

KL51 is considered valid only when this check passes.

## Deploying (Staging / Production)

Backend requirements:

- Node.js runtime
- Env vars:
  - `PORT`
  - `ODDS_API_KEY`
  - `BETTERBETS_API_KEY`
  - `CORS_ORIGINS` (e.g., `http://localhost:5173` or your deployed frontend origin)

Frontend deployment:

- Built with Vite (`npm run build` in `frontend/`).
- Configure `VITE_BACKEND_URL` to point at your deployed backend URL if needed.

A typical flow:

1. Deploy backend (Docker / Render / Railway / Fly.io) with the env vars above.
2. Deploy frontend (Vercel / Netlify / static hosting) with `VITE_BACKEND_URL` set to the backend URL.
3. Confirm `/api/health` returns `{ status: "ok" }` when called with a valid `x-betterbets-key` header.
4. Open the frontend, run a scan, and verify EV / bonus bets render.
