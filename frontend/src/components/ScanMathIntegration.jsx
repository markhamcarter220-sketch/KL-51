
import { useEffect, useState } from 'react';
import { calcCLV, calcDevig, calcArb } from '../utils/bbMathAPI';

export default function ScanMathIntegration({ bet }) {
  const [clv,setClv]=useState(null);
  const [fair,setFair]=useState(null);
  const [arb,setArb]=useState(null);

  useEffect(()=>{
    if(bet?.openOdds && bet?.closeOdds)
      calcCLV(bet.openOdds, bet.closeOdds).then(r=>setClv(r.clv));
    if(bet?.probs)
      calcDevig(bet.probs).then(r=>setFair(r.fair));
    if(bet?.p1 && bet?.p2 && bet?.p3)
      calcArb(bet.p1,bet.p2,bet.p3).then(r=>setArb(r.arb));
  },[bet]);

  return (
    <div>
      {clv!==null && <div>CLV: {clv}</div>}
      {fair!==null && <div>Fair: {JSON.stringify(fair)}</div>}
      {arb!==null && <div>Arb: {arb?'YES':'NO'}</div>}
    </div>
  );
}
