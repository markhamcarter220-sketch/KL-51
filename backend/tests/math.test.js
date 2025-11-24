
const {clvA2}=require('../services/clvService');
const {devigMultiplicative}=require('../services/devigService');
const {arb3way}=require('../services/arbService');

describe('math engines', ()=>{
  test('clv computes',()=>{
    expect(clvA2(-110,-105)).not.toBeNaN();
  });
  test('devig normalizes',()=>{
    const r=devigMultiplicative([0.4,0.4,0.2]);
    expect(r.reduce((a,b)=>a+b,0)).toBeCloseTo(1);
  });
  test('arb detects',()=>{
    expect(arb3way(2,2,2)).toBe(false);
  });
});
