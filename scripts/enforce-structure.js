const fs = require('fs');
const path = require('path');

function loadJSON(p){
  return JSON.parse(fs.readFileSync(p,'utf8'));
}

function hashFile(p){
  const data = fs.readFileSync(p);
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(data).digest('hex');
}

function main(){
  const root = path.join(__dirname,'..');
  const contract = loadJSON(path.join(root,'structure-contract.json'));
  const baseline = loadJSON(path.join(root,'baseline-hash.json'));
  const lock = loadJSON(path.join(root,'package.json.lock-contract'));

  const allowed = [
    ...contract.backend.map(f => 'backend/'+f),
    ...contract.frontend.map(f => 'frontend/'+f),
    'structure-contract.json',
    'baseline-hash.json',
    'package.json.lock-contract',
    '.emergent-block',
    'scripts/enforce-structure.js',
    'scripts/enforce-all.sh',
    'DEVELOPMENT_POLICY.md'
  ];

  function scan(dir){
    let viol=[];
    const items=fs.readdirSync(dir);
    for(const item of items){
      const full=path.join(dir,item);
      const rel=path.relative(root,full);
      if(rel.includes("node_modules")||rel.includes("dist")) continue;
      const stat=fs.statSync(full);
      const isAllowed = allowed.some(a => rel===a || rel.startsWith(a.replace(/\/g,'/')));
      if(!isAllowed) viol.push(rel);
      if(stat.isDirectory()) viol.push(...scan(full));
    }
    return viol;
  }

  const viol = scan(root);
  if(viol.length>0){
    console.error("STRUCTURE VIOLATIONS:");
    viol.forEach(v=>console.error(" - "+v));
    process.exit(1);
  }

  // baseline hash check for core files
  for(const rel in baseline){
    const p = path.join(root,rel);
    if(!fs.existsSync(p)){
      console.error("Missing baseline file:", rel);
      process.exit(1);
    }
    const h=hashFile(p);
    if(h!==baseline[rel]){
      console.error("Hash mismatch:", rel);
      process.exit(1);
    }
  }

  console.log("✔ Enforcement passed.");
}
main();
