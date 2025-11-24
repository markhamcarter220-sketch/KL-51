
export async function calcCLV(openOdds, closeOdds){
  const r = await fetch('/api/math/clv',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({openOdds,closeOdds})});
  return r.json();
}
export async function calcDevig(probs){
  const r = await fetch('/api/math/devig',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({probs})});
  return r.json();
}
export async function calcArb(p1,p2,p3){
  const r = await fetch('/api/math/arb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({p1,p2,p3})});
  return r.json();
}
