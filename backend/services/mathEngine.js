
const {clvA2}=require('./clvService');
const {devigMultiplicative}=require('./devigService');
const {arb3way}=require('./arbService');

module.exports={
  clvA2, devigMultiplicative, arb3way
};


// KL25 math caching
const cache = require('./cache');
function cachedCLV(openOdds, closeOdds){
  const key=`clv_${openOdds}_${closeOdds}`;
  const c=cache.get(key,30000);
  if(c) return c;
  const v=clvA2(openOdds,closeOdds);
  cache.set(key,v);
  return v;
}
module.exports.cachedCLV = cachedCLV;
