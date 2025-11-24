const dotenv = require('dotenv');

// Load environment variables once here
dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';

const config = {
  nodeEnv: NODE_ENV,
  port: process.env.PORT || 4000,
  // Use a dummy API key in development or test environments if none is
  // provided. This prevents the server from exiting during automated
  // testing where an external API key is unnecessary because API calls
  // are stubbed or mocked. In production, you should set ODDS_API_KEY
  // explicitly via environment variables.
  oddsApiKey: process.env.ODDS_API_KEY || 'DUMMY_KEY',
  betterBetsApiKey: process.env.BETTERBETS_API_KEY || null,
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:4000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
};

// Log a warning rather than exiting when the API key is missing. Tests and
// development can function with the dummy key, but production should
// still set a proper key.
if (!process.env.ODDS_API_KEY) {
  console.warn('[BetterBets] ODDS_API_KEY is not set; using dummy key');
}

module.exports = { config };
