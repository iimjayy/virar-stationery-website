const fs = require('fs');
let js = fs.readFileSync('assets/js/features/language-toggle.js', 'utf8');
js = js.replace(/\\\\'/g, "\\'");
fs.writeFileSync('assets/js/features/language-toggle.js', js);
console.log('Fixed quotes.');
