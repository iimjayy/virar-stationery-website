const fs = require('fs');

const keywordMap = [
  // Xerox
  { pattern: /ઝેરોક્ષ/g, replacement: 'Xerox' },
  { pattern: /ज़ेरॉक्स/g, replacement: 'Xerox' },
  { pattern: /झेरॉक्स/g, replacement: 'Xerox' },
  { pattern: /જમ્બો Xerox/g, replacement: 'Jumbo Xerox' },
  { pattern: /जंबो Xerox/g, replacement: 'Jumbo Xerox' },

  // Print / Printing
  { pattern: /પ્રિન્ટિંગ/g, replacement: 'Printing' },
  { pattern: /પ્રિન્ટ્સ/g, replacement: 'Prints' },
  { pattern: /પ્રિન્ટ/g, replacement: 'Print' },
  
  { pattern: /प्रिंटिंग/g, replacement: 'Printing' },
  { pattern: /प्रिंट्स/g, replacement: 'Prints' },
  { pattern: /प्रिंट/g, replacement: 'Print' },

  // Lamination
  { pattern: /લેમિનેશન/g, replacement: 'Lamination' },
  { pattern: /लैमिनेशन/g, replacement: 'Lamination' },
  { pattern: /लॅमिनेशन/g, replacement: 'Lamination' },

  // Binding
  { pattern: /બાઇન્ડિંગ/g, replacement: 'Binding' },
  { pattern: /बाइंडिंग/g, replacement: 'Binding' },
  { pattern: /स्पाइरल Binding/g, replacement: 'Spiral Binding' },
  { pattern: /સ્પાયરલ Binding/g, replacement: 'Spiral Binding' },
  { pattern: /स्पायरल Binding/g, replacement: 'Spiral Binding' },

  // WhatsApp
  { pattern: /વોટ્સએપ/g, replacement: 'WhatsApp' },
  { pattern: /वॉट्सऐप/g, replacement: 'WhatsApp' },
  { pattern: /व्हाट्सएप/g, replacement: 'WhatsApp' },
  { pattern: /व्हॉट्सॲप/g, replacement: 'WhatsApp' },
  { pattern: /व्हाट्सअॅप/g, replacement: 'WhatsApp' },

  // PDF
  { pattern: /પીડીએફ/g, replacement: 'PDF' },
  { pattern: /पीडीएफ/g, replacement: 'PDF' },

  // Smart Card
  { pattern: /સ્માર્ટ કાર્ડ/g, replacement: 'Smart Card' },
  { pattern: /स्मार्ट कार्ड/g, replacement: 'Smart Card' },

  // ID
  { pattern: /આઈડી/g, replacement: 'ID' },
  { pattern: /आईडी/g, replacement: 'ID' },
  { pattern: /आयडी/g, replacement: 'ID' },

  // GSM
  { pattern: /જીએસએમ/g, replacement: 'GSM' },
  { pattern: /जीएसएम/g, replacement: 'GSM' },
  
  // Others
  { pattern: /સ્ટેશનરી/g, replacement: 'Stationery' },
  { pattern: /स्टेशनरी/g, replacement: 'Stationery' },
  
  { pattern: /પાસપોર્ટ/g, replacement: 'Passport' },
  { pattern: /पासपोर्ट/g, replacement: 'Passport' },
];

let js = fs.readFileSync('assets/js/features/language-toggle.js', 'utf8');
let lines = js.split('\n');

let inDictBlock = false;
let replacementsCount = 0;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const DICT = {')) {
    inDictBlock = true;
    continue;
  }
  
  if (inDictBlock && lines[i] === '};') {
    inDictBlock = false;
    break;
  }

  if (inDictBlock) {
    let line = lines[i];
    let match = line.match(/^(\s*'[^']+'\s*:\s*')([^']+)((?:',?|",?))$/);
    if (!match) match = line.match(/^(\s*"[^"]+"\s*:\s*")([^"]+)((?:",?|',?))$/);
    
    if (match) {
      let prefix = match[1];
      let value = match[2];
      let suffix = match[3];
      
      let origValue = value;
      for (let kw of keywordMap) {
        value = value.replace(kw.pattern, kw.replacement);
      }
      
      if (value !== origValue) {
        lines[i] = prefix + value + suffix;
        replacementsCount++;
      }
    }
  }
}

fs.writeFileSync('assets/js/features/language-toggle.js', lines.join('\n'));
console.log('Lines updated: ' + replacementsCount);
