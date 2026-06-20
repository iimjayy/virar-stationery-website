const fs = require('fs');

const jsContent = fs.readFileSync('assets/js/features/language-toggle.js', 'utf8');
const dictMatch = jsContent.match(/const DICT = (\{[\s\S]*?\n\});\n/);
if (!dictMatch) {
  console.log("Could not find DICT");
  process.exit(1);
}

let DICT;
try {
  DICT = eval('(' + dictMatch[1] + ')');
} catch (e) {
  console.log("Error evaluating DICT", e);
  process.exit(1);
}

const guDict = DICT.gu || {};

fs.writeFileSync('gu_translations.json', JSON.stringify(guDict, null, 2));
console.log('Wrote gu_translations.json with ' + Object.keys(guDict).length + ' keys.');
