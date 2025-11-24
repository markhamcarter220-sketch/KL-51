
import { useState } from 'react';
import { calcCLV, calcDevig, calcArb } from '../utils/bbMathAPI';

export default function MathIntegrationDemo(){
  const [clv,setClv]=useState(null);
  async function run(){
    const r=await calcCLV(-110,-105);
    setClv(r.clv);
  }
  return <div><button onClick={run}>Run CLV</button>{clv && <div>CLV: {clv}</div>}</div>;
}
