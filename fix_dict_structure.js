const fs = require('fs');
let js = fs.readFileSync('assets/js/features/language-toggle.js', 'utf8');

// Find the boundaries of DICT
const dictStartMatch = js.match(/const DICT = \{\n/);
const dictStartIdx = dictStartMatch.index;

// We know the injected blocks start with "    // ── Auto Translated Deep Pages ──"
// Let's find all three occurrences.
const marker = "    // ── Auto Translated Deep Pages ──";
const parts = js.split(marker);

if (parts.length !== 4) {
  console.log("Could not find exactly 3 injected blocks.");
  process.exit(1);
}

// parts[0] is everything before the first injected block (Marathi)
// parts[1] is Marathi block
// parts[2] is Hindi block
// parts[3] is Gujarati block + "\n};\n\nconst LANG_TOAST..."

const beforeBlocks = parts[0];
const mrBlock = marker + parts[1];
const hiBlock = marker + parts[2];
let guBlockRaw = marker + parts[3];

// The Gujarati block ends with "\n};\n\nconst LANG_TOAST..."
const endMarker = "\n};\n";
const endIdx = guBlockRaw.indexOf(endMarker);
const guBlock = guBlockRaw.substring(0, endIdx);
const afterDict = guBlockRaw.substring(endIdx + endMarker.length);

// Now we need to insert mrBlock inside mr: {}, hiBlock inside hi: {}, guBlock inside gu: {}
// In beforeBlocks, mr: { ... }, hi: { ... }, gu: { ... }

let newJS = beforeBlocks;

// Replace end of mr: {}
newJS = newJS.replace(/\n  \},\n  hi: \{/, '\n' + mrBlock + '  },\n  hi: {');

// Replace end of hi: {}
newJS = newJS.replace(/\n  \},\n  gu: \{/, '\n' + hiBlock + '  },\n  gu: {');

// Replace end of gu: {}
newJS = newJS.replace(/\n  \}\n$/, '\n' + guBlock + '  }\n');

// Reconstruct file
newJS = newJS + "\n};\n" + afterDict;

fs.writeFileSync('assets/js/features/language-toggle.js', newJS);
console.log('Fixed DICT structure.');
