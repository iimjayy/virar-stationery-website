const fs = require('fs');

const jsContent = fs.readFileSync('assets/js/features/language-toggle.js', 'utf8');

// Extract the 'mr' dictionary to see what English keys we have
// The easiest way is to evaluate the DICT object.
const match = jsContent.match(/const DICT = (\{[\s\S]*?\n\};\n)/);
if (!match) {
  console.log("Could not find DICT");
  process.exit(1);
}

// We have to be careful with eval, but since it's our own file, it's fine.
let DICT;
try {
  eval("DICT = " + match[1]);
} catch (e) {
  console.log("Eval failed", e);
  process.exit(1);
}

const knownKeys = new Set(Object.keys(DICT.mr));

// Now parse index.html
const html = fs.readFileSync('index.html', 'utf8');

// Use a simple regex to find text between tags, and placeholders
const textMatches = html.match(/>([^<]+)</g) || [];
const placeholderMatches = html.match(/placeholder="([^"]+)"/g) || [];
const titleMatches = html.match(/title="([^"]+)"/g) || [];

const allStrings = new Set();

textMatches.forEach(m => {
  const text = m.substring(1, m.length - 1).trim();
  if (text.length > 2 && !/^[0-9\W]+$/.test(text) && !text.startsWith('<!--')) {
    allStrings.add(text);
  }
});

placeholderMatches.forEach(m => {
  const text = m.replace('placeholder="', '').replace('"', '').trim();
  if (text.length > 2) allStrings.add(text);
});

titleMatches.forEach(m => {
  const text = m.replace('title="', '').replace('"', '').trim();
  if (text.length > 2) allStrings.add(text);
});

const missing = [];
allStrings.forEach(str => {
  // Normalize slightly for comparison
  let found = false;
  for (let key of knownKeys) {
    if (key.trim() === str) {
      found = true; break;
    }
  }
  if (!found) missing.push(str);
});

console.log("Missing strings:");
missing.forEach(s => console.log(s));
