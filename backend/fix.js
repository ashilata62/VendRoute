const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  content = content.replace(/routeStop:/g, 'routestop:');
  content = content.replace(/prisma\.routeStop/g, 'prisma.routestop');
  content = content.replace(/locations:/g, 'location:');
  content = content.replace(/machines:/g, 'machine:');
  content = content.replace(/driver:/g, 'user:');
  content = content.replace(/stops:/g, 'routestop:');
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', filePath);
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
