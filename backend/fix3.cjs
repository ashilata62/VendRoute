const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Restore the bad uuid v4 regex injection
  content = content.replace(/id: require\("uuid"\).v4\(\),\s*id:/g, 'id:');
  content = content.replace(/id: require\("uuid"\).v4\(\),/g, '');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      replaceInFile(fullPath);
    }
  }
}

walk(path.join(__dirname, 'src'));
