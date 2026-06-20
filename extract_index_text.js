const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

// Use a simple regex to extract text between tags
let textMatches = html.match(/>([^<]+)</g);
let keys = new Set();

if (textMatches) {
  textMatches.forEach(match => {
    let text = match.slice(1, -1).trim();
    // remove newlines and extra spaces inside
    text = text.replace(/\s+/g, ' ');
    if (text.length > 1 && /[A-Za-z]/.test(text)) {
      keys.add(text);
    }
  });
}

// Also get specific attributes
const attrMatches = html.match(/(placeholder|title|aria-label)="([^"]+)"/g);
if (attrMatches) {
  attrMatches.forEach(match => {
    let text = match.split('="')[1].slice(0, -1).trim();
    if (text.length > 1 && /[A-Za-z]/.test(text)) {
      keys.add(text);
    }
  });
}

const keysArray = Array.from(keys);
fs.writeFileSync('index_keys.json', JSON.stringify(keysArray, null, 2));
console.log('Found ' + keysArray.length + ' keys in index.html');
