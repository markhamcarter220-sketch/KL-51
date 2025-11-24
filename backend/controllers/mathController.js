
const {clvA2}=require('../services/clvService');
const {devigMultiplicative}=require('../services/devigService');
const {arb3way}=require('../services/arbService');

module.exports = {
  clv(req,res){ const {openOdds,closeOdds}=req.body; res.json({clv:clvA2(openOdds,closeOdds)}); },
  devig(req,res){ const {probs}=req.body; res.json({fair:devigMultiplicative(probs)}); },
  arb(req,res){ const {p1,p2,p3}=req.body; res.json({arb:arb3way(p1,p2,p3)}); }
};
