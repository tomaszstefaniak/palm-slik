const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('.next') && !file.includes('target')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.json') || file.endsWith('.md')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('.');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(/https:\/\/github\.com\/konradbachowski\/slik/g, 'https://github.com/tomaszstefaniak/palm-slik');
  newContent = newContent.replace(/https:\/\/github\.com\/konradbachowski/g, 'https://github.com/tomaszstefaniak');
  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    console.log(`Updated ${file}`);
  }
});
