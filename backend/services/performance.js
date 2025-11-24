
module.exports = {
  now: ()=>Date.now(),
  measure(fn){ const s=Date.now(); const r=fn(); return {result:r, ms:Date.now()-s}; }
};
