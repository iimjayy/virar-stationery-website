const fs = require('fs');

const nativeReplacements = {
  mr: {
    "Stationery": "स्टेशनरी",
    "Printing Services": "प्रिंटिंग सेवा",
    "Xerox": "झेरॉक्स",
    "Lamination": "लॅमिनेशन",
    "Binding": "बाइंडिंग",
    "VIRAR'S TRUSTED STATIONERY, PRINTING & XEROX DESTINATION": "विरारचे सर्वात विश्वासार्ह स्टेशनरी, प्रिंटिंग आणि झेरॉक्स डेस्टिनेशन",
    "Virar Stationery & Jumbo Xerox": "विरार स्टेशनरी आणि जम्बो झेरॉक्स"
  },
  hi: {
    "Stationery": "स्टेशनरी",
    "Printing Services": "प्रिंटिंग सेवाएँ",
    "Xerox": "ज़ेरॉक्स",
    "Lamination": "लैमिनेशन",
    "Binding": "बाइंडिंग",
    "VIRAR'S TRUSTED STATIONERY, PRINTING & XEROX DESTINATION": "विरार का सबसे भरोसेमंद स्टेशनरी, प्रिंटिंग और ज़ेरॉक्स डेस्टिनेशन",
    "Virar Stationery & Jumbo Xerox": "विरार स्टेशनरी और जंबो ज़ेरॉक्स"
  },
  gu: {
    "Stationery": "સ્ટેશનરી",
    "Printing Services": "પ્રિન્ટિંગ સેવાઓ",
    "Xerox": "ઝેરોક્ષ",
    "Lamination": "લેમિનેશન",
    "Binding": "બાઇન્ડિંગ",
    "VIRAR'S TRUSTED STATIONERY, PRINTING & XEROX DESTINATION": "વિરારનું સૌથી વિશ્વસનીય સ્ટેશનરી, પ્રિન્ટિંગ અને ઝેરોક્ષ ડેસ્ટિનેશન",
    "Virar Stationery & Jumbo Xerox": "વિરાર સ્ટેશનરી અને જમ્બો ઝેરોક્ષ"
  }
};

let js = fs.readFileSync('assets/js/features/language-toggle.js', 'utf8');
let lines = js.split('\n');

let currentLang = null;
let replacements = 0;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('  mr: {')) currentLang = 'mr';
  else if (lines[i].includes('  hi: {')) currentLang = 'hi';
  else if (lines[i].includes('  gu: {')) currentLang = 'gu';
  else if (lines[i].startsWith('  },')) currentLang = null;

  if (currentLang && nativeReplacements[currentLang]) {
    let line = lines[i];
    let match = line.match(/^(\s*)('|")([^'"]+)\2(\s*:\s*)('|")([^'"]+)\5(,?)(\s*)$/);
    if (!match) continue;

    let key = match[3];
    let keyUnescaped = key.replace(/\\'/g, "'");

    if (nativeReplacements[currentLang][keyUnescaped]) {
      let newVal = nativeReplacements[currentLang][keyUnescaped];
      let newValEscaped = newVal.replace(/'/g, "\\'");
      let prefix = match[1] + match[2] + key + match[2] + match[4];
      let quote = match[5];
      let suffix = match[7] + match[8];

      lines[i] = prefix + quote + newValEscaped + quote + suffix;
      replacements++;
    }
  }
}

fs.writeFileSync('assets/js/features/language-toggle.js', lines.join('\n'));
console.log('Fixed nav and logo translations: ' + replacements);

