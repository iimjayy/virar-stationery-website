const fs = require('fs');

const improvedGu = {
  "Printing": "પ્રિન્ટિંગ",
  "Fast print support for forms and files.": "ફોર્મ અને ફાઇલો માટે ઝડપી પ્રિન્ટ સપોર્ટ.",
  "Send files and questions instantly.": "ફાઇલો અને પ્રશ્નો તરત મોકલો.",
  "Talk directly for urgent orders.": "તાત્કાલિક ઓર્ડર માટે સીધી વાત કરો.",
  "Find the exact shop location quickly.": "દુકાનનું ચોક્કસ લોકેશન સરળતાથી શોધો.",
  "See all available printing options.": "તમામ ઉપલબ્ધ પ્રિન્ટિંગ વિકલ્પો જુઓ.",
  "Check starting rates before visiting.": "મુલાકાત લેતા પહેલા શરૂઆતી કિંમતો તપાસો.",
  "Most requested services with starting prices": "સૌથી વધુ માંગવામાં આવતી સેવાઓ અને તેમની શરૂઆતી કિંમતો",
  "Indicative prices to help customers estimate costs quickly.": "ગ્રાહકોને અંદાજિત ખર્ચ જાણવામાં મદદ કરવા માટે કિંમતો.",
  "Get a quick price estimate before you WhatsApp your files. Final pricing is confirmed at the shop.": "ફાઇલો WhatsApp કરતા પહેલા કિંમતનો અંદાજ મેળવો. અંતિમ કિંમત દુકાન પર નક્કી કરવામાં આવશે.",
  "Pick the service you want to estimate.": "જે સેવાનો અંદાજ જોઈતો હોય તે પસંદ કરો.",
  "Black &amp; White Printing": "બ્લેક એન્ડ વ્હાઇટ પ્રિન્ટિંગ",
  "Color Printing": "કલર પ્રિન્ટિંગ",
  "Jumbo Xerox": "જમ્બો ઝેરોક્ષ",
  "Size, color, and quantity help us estimate accurately.": "કદ, રંગ અને માત્રા અમને સચોટ અંદાજ આપવામાં મદદ કરે છે.",
  "Paper Size": "કાગળનું કદ",
  "Standard": "પ્રમાણભૂત (Standard)",
  "Print Type": "પ્રિન્ટનો પ્રકાર",
  "Black &amp; White": "બ્લેક એન્ડ વ્હાઇટ",
  "Color": "કલર",
  "Quantity": "માત્રા",
  "Optional add-ons that improve presentation and durability.": "વૈકલ્પિક સુવિધાઓ જે દેખાવ અને ટકાઉપણું સુધારે છે.",
  "Estimates update instantly. Final pricing depends on paper choice and file details.": "અંદાજો તરત જ અપડેટ થાય છે. અંતિમ કિંમત કાગળની પસંદગી અને ફાઇલની વિગતો પર આધારિત છે.",
  "Upload PDF": "PDF અપલોડ કરો",
  "(Optional)": "(વૈકલ્પિક)",
  "Drop your PDF and we'll count the pages automatically.": "તમારી PDF અહીં ડ્રોપ કરો અને અમે આપમેળે પેજ ગણી લઈશું.",
  "Drop PDF here or": "PDF અહીં ડ્રોપ કરો અથવા",
  "browse": "બ્રાઉઝ કરો",
  "Page count auto-fills quantity · Max 25 MB": "પેજની ગણતરી આપમેળે માત્રા ભરી દેશે · મહત્તમ 25 MB",
  "Live pricing": "લાઇવ કિંમતો",
  "Per Unit": "પ્રતિ યુનિટ",
  "Total Cost": "કુલ ખર્ચ",
  "Select a service to calculate pricing.": "કિંમતની ગણતરી કરવા માટે સેવા પસંદ કરો.",
  "Send Quote on WhatsApp": "WhatsApp પર અંદાજ મોકલો",
  "All estimates are indicative and confirmed after file review.": "તમામ અંદાજો માત્ર જાણકારી માટે છે અને ફાઇલ જોયા પછી કન્ફર્મ કરવામાં આવશે.",
  "Quick PDF guides for pricing and services": "કિંમતો અને સેવાઓ માટે ઝડપી PDF ગાઈડ્સ",
  "Download the latest price list and service guide to plan your visit or office order.": "તમારી મુલાકાત અથવા ઑફિસના ઓર્ડરના પ્લાનિંગ માટે લેટેસ્ટ પ્રાઇસ લિસ્ટ અને સર્વિસ ગાઈડ ડાઉનલોડ કરો.",
  "Updated pricing overview for popular printing and xerox services.": "લોકપ્રિય પ્રિન્ટિંગ અને ઝેરોક્ષ સેવાઓ માટે અપડેટેડ પ્રાઇસ લિસ્ટ.",
  "Download Price List": "પ્રાઇસ લિસ્ટ ડાઉનલોડ કરો",
  "Service details, turnaround times, and ordering tips in one file.": "સેવાની વિગતો, સમય અને ઓર્ડર માટેની ટિપ્સ એક જ ફાઇલમાં.",
  "Download Service Guide": "સર્વિસ ગાઈડ ડાઉનલોડ કરો",
  "Simple 3-step process for faster service": "ઝડપી સેવા માટે સરળ 3-સ્ટેપ પ્રક્રિયા",
  "From WhatsApp file sharing to easy pickup at the shop.": "WhatsApp પર ફાઇલ શેર કરવાથી લઈને દુકાન પરથી સરળતાથી પિકઅપ કરવા સુધી.",
  "Share documents, images, or print instructions directly.": "દસ્તાવેજો, છબીઓ અથવા પ્રિન્ટ માટેની સૂચનાઓ સીધી મોકલો.",
  "Confirm print details and quantity": "પ્રિન્ટની વિગતો અને માત્રા કન્ફર્મ કરો",
  "Approve paper, copies, size, and final cost quickly.": "કાગળ, નકલો, કદ અને અંતિમ કિંમત ઝડપથી મંજૂર કરો.",
  "Visit the shop and collect your order": "દુકાનની મુલાકાત લો અને તમારો ઓર્ડર મેળવો",
  "Pickup at Virar Stationery & Jumbo Xerox with ease.": "વિરાર સ્ટેશનરી અને જમ્બો ઝેરોક્ષ પરથી સરળતાથી પિકઅપ કરો.",
  "Fast, Reliable & Affordable Services for Students, Offices and Everyday Needs": "વિદ્યાર્થીઓ, ઑફિસો અને રોજિંદી જરૂરિયાતો માટે ઝડપી, વિશ્વસનીય અને વાજબી સેવાઓ",
  "From colour printouts and xerox to lamination, binding and stationery, we provide everything you need under one roof in Virar.": "કલર પ્રિન્ટઆઉટ અને ઝેરોક્ષથી લઈને લેમિનેશન, બાઇન્ડિંગ અને સ્ટેશનરી સુધી, વિરારમાં એક જ છત નીચે અમે તમારી તમામ જરૂરિયાતો પૂરી કરીએ છીએ.",
  "Sharp monochrome prints for forms, assignments, reports and office documents.": "ફોર્મ, અસાઇનમેન્ટ, રિપોર્ટ અને ઑફિસના દસ્તાવેજો માટે શાર્પ બ્લેક એન્ડ વ્હાઇટ પ્રિન્ટ્સ.",
  "Learn More": "વધુ જાણો",
  "Vibrant colour prints for presentations, brochures, posters and project work.": "પ્રેઝન્ટેશન, બ્રોશર, પોસ્ટર અને પ્રોજેક્ટ વર્ક માટે આકર્ષક કલર પ્રિન્ટ્સ.",
  "Affordable photocopying for books, forms, IDs and daily office needs.": "પુસ્તકો, ફોર્મ, આઈડી અને રોજિંદા ઑફિસના કામ માટે વાજબી ભાવે ફોટોકોપી.",
  "Protect important certificates, ID cards and documents with durable lamination.": "મહત્વપૂર્ણ પ્રમાણપત્રો, આઈડી કાર્ડ્સ અને દસ્તાવેજોને ટકાઉ લેમિનેશન વડે સુરક્ષિત કરો.",
  "Professional binding for project reports, files and presentations.": "પ્રોજેક્ટ રિપોર્ટ્સ, ફાઇલો અને પ્રેઝન્ટેશન માટે પ્રોફેશનલ બાઇન્ડિંગ.",
  "Quick passport-size photo prints with clean framing and fast delivery.": "શાર્પ ફ્રેમિંગ અને ઝડપી ડિલિવરી સાથે ઇન્સ્ટન્ટ પાસપોર્ટ સાઇઝ ફોટો પ્રિન્ટ્સ.",
  "Complete support for school and college projects with print and finishing options.": "પ્રિન્ટ અને ફિનિશિંગ વિકલ્પો સાથે શાળા અને કૉલેજના પ્રોજેક્ટ્સ માટે સંપૂર્ણ સપોર્ટ.",
  "Daily-use stationery, notebooks, pens, files, and office essentials in one place.": "રોજિંદા ઉપયોગની સ્ટેશનરી, નોટબુક, પેન, ફાઇલો અને ઑફિસની જરૂરી વસ્તુઓ એક જ જગ્યાએ.",
  "Clear and durable blackbook print service for projects, records, and submissions.": "પ્રોજેક્ટ્સ, રેકોર્ડ્સ અને સબમિશન માટે સ્પષ્ટ અને ટકાઉ બ્લેકબુક પ્રિન્ટ સેવા.",
  "Professional letterhead printing for offices, shops, and local business branding.": "ઑફિસો, દુકાનો અને સ્થાનિક બિઝનેસ બ્રાન્ડિંગ માટે પ્રોફેશનલ લેટરહેડ પ્રિન્ટિંગ.",
  "Neat visiting card printing with quality finish for personal and business use.": "વ્યક્તિગત અને વ્યાપારી ઉપયોગ માટે ઉત્તમ ફિનિશિંગ સાથે વિઝિટિંગ કાર્ડ પ્રિન્ટિંગ.",
  "Custom billbook printing for daily billing, invoicing, and store operations.": "રોજિંદા બિલિંગ, ઇન્વોઇસિંગ અને દુકાનના કામકાજ માટે કસ્ટમ બિલબુક પ્રિન્ટિંગ.",
  "Smart card printing for ID cards, membership cards, office cards and custom cards. Starting from &#8377;80.": "ID કાર્ડ્સ, મેમ્બરશિપ કાર્ડ્સ, ઑફિસ કાર્ડ્સ અને કસ્ટમ કાર્ડ્સ માટે સ્માર્ટ કાર્ડ પ્રિન્ટિંગ. ₹80 થી શરૂ.",
  "Large-size xerox and copy solutions available in A3, A2, A1, A0, A00 for drawings, plans, posters, and charts.": "ડ્રોઇંગ, પ્લાન, પોસ્ટર અને ચાર્ટ માટે A3, A2, A1, A0, A00 સાઇઝમાં મોટા કદના ઝેરોક્ષ અને કોપી સોલ્યુશન્સ ઉપલબ્ધ છે.",
  "Reliable ink and toner cartridge refilling for regular office and home printing.": "નિયમિત ઑફિસ અને ઘરના પ્રિન્ટિંગ માટે વિશ્વસનીય શાહી અને ટોનર કાર્ટ્રિજ રિફિલિંગ.",
  "Document scanning support in multiple sizes for records, forms, and submissions.": "રેકોર્ડ્સ, ફોર્મ અને સબમિશન માટે વિવિધ સાઇઝમાં ડોક્યુમેન્ટ સ્કેનિંગ સપોર્ટ.",
  "Essential computer accessories including cables, peripherals, and daily-use items.": "કેબલ્સ, પેરિફેરલ્સ અને રોજિંદા ઉપયોગની વસ્તુઓ સહિત કમ્પ્યુટર એસેસરીઝ.",
  "Why Virar Chooses Us": "વિરાર અમને કેમ પસંદ કરે છે",
  "Fast service, affordable pricing, professional quality, and trusted support for students, offices, and families across Virar.": "વિરારના વિદ્યાર્થીઓ, ઑફિસો અને પરિવારો માટે ઝડપી સેવા, વાજબી કિંમત, પ્રોફેશનલ ગુણવત્તા અને ભરોસાપાત્ર સપોર્ટ.",
  "Urgent printouts, xerox, lamination, and project work completed quickly with same-day service available.": "તાત્કાલિક પ્રિન્ટઆઉટ, ઝેરોક્ષ, લેમિનેશન અને પ્રોજેક્ટ વર્ક ઝડપથી પૂર્ણ કરવામાં આવે છે, તે જ દિવસે સેવા ઉપલબ્ધ છે.",
  "Budget-friendly rates for students, offices, bulk orders, and everyday printing needs.": "વિદ્યાર્થીઓ, ઑફિસો, મોટા ઓર્ડર અને રોજિંદી પ્રિન્ટિંગ જરૂરિયાતો માટે બજેટને અનુકૂળ કિંમતો.",
  "Sharp printing, neat finishing, accurate colours, and premium-quality materials for every order.": "દરેક ઓર્ડર માટે શાર્પ પ્રિન્ટિંગ, સ્વચ્છ ફિનિશિંગ, સચોટ રંગો અને ઉચ્ચ ગુણવત્તાવાળી સામગ્રી.",
  "Friendly assistance, WhatsApp ordering, quick guidance, and reliable service trusted across Virar.": "વિરારમાં વિશ્વાસપાત્ર સેવા, WhatsApp ઓર્ડરિંગ, અને મૈત્રીપૂર્ણ માર્ગદર્શન.",
  "Stationery essentials for school, college, and office use": "શાળા, કૉલેજ અને ઑફિસના ઉપયોગ માટે જરૂરી સ્ટેશનરી",
  "Quality stationery essentials for students, offices, and businesses — available at our shop.": "વિદ્યાર્થીઓ, ઑફિસો અને વ્યવસાયો માટે ઉત્તમ ગુણવત્તાવાળી સ્ટેશનરી — અમારી દુકાન પર ઉપલબ્ધ છે.",
  "Reliable writing tools for everyday use.": "રોજિંદા ઉપયોગ માટે ભરોસાપાત્ર રાઇટિંગ ટૂલ્સ.",
  "Durable notebooks for study and office notes.": "અભ્યાસ અને ઑફિસની નોંધો માટે ટકાઉ નોટબુક.",
  "Keep documents sorted and ready to present.": "દસ્તાવેજોને વ્યવસ્થિત રાખો અને પ્રેઝન્ટેશન માટે તૈયાર રાખો.",
  "Materials for creative school and hobby work.": "શાળા અને શોખના સર્જનાત્મક કાર્યો માટે સામગ્રી.",
  "Useful calculators for class and work tasks.": "વર્ગ અને કામ માટે ઉપયોગી કેલ્ક્યુલેટર.",
  "Classroom and project charts that stand out.": "વર્ગખંડ અને પ્રોજેક્ટ માટે આકર્ષક ચાર્ટ્સ.",
  "All the pieces needed for neat project work.": "સ્વચ્છ પ્રોજેક્ટ વર્ક માટે જરૂરી તમામ સામગ્રી.",
  "Handy notes for reminders and planning.": "રિમાઇન્ડર અને પ્લાનિંગ માટે ઉપયોગી નોટ્સ.",
  "A quick look at our daily work, printing setup, stationery shelves, and customer service.": "અમારા રોજિંદા કામ, પ્રિન્ટિંગ સેટઅપ, સ્ટેશનરી શેલ્ફ અને ગ્રાહક સેવાની એક ઝલક.",
  "What our customers say about their experience.": "અમારા ગ્રાહકો તેમના અનુભવ વિશે શું કહે છે.",
  "Engineering Student, Viva College": "એન્જિનિયરિંગની વિદ્યાર્થીની, વિવા કૉલેજ",
  "Office Manager, Local Business": "ઑફિસ મેનેજર, લોકલ બિઝનેસ"
};

