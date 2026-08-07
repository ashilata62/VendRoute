const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Fix req.query string casts
  content = content.replace(/const { (.+) } = req\.query;/g, 'const  = req.query. as string;');
  content = content.replace(/const { (.+) } = req\.params;/g, 'const  = req.params. as string;');
  
  // Fix missing ids in creates by allowing uuid import and injecting id if missing
  // This is a quick regex patch for typescript
  content = content.replace(/data: \{/g, 'data: { id: require("uuid").v4(),');
  content = content.replace(/id: require\("uuid"\).v4\(\),\s*id:/g, 'id:'); // fix double id

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
