import fs from 'fs';
const data = JSON.parse(fs.readFileSync('dewas_out.json', 'utf8'));

const skipped = data.flatMap(r => r.routestop).filter(s => s.status === 'SKIPPED');
console.log('Skipped stops for dewas:', skipped);
