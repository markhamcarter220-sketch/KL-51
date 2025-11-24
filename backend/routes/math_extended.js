const { clvSchema, devigSchema, arbSchema } = require('../validation/mathSchemas');

// KL20 basic schema validation helper
function requireFields(obj, fields) {
  if (!obj || typeof obj !== 'object') return false;
  return fields.every((f) => Object.prototype.hasOwnProperty.call(obj, f));
}

const express = require('express');
const router = express.Router();
const ctr = require('../controllers/mathController');

// POST /math/clv – Compute closing line value (CLV)
router.post('/math/clv', (req, res) => {
  if (!requireFields(req.body, ['openOdds', 'closeOdds'])) {
    return res.status(400).json({ error: 'invalid' });
  }
  const parsed = clvSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid' });
  }
  return ctr.clv(req, res);
});

// POST /math/devig – Remove vig from implied probabilities
router.post('/math/devig', (req, res) => {
  if (!requireFields(req.body, ['probs'])) {
    return res.status(400).json({ error: 'invalid' });
  }
  const parsed = devigSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid' });
  }
  return ctr.devig(req, res);
});

// POST /math/arb – Determine if three outcomes form an arbitrage opportunity
router.post('/math/arb', (req, res) => {
  if (!requireFields(req.body, ['p1', 'p2', 'p3'])) {
    return res.status(400).json({ error: 'invalid' });
  }
  const parsed = arbSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid' });
  }
  return ctr.arb(req, res);
});

module.exports = router;