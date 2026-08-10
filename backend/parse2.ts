import fs from 'fs';
const data = JSON.parse(fs.readFileSync('dewas_out.json', 'utf8'));
data.forEach(r => {
  console.log(`Route: ${r.name} (${r.id})`);
  r.routestop.forEach(s => console.log(`  Stop ${s.id} - Status: ${s.status}`));
});
