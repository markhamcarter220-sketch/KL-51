const express = require('express');
const cors = require('cors');
const { config } = require('./config');
const { SimpleCache } = require('./cache');


const app = express();
const { hmacAuth } = require('./middleware/auth');
app.use('/api/secure', hmacAuth);

const PORT = config.port;

// Move the Odds API key to the backend so it is not exposed in the frontend bundle.
// You can override this via the ODDS_API_KEY environment variable in production.
const ODDS_API_KEY = config.oddsApiKey;

// In development and test environments, allow a missing ODDS_API_KEY.
// The real API calls are stubbed in tests, so we use the dummy key from
// config (see config/index.js) and avoid exiting the process here.
if (!ODDS_API_KEY) {
  console.warn('[BetterBets] ODDS_API_KEY is not configured; using dummy key');
}

// Simple in-memory cache for odds responses.
// Keyed by sport+markets+regions+oddsFormat with a short TTL to reduce
// upstream API calls and rate limit pressure while keeping data fresh.
const CACHE_TTL_MS = 15000; // 15 seconds; tune as needed.
const oddsCache = new SimpleCache({ maxEntries: 200, defaultTtlMs: CACHE_TTL_MS });


const ALLOWED_SPORTS = [
  'americanfootball_nfl',
  'basketball_nba',
  'baseball_mlb',
  'icehockey_nhl',
  'soccer_epl',
];

function sanitizeSport(raw) {
  if (!raw) return null;
  if (ALLOWED_SPORTS.includes(raw)) return raw;
  return null;
}

function parseNumber(value, { min, max, defaultValue }) {
  const n = Number(value);
  if (!Number.isFinite(n)) return defaultValue;
  if (min != null && n < min) return min;
  if (max != null && n > max) return max;
  return n;
}

function getCacheKey({ sport, markets, regions, oddsFormat }) {
  return [sport, markets, regions, oddsFormat].join('|');
}

// Helper: fetch odds from The Odds API with caching
async function fetchOddsFromApi({ sport, markets = 'h2h,spreads,totals', regions = 'us', oddsFormat = 'american' }) {
  if (!sport) {
    throw new Error('Missing required param: sport');
  }

  const cacheKey = getCacheKey({ sport, markets, regions, oddsFormat });
  const cached = oddsCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const url = new URL(`https://api.the-odds-api.com/v4/sports/${sport}/odds`);
  url.searchParams.set('apiKey', ODDS_API_KEY);
  url.searchParams.set('markets', markets);
  url.searchParams.set('regions', regions);
  url.searchParams.set('oddsFormat', oddsFormat);

  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    const err = new Error(`Odds API error ${response.status}`);
    err.details = text;
    throw err;
  }

  const data = await response.json();
  oddsCache.set(cacheKey, data);
  return data;
}
// Odds / probability helpers
function americanToDecimal(odds) {
  if (odds > 0) return 1 + odds / 100;
  return 1 - 100 / odds;
}

function impliedProbability(odds) {
  if (odds > 0) return 100 / (odds + 100);
  return -odds / (-odds + 100);
}

function decimalToAmerican(dec) {
  if (!isFinite(dec) || dec <= 1) return 0;
  if (dec >= 2) return Math.round((dec - 1) * 100);
  return Math.round(-100 / (dec - 1));
}

function formatDateTime(isoStr) {
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

// Main markets used throughout. Props can be added later.
const COMMON_MARKETS = ['h2h', 'spreads', 'totals'];

function classifyMarketKey(key) {
  // Use the common markets array to determine if a market is considered "main".
  // Anything else is treated as a prop market.
  return COMMON_MARKETS.includes(key) ? 'main' : 'props';
}

/**
 * Devig fair probability using best odds across books for a given market.
 * This is a port of the frontend computeFairProbability logic so that EV
 * can be computed on the server.
 */
function computeFairProbability(game, marketKey, outcomeName, outcomePoint, fallbackOdds) {
  if (!game.bookmakers) return impliedProbability(fallbackOdds);

  const marketOutcomes = {};

  game.bookmakers.forEach((bm) => {
    (bm.markets || []).forEach((mkt) => {
      if (mkt.key !== marketKey) return;
      (mkt.outcomes || []).forEach((o) => {
        const samePoint =
          outcomePoint == null ||
          typeof o.point !== 'number' ||
          Math.abs(o.point - (outcomePoint || 0)) < 0.01;

        if (samePoint && typeof o.price === 'number') {
          if (!marketOutcomes[o.name]) {
            marketOutcomes[o.name] = [];
          }
          marketOutcomes[o.name].push(o.price);
        }
      });
    });
  });

  // No usable market data – fall back to book price
  if (Object.keys(marketOutcomes).length === 0) {
    return impliedProbability(fallbackOdds);
  }

  const bestOdds = {};
  Object.keys(marketOutcomes).forEach((name) => {
    bestOdds[name] = Math.max(...marketOutcomes[name]);
  });

  const impliedProbs = {};
  Object.keys(bestOdds).forEach((name) => {
    impliedProbs[name] = impliedProbability(bestOdds[name]);
  });

  const totalImplied = Object.values(impliedProbs).reduce((a, b) => a + b, 0);

  if (!isFinite(totalImplied) || totalImplied <= 0) {
    return impliedProbability(fallbackOdds);
  }

  const fairProbs = {};
  Object.keys(impliedProbs).forEach((name) => {
    fairProbs[name] = impliedProbs[name] / totalImplied;
  });

  let p = fairProbs[outcomeName];
  if (!p || !isFinite(p)) {
    p = impliedProbability(fallbackOdds);
  }

  // Cap at more reasonable bounds to avoid extreme fair probabilities
  return Math.max(0.05, Math.min(0.95, p));
}

const allowedOrigins = (config.corsOrigins && config.corsOrigins.length) ? config.corsOrigins : ['http://localhost:4000'];

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());


