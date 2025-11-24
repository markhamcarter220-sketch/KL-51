
function arb3way(p1,p2,p3){
  const inv = 1/p1 + 1/p2 + 1/p3;
  return inv<1;
}
module.exports={arb3way};
