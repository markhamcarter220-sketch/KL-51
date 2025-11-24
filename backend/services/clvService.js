
function impliedProb(odds){
  return odds>0?100/(odds+100): -odds/(-odds+100);
}
function clvA2(openOdds, closeOdds){
  const p0=impliedProb(openOdds);
  const p1=impliedProb(closeOdds);
  return (p1-p0)*100;
}
module.exports={clvA2};