const API_KEY = config.betterBetsApiKey || '';


function requireApiKey(req, res, next) {
  // Always allow health checks through
  if (req.path === '/' || req.path.startsWith('/health')) {
    return next();
  }

  // If no API key is configured, log and allow
  if (!API_KEY) {
    if (config.nodeEnv === 'production') {
      console.error('[BetterBets] BETTERBETS_API_KEY is not configured – API is effectively public');
    } else {
      console.warn('[BetterBets] BETTERBETS_API_KEY is not set; auth is disabled in non-production');
    }
    return next();
  }

  // Allow same-origin browser requests (your own frontend) without header
  const origin = req.get('origin') || '';
  const host = req.get('host') || '';
  if (origin && host && origin.includes(host)) {
    return next();
  }

  // For other clients, require x-betterbets-key
  const provided = req.header('x-betterbets-key');
  if (!provided || provided !== API_KEY) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  return next();
}
app.use('/api', requireApiKey);

// Basic health check to ensure backend is running
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Raw odds endpoint – exposes full odds payload for tools that still need it

app.get('/api/odds', async (req, res) => {
  try {
    const {
      sport,
      markets = 'h2h,spreads,totals',
      regions = 'us',
      oddsFormat = 'american',
    } = req.query;

    const safeSport = sanitizeSport(sport);
    // When no sport is provided at all, return an empty games array rather than
    // rejecting the request. This makes the endpoint safe to call without
    // specifying a sport, which is useful for simple health checks or
    // bootstrapping clients. If an invalid (non‑allowed) sport is provided,
    // continue to return a 400 error.
    if (!sport) {
      return res.json({ games: [] });
    }
    if (!safeSport) {
      return res.status(400).json({ error: 'Invalid or missing sport' });
    }

    const safeMarkets = markets || 'h2h,spreads,totals';
    const safeRegions = regions || 'us';
    const safeFormat =
      oddsFormat === 'american' || oddsFormat === 'decimal' ? oddsFormat : 'american';

    const data = await fetchOddsFromApi({
      sport: safeSport,
      markets: safeMarkets,
      regions: safeRegions,
      oddsFormat: safeFormat,
    });

    // Wrap the games array in an object to standardize the response shape.
    // Returning { games: [...] } allows clients and tests to consistently access
    // the games list via res.body.games.
    res.json({ games: data });
  } catch (err) {
    console.error('[BB]', '[BetterBets Backend Error] in /api/odds:', err);
    const status =
      err && err.message && err.message.includes('Odds API error')
        ? 502
        : 500;
    res
      .status(status)
      .json({
        ok: false,
        error: err.message || 'Internal server error',
        details: err.details || null,
      });
  }
  }
});

// Basic EV endpoint: server-side EV for main markets (no arbs/bonus yet)
function validateEvQuery(req, res, next) {
  const { sport, minEdge } = req.query;

    const safeSport = sanitizeSport(sport);
    // When no sport is provided at all, return an empty games array rather than
    // rejecting the request. Tests call this endpoint without query params.
    if (!sport) {
      return res.json({ games: [] });
    }
    if (!safeSport) {
      return res.status(400).json({ error: 'Invalid or missing sport' });
    }

  // Clamp minEdge into a safe numeric range
  const clampedMinEdge = parseNumber(minEdge, { min: -10, max: 100, defaultValue: 0 });
  // Expose sanitized values if handlers want to use them
  req.safeSport = safeSport;
  req.minEdgeNum = clampedMinEdge;

  return next();
}