let js = fs.readFileSync('assets/js/features/language-toggle.js', 'utf8');
let lines = js.split('\n');

// 1. First, we need to find existing keys to avoid duplicates
function extractKeys(startIndex) {
  let keys = new Set();
  let inBlock = true;
  for (let i = startIndex + 1; i < lines.length; i++) {
    if (lines[i].startsWith('  },') || lines[i] === '};') {
      break;
    }
    let match = lines[i].match(/^\s*'([^']+)'\s*:/);
    if (!match) match = lines[i].match(/^\s*"([^"]+)"\s*:/);
    if (match) {
      keys.add(match[1].replace(/\\'/g, "'"));
    }
  }
  return keys;
}

let mrIdx = lines.findIndex(l => l.includes('  mr: {'));
let hiIdx = lines.findIndex(l => l.includes('  hi: {'));
let guIdx = lines.findIndex(l => l.includes('  gu: {'));

let mrKeys = extractKeys(mrIdx);
let hiKeys = extractKeys(hiIdx);
let guKeys = extractKeys(guIdx);

let newMr = [];
let newHi = [];
let newGu = [];

for (let [k, guVal] of Object.entries(improvedGu)) {
  let safeK = k.replace(/'/g, "\\'");
  let safeGuVal = guVal.replace(/'/g, "\\'");
  let safeMrHiVal = safeK; // fallback to English
  
  if (!mrKeys.has(k)) newMr.push(`    '${safeK}': '${safeMrHiVal}',`);
  if (!hiKeys.has(k)) newHi.push(`    '${safeK}': '${safeMrHiVal}',`);
  if (!guKeys.has(k)) newGu.push(`    '${safeK}': '${safeGuVal}',`);
}

// 2. Add the new lines just before the closing brace of each block
let mrEnd = lines.findIndex((l, i) => i > mrIdx && l.startsWith('  },'));
lines.splice(mrEnd, 0, ...newMr);

// Update indices since splice shifted the array
hiIdx = lines.findIndex(l => l.includes('  hi: {'));
let hiEnd = lines.findIndex((l, i) => i > hiIdx && l.startsWith('  },'));
lines.splice(hiEnd, 0, ...newHi);

guIdx = lines.findIndex(l => l.includes('  gu: {'));
let guEnd = lines.findIndex((l, i) => i > guIdx && l.startsWith('  },'));
lines.splice(guEnd, 0, ...newGu);

fs.writeFileSync('assets/js/features/language-toggle.js', lines.join('\n'));
console.log(`Added missing keys: mr: ${newMr.length}, hi: ${newHi.length}, gu: ${newGu.length}`);

