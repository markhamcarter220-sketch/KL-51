
const express = require('express');
const router = express.Router();

router.post('/math/ev', (req,res)=>{
  const { prob, payout, stake } = req.body || {};
  const ev = prob * payout - (1-prob)*stake;
  res.json({ ev });
});

module.exports = router;
