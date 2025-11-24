
import { useEffect, useState } from 'react';
import { calcCLV, calcDevig, calcArb } from '../utils/bbMathAPI';

export default function BetCardMathIntegration({ openOdds, closeOdds, probs, p1, p2, p3 }) {
  const [clv, setClv] = useState(null);
  const [devig, setDevig] = useState(null);
  const [arb, setArb] = useState(null);

  useEffect(() => {
    if (openOdds && closeOdds) calcCLV(openOdds, closeOdds).then(r => setClv(r.clv));
    if (probs) calcDevig(probs).then(r => setDevig(r.fair));
    if (p1 && p2 && p3) calcArb(p1, p2, p3).then(r => setArb(r.arb));
  }, [openOdds, closeOdds, probs, p1, p2, p3]);

  return (
    <div>
      {clv !== null && <div>CLV: {clv}</div>}
      {devig !== null && <div>Fair Probabilities: {JSON.stringify(devig)}</div>}
      {arb !== null && <div>Arb: {arb ? "YES" : "NO"}</div>}
    </div>
  );
}