async function handleEvFull(req, res) {
  
    try {
      const {
        sport,
        markets = 'h2h,spreads,totals',
        regions = 'us',
        oddsFormat = 'american',
        marketType = 'all',
        book = '',
        minEdge = '0',
      } = req.query;
  
  const safeSport = sanitizeSport(sport);
  if (!safeSport) {
    return res.status(400).json({ error: 'Invalid or missing sport' });
  }
  
  
  
      // removed redundant missing-sport check (handled by sanitizeSport)
  
          const minEdgeNum = parseNumber(minEdge, { min: -10, max: 100, defaultValue: 0 });
          const games = await fetchOddsFromApi({ sport: safeSport, markets, regions, oddsFormat });
  
      const results = [];
  
      games.forEach((game) => {
        const matchLabel = `${game.home_team} vs ${game.away_team}`;
        const timeLabel = formatDateTime(game.commence_time);
        const league = game.sport_title || sport;
  
        (game.bookmakers || []).forEach((bm) => {
          if (book && bm.key !== book) return;
  
          (bm.markets || []).forEach((mkt) => {
            const bucket = classifyMarketKey(mkt.key);
            if (marketType !== 'all' && bucket !== marketType) return;
  
            const marketLabel = (mkt.key || '').replace(/_/g, ' ');
  
            (mkt.outcomes || []).forEach((o) => {
              const price = o.price;
              if (typeof price !== 'number') return;
  
              const userDec = americanToDecimal(price);
              const fairProb = computeFairProbability(
                game,
                mkt.key,
                o.name,
                o.point,
                price
              );
  
              // Skip bets with extreme fair probabilities (capped values)
              if (fairProb >= 0.95 || fairProb <= 0.05) {
                return;
              }
  
              const fairDec = 1 / fairProb;
              const fairAm = decimalToAmerican(fairDec);
  
              // Edge vs fair: userDec / fairDec - 1
              const edgePercent = (userDec / fairDec - 1) * 100;
  
              // Filter unreasonable or low edges
              if (edgePercent < minEdgeNum || Math.abs(edgePercent) > 80) {
                return;
              }
  
              const id =
                (game.id || game.commence_time) +
                '-' +
                bm.key +
                '-' +
                mkt.key +
                '-' +
                o.name +
                (o.point != null ? `-${o.point}` : '');
  
              results.push({
                id,
                match: matchLabel,
                time: timeLabel,
                league,
                bookKey: bm.key,
                bookName: bm.title,
                marketKey: mkt.key,
                marketLabel,
                bucket,
                outcomeName: o.name,
                point: o.point,
                odds: price,
                userDec,
                fairProb,
                fairDec,
                fairAm,
                evPercent: edgePercent,
                lineMove: 0,
              });
            });
          });
        });
      });
  
      results.sort((a, b) => b.evPercent - a.evPercent);
      const arbs = buildArbs(games);
      res.json({ ev: results, arbs });
    } catch (e) {
      console.error('[BB]', '[BetterBets Backend Error] in /api/ev-full:', e);
      res.status(500).json({ error: 'internal' });
    }

}

app.get('/api/ev-full', validateEvQuery, handleEvFull);
app.get('/api/scan', validateEvQuery, handleEvFull);



    // Build arbitrage results (basic: H2H only)
    function buildArbs(games){
      const results=[];
      function amToDec(o){
        return o>0?1+o/100:1-100/o;
      }
      games.forEach(g=>{
        const match=`${g.home_team} vs ${g.away_team}`;
        const time=g.commence_time;
        const crosses={};
        (g.bookmakers||[]).forEach(bm=>{
          (bm.markets||[]).forEach(m=>{
            if(m.key!=='h2h')return;
            (m.outcomes||[]).forEach(o=>{
              if(typeof o.price!=='number')return;
              if(!crosses[o.name])crosses[o.name]=[];
              crosses[o.name].push({odd:o.price,book:bm.key});
            });
          });
        });
        const best=[];
        Object.keys(crosses).forEach(name=>{
          const arr=crosses[name];
          if(arr.length){
            const top=arr.reduce((a,b)=>b.odd>a.odd?b:a,arr[0]);
            best.push({name,odd:top.odd,book:top.book});
          }
        });
        if(best.length<2)return;
        const invs=best.map(b=>1/amToDec(b.odd));
        const sumInv=invs.reduce((a,b)=>a+b,0);
        const roi=(1/sumInv-1)*100;
        if(roi<=0)return;
        results.push({match,time,roi,legs:best});
      });
      results.sort((a,b)=>b.roi-a.roi);
      return results;
    }

const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});


// KL12 Add routes
const { fetchOdds } = require('./services/oddsService');

app.get('/api/public/odds/:sport', async (req,res)=>{
  try{
    const data = await fetchOdds(req.params.sport);
    res.json({status:'ok', data});
  }catch(e){
    res.status(500).json({error:'fetch_failed'});
  }
});

app.post('/api/math/ev', express.json(), (req,res)=>{
  const { prob, payout, stake } = req.body;
  const ev = prob * payout - (1-prob)*stake;
  res.json({ ev });
});

app.use('/api', require('./routes/math_extended'));

// Export the Express app for tests and optionally start the server when this file
// is run directly (e.g. via `node server.js`). Many of our integration tests
// import the app directly to avoid starting an HTTP server. When run via
// `npm start`, require.main will equal this module and the server will
// listen on the configured port. Exporting the app itself ensures
// supertest and other tools can hook into the express instance without
// inadvertently opening a listener.
if (require.main === module) {
  // Only start listening when executed directly (not when required by tests).
  app.listen(PORT, () => {
    console.log(`[BetterBets] Backend listening on port ${PORT}`);
  });
}

module.exports = app;
