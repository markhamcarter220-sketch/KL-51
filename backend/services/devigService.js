
function devigMultiplicative(probs){
  const sum=probs.reduce((a,b)=>a+b,0);
  return probs.map(p=>p/sum);
}
module.exports={devigMultiplicative};
