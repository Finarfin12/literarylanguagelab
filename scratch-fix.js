const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

walkDir('app/api', (filePath) => {
  if (filePath.endsWith('route.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if it's an AI route
    if (content.includes('new Groq') || content.includes('groq-sdk')) {
      let changed = false;

      // 1. Replace imports and initialization
      if (content.includes('import Groq from "groq-sdk";')) {
        content = content.replace(
          'import Groq from "groq-sdk";',
          'import { getAIClient, getAIConfig, getRateLimit } from "@/lib/ai-config";'
        );
        changed = true;
      }
      
      content = content.replace(/const groq = new Groq\(\{ apiKey: process\.env\.GROQ_API_KEY \}\);\n?/g, '');
      
      // 2. Replace groq.chat.completions.create with config values
      if (content.includes('groq.chat.completions.create')) {
        content = content.replace(
          /const completion = await groq\.chat\.completions\.create/g,
          `const config = await getAIConfig("tools");\n    const groq = await getAIClient("tools");\n    const completion = await groq.chat.completions.create`
        );
        content = content.replace(/model: "llama-[^"]+",/g, 'model: config.model,');
        content = content.replace(/temperature: [\d.]+,\n?\s*max_tokens: \d+,?/g, 'temperature: config.temperature,\n      max_tokens: config.max_tokens,');
        changed = true;
      }

      // 3. Fix error message leakage
      if (content.includes('catch (error: any) {')) {
        content = content.replace(
          /return NextResponse\.json\(\{ error: error\.message( \|\| [^}]+)? \}, \{ status: 500 \}\);/g,
          'return NextResponse.json({ error: "Internal server error" }, { status: 500 });'
        );
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
      }
    }
  }
});
