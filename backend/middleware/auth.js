
const crypto = require('crypto');

const NONCE_WINDOW = 5 * 60 * 1000;
const usedNonces = new Set();

function hmacAuth(req, res, next) {
  const pub = req.headers["x-bb-pub"];
  const ts = req.headers["x-bb-ts"];
  const nonce = req.headers["x-bb-nonce"];
  const sig = req.headers["x-bb-sig"];
  if (!pub || !ts || !nonce || !sig) return res.status(401).json({error:"auth_missing"});
  const now = Date.now();
  if (Math.abs(now - parseInt(ts)) > NONCE_WINDOW) return res.status(401).json({error:"ts_invalid"});
  const combo = pub + ":" + ts + ":" + nonce;
  if (usedNonces.has(combo)) return res.status(401).json({error:"replay"});
  usedNonces.add(combo);
  const secret = process.env.BB_PRIVATE_KEY;
  const check = crypto.createHmac('sha256', secret).update(combo).digest('hex');
  if (check !== sig) return res.status(401).json({error:"sig_invalid"});
  next();
}

module.exports = { hmacAuth };
