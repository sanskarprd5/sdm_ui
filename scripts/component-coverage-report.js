const fs = require('fs');
const path = require('path');

const lcovPath = path.resolve(__dirname, '..', 'coverage', 'digital-smart_sdm.ui', 'lcov.info');
if (!fs.existsSync(lcovPath)) {
  console.error('Coverage file not found:', lcovPath);
  process.exit(1);
}

const content = fs.readFileSync(lcovPath, 'utf8');
const records = [];
let current = null;

for (const rawLine of content.split('\n')) {
  const line = rawLine.trim();
  if (line.startsWith('SF:')) {
    if (current) {
      records.push(current);
    }
    current = { file: line.slice(3), lines: {} };
  } else if (line.startsWith('DA:') && current) {
    const [lineNumber, hitCount] = line.slice(3).split(',');
    if (lineNumber) {
      current.lines[lineNumber] = Number(hitCount || 0);
    }
  } else if (line === 'end_of_record') {
    if (current) {
      records.push(current);
      current = null;
    }
  }
}

const components = records
  .filter((record) => record.file.endsWith('component.ts'))
  .map((record) => {
    const hits = Object.values(record.lines);
    const linesFound = hits.length;
    const linesHit = hits.filter((count) => count > 0).length;
    const coverage = linesFound === 0 ? 0 : Number(((linesHit / linesFound) * 100).toFixed(2));
    return {
      file: path.relative(path.resolve(__dirname, '..'), record.file).replace(/\\/g, '/'),
      linesFound,
      linesHit,
      coverage
    };
  })
  .sort((a, b) => a.coverage - b.coverage);

console.log(JSON.stringify(components, null, 2));
