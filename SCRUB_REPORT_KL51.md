# SCRUB_REPORT_KL51

## Purpose

This report documents structural cleanup and dead code removal performed while promoting KL50 to KL51.

## Files Removed

- `backend/services/oddsService.js`
  - Legacy stub (`fetchOdds` returning an empty payload).
  - Replaced by the consolidated odds pipeline in `backend/server.js`.

- `backend/services/oddsApi.js`
  - Legacy Odds API integration stub, no longer wired into any routes.

- `backend/controllers/oddsController.js`
  - Controller wrapper around the removed odds service; unused in the current routing.

- `backend/routes/odds.js`
  - Legacy router mixing controller and service logic; superseded by `/api/odds` in `backend/server.js`.

- `frontend/src/components/Filters.jsx`
  - Placeholder filters component from an earlier KL phase.
  - Replaced by the fully wired `FiltersPanel.jsx` component.

## Structural Notes

- Odds fetching for the app now flows exclusively through:
  - `backend/server.js` → `fetchOddsFromApi` helper (with caching).
- Error handling for `/api/odds` has been normalized to return:
  - `{ ok: false, error: string, details: any }` on failure.
- Tests now coordinate with environment-based auth via `BETTERBETS_API_KEY`.

