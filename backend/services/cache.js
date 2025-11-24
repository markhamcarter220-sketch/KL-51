
const cache = new Map();
function set(key,val){ cache.set(key,{val,ts:Date.now()}); }
function get(key,ttl){ 
  const e=cache.get(key); 
  if(!e) return null; 
  if(Date.now()-e.ts>ttl) return null; 
  return e.val; 
}
module.exports={set,get};
