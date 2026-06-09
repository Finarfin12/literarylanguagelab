const fs = require('fs');

const files = [
  'lib/tools-config.ts',
  'app/api/lingowise/route.ts',
  'app/api/lookup/route.ts',
  'app/api/tools/paraphrase/evaluate/route.ts',
  'PRD.MD'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/Respond in Indonesian \(except for the prompts which should be in English\)/g, "Provide all your explanations and results in BOTH English and Indonesian (except for the image prompts which must remain in English)");
    content = content.replace(/Respond in Indonesian using/g, "Provide all your explanations and results in BOTH English and Indonesian using");
    content = content.replace(/Respond in Indonesian\./g, "Provide all your explanations and results in BOTH English and Indonesian.");
    content = content.replace(/Respond in Indonesian/g, "Provide all your explanations and results in BOTH English and Indonesian");
    content = content.replace(/in English, followed by a brief explanation of the transformation in Indonesian/g, "in English, followed by a brief explanation of the transformation in BOTH English and Indonesian");
    content = content.replace(/explain the stylistic changes you made in Indonesian/g, "explain the stylistic changes you made in BOTH English and Indonesian");
    fs.writeFileSync(file, content);
    console.log("Updated " + file);
  }
});
