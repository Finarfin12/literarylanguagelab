const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('app/(dashboard)/english-lab');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // replace class="... p-8 ..." with "p-5 sm:p-8"
  let replaced = content.replace(/([\`\"\'\s])p-8([\`\"\'\s])/g, '$1p-4 sm:p-8$2');
  
  if (content !== replaced) {
    fs.writeFileSync(file, replaced);
    console.log('Updated ' + file);
  }
});
