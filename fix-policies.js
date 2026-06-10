const fs = require('fs');

const files = ['schema_canonical.sql', 'schema_config_system.sql'];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/CREATE POLICY "([^"]+)"\s+ON (\w+)/g, 'DROP POLICY IF EXISTS "$1" ON $2;\nCREATE POLICY "$1"\n  ON $2');
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
