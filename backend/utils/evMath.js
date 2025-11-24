
// KL39 EV calculation utilities
function calculateImpliedProbability(price){
  if(price>0) return 100/(price+100);
  return -price/(-price+100);
}
function calculateFairOdds(prob){
  return prob===0?null:(1/prob)*100;
}
function calculateEdge(fair, market) {
  // Guard against null/undefined inputs and zero division. If either value is
  // falsy (0, null, undefined), return null to indicate that an edge cannot
  // be computed. Use Math.abs instead of a global abs identifier (which
  // would otherwise be undefined) to compute the absolute value of the
  // market odds.
  if (fair == null || market == null || market === 0) return null;
  return ((fair - market) / Math.abs(market)) * 100;
}
module.exports={calculateImpliedProbability,calculateFairOdds,calculateEdge};
