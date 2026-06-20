const fs = require('fs');

const improvedGu = {
  "Home": "હોમ",
  "Stationery": "સ્ટેશનરી",
  "Printing Services": "પ્રિન્ટિંગ સેવાઓ",
  "Xerox": "ઝેરોક્ષ",
  "Lamination": "લેમિનેશન",
  "Binding": "બાઇન્ડિંગ",
  "Passport Photos": "પાસપોર્ટ ફોટા",
  "Pricing": "કિંમતો",
  "Gallery": "ગેલેરી",
  "Contact": "સંપર્ક",
  "Need urgent prints today? Share files on WhatsApp and get a quick quote in minutes.": "શું આજે તાત્કાલિક પ્રિન્ટની જરૂર છે? WhatsApp પર ફાઇલો મોકલો અને મિનિટોમાં કિંમત જાણો.",
  "WhatsApp Quote": "WhatsApp પર કિંમત જાણો",
  "Call Shop": "દુકાન પર કૉલ કરો",
  "VIRAR'S TRUSTED STATIONERY, PRINTING & XEROX DESTINATION": "વિરારનું સૌથી વિશ્વસનીય સ્ટેશનરી, પ્રિન્ટિંગ અને ઝેરોક્ષ ડેસ્ટિનેશન",
  "Your One-Stop Shop for": "તમામ જરૂરિયાતો માટે એકમાત્ર સ્થળ:",
  "Printing": "પ્રિન્ટિંગ",
  "in Virar": "વિરારમાં",
  "Serving students, offices and local businesses with fast Xerox, colour printing, lamination, binding, passport photos and stationery essentials.": "વિદ્યાર્થીઓ, ઑફિસો અને સ્થાનિક વ્યવસાયોને ઝડપી ઝેરોક્ષ, કલર પ્રિન્ટિંગ, લેમિનેશન, બાઇન્ડિંગ, પાસપોર્ટ ફોટા અને સ્ટેશનરીની સુવિધાઓ પ્રદાન કરીએ છીએ.",
  "Fast prints. Reliable service.": "ઝડપી પ્રિન્ટિંગ. ભરોસાપાત્ર સેવા.",
  "Send Files on WhatsApp": "WhatsApp પર ફાઇલો મોકલો",
  "Call Now": "અત્યારે જ કૉલ કરો",
  "10+ Years Serving Virar": "10+ વર્ષથી વિરારમાં સેવારત",
  "2,00,000+ Happy Customers": "2,00,000+ સંતુષ્ટ ગ્રાહકો",
  "Same-Day Delivery Available": "તે જ દિવસે ડિલિવરી ઉપલબ્ધ",
  "Open 7 Days · 8am - 9pm": "7 દિવસ ખુલ્લું · સવારે 8 થી રાત્રે 9",
  "Bulk Orders Accepted": "મોટા ઓર્ડર સ્વીકારવામાં આવે છે",
  "For offices, schools and projects": "ઑફિસો, શાળાઓ અને પ્રોજેક્ટ્સ માટે",
  "Passport Photos in 10 Minutes": "10 મિનિટમાં પાસપોર્ટ ફોટા",
  "Quick photo print service": "ઝડપી ફોટો પ્રિન્ટ સેવા",
  "Print Documents": "દસ્તાવેજો પ્રિન્ટ કરો",
  "Fast print support for forms and files.": "ફોર્મ અને ફાઇલો માટે ઝડપી પ્રિન્ટ સપોર્ટ.",
  "WhatsApp Inquiry": "WhatsApp દ્વારા પૂછપરછ",
  "Send files and questions instantly.": "ફાઇલો અને પ્રશ્નો તરત મોકલો.",
  "Talk directly for urgent orders.": "તાત્કાલિક ઓર્ડર માટે સીધી વાત કરો.",
  "Get Directions": "દિશા નિર્દેશો મેળવો",
  "Find the exact shop location quickly.": "દુકાનનું ચોક્કસ લોકેશન સરળતાથી શોધો.",
  "View Services": "સેવાઓ જુઓ",
  "See all available printing options.": "તમામ ઉપલબ્ધ પ્રિન્ટિંગ વિકલ્પો જુઓ.",
  "Ask for Prices": "કિંમતો પૂછો",
  "Check starting rates before visiting.": "મુલાકાત લેતા પહેલા શરૂઆતી કિંમતો તપાસો.",
  "Popular Services": "લોકપ્રિય સેવાઓ",
  "Most requested services with starting prices": "સૌથી વધુ માંગવામાં આવતી સેવાઓ અને તેમની શરૂઆતી કિંમતો",
  "Indicative prices to help customers estimate costs quickly.": "ગ્રાહકોને અંદાજિત ખર્ચ જાણવામાં મદદ કરવા માટે કિંમતો.",
  "Most Popular": "સૌથી લોકપ્રિય",
  "Xerox / Photocopy": "ઝેરોક્ષ / ફોટોકોપી",
  "Starting from": "શરૂઆતી કિંમત",
  "Colour Printout": "કલર પ્રિન્ટઆઉટ",
  "Spiral Binding": "સ્પાયરલ બાઇન્ડિંગ",
  "Smart Card": "સ્માર્ટ કાર્ડ",
  "Instant Quote": "તાત્કાલિક અંદાજ",
  "Calculate your print estimate in seconds": "સેકન્ડોમાં તમારી પ્રિન્ટનો અંદાજિત ખર્ચ જાણો",
  "Get a quick price estimate before you WhatsApp your files. Final pricing is confirmed at the shop.": "ફાઇલો WhatsApp કરતા પહેલા કિંમતનો અંદાજ મેળવો. અંતિમ કિંમત દુકાન પર નક્કી કરવામાં આવશે.",
  "Select a service": "સેવા પસંદ કરો",
  "Pick the service you want to estimate.": "જે સેવાનો અંદાજ જોઈતો હોય તે પસંદ કરો.",
  "Service Type": "સેવાનો પ્રકાર",
  "Select service": "સેવા પસંદ કરો",
  "Black &amp; White Printing": "બ્લેક એન્ડ વ્હાઇટ પ્રિન્ટિંગ",
  "Color Printing": "કલર પ્રિન્ટિંગ",
  "Jumbo Xerox": "જમ્બો ઝેરોક્ષ",
  "Choose options": "વિકલ્પો પસંદ કરો",
  "Size, color, and quantity help us estimate accurately.": "કદ, રંગ અને માત્રા અમને સચોટ અંદાજ આપવામાં મદદ કરે છે.",
  "Paper Size": "કાગળનું કદ",
  "Standard": "પ્રમાણભૂત (Standard)",
  "Print Type": "પ્રિન્ટનો પ્રકાર",
  "Black &amp; White": "બ્લેક એન્ડ વ્હાઇટ",
  "Color": "કલર",
  "Quantity": "માત્રા",
  "Add finishing services": "ફિનિશિંગ સેવાઓ ઉમેરો",
  "Optional add-ons that improve presentation and durability.": "વૈકલ્પિક સુવિધાઓ જે દેખાવ અને ટકાઉપણું સુધારે છે.",
  "Estimates update instantly. Final pricing depends on paper choice and file details.": "અંદાજો તરત જ અપડેટ થાય છે. અંતિમ કિંમત કાગળની પસંદગી અને ફાઇલની વિગતો પર આધારિત છે.",
  "Upload PDF": "PDF અપલોડ કરો",
  "(Optional)": "(વૈકલ્પિક)",
  "Drop your PDF and we'll count the pages automatically.": "તમારી PDF અહીં ડ્રોપ કરો અને અમે આપમેળે પેજ ગણી લઈશું.",
  "Drop PDF here or": "PDF અહીં ડ્રોપ કરો અથવા",
  "browse": "બ્રાઉઝ કરો",
  "Page count auto-fills quantity · Max 25 MB": "પેજની ગણતરી આપમેળે માત્રા ભરી દેશે · મહત્તમ 25 MB",
  "Your Estimate": "તમારો અંદાજ",
  "Live pricing": "લાઇવ કિંમતો",
  "Per Unit": "પ્રતિ યુનિટ",
  "Total Cost": "કુલ ખર્ચ",
  "Select a service to calculate pricing.": "કિંમતની ગણતરી કરવા માટે સેવા પસંદ કરો.",
  "Send Quote on WhatsApp": "WhatsApp પર અંદાજ મોકલો",
  "All estimates are indicative and confirmed after file review.": "તમામ અંદાજો માત્ર જાણકારી માટે છે અને ફાઇલ જોયા પછી કન્ફર્મ કરવામાં આવશે.",
  "Downloads": "ડાઉનલોડ્સ",
  "Quick PDF guides for pricing and services": "કિંમતો અને સેવાઓ માટે ઝડપી PDF ગાઈડ્સ",
  "Download the latest price list and service guide to plan your visit or office order.": "તમારી મુલાકાત અથવા ઑફિસના ઓર્ડરના પ્લાનિંગ માટે લેટેસ્ટ પ્રાઇસ લિસ્ટ અને સર્વિસ ગાઈડ ડાઉનલોડ કરો.",
  "Price List PDF": "પ્રાઇસ લિસ્ટ PDF",
  "Updated pricing overview for popular printing and xerox services.": "લોકપ્રિય પ્રિન્ટિંગ અને ઝેરોક્ષ સેવાઓ માટે અપડેટેડ પ્રાઇસ લિસ્ટ.",
  "Download Price List": "પ્રાઇસ લિસ્ટ ડાઉનલોડ કરો",
  "Service Guide PDF": "સર્વિસ ગાઈડ PDF",
  "Service details, turnaround times, and ordering tips in one file.": "સેવાની વિગતો, સમય અને ઓર્ડર માટેની ટિપ્સ એક જ ફાઇલમાં.",
  "Download Service Guide": "સર્વિસ ગાઈડ ડાઉનલોડ કરો",
  "How It Works": "તે કેવી રીતે કામ કરે છે",
  "Simple 3-step process for faster service": "ઝડપી સેવા માટે સરળ 3-સ્ટેપ પ્રક્રિયા",
  "From WhatsApp file sharing to easy pickup at the shop.": "WhatsApp પર ફાઇલ શેર કરવાથી લઈને દુકાન પરથી સરળતાથી પિકઅપ કરવા સુધી.",
  "Send your file on WhatsApp": "તમારી ફાઇલ WhatsApp પર મોકલો",
  "Share documents, images, or print instructions directly.": "દસ્તાવેજો, છબીઓ અથવા પ્રિન્ટ માટેની સૂચનાઓ સીધી મોકલો.",
  "Confirm print details and quantity": "પ્રિન્ટની વિગતો અને માત્રા કન્ફર્મ કરો",
  "Approve paper, copies, size, and final cost quickly.": "કાગળ, નકલો, કદ અને અંતિમ કિંમત ઝડપથી મંજૂર કરો.",
  "Visit the shop and collect your order": "દુકાનની મુલાકાત લો અને તમારો ઓર્ડર મેળવો",
  "Pickup at Virar Stationery & Jumbo Xerox with ease.": "વિરાર સ્ટેશનરી અને જમ્બો ઝેરોક્ષ પરથી સરળતાથી પિકઅપ કરો.",
  "Printing, Xerox & Stationery Services": "પ્રિન્ટિંગ, ઝેરોક્ષ અને સ્ટેશનરી સેવાઓ",
  "Fast, Reliable & Affordable Services for Students, Offices and Everyday Needs": "વિદ્યાર્થીઓ, ઑફિસો અને રોજિંદી જરૂરિયાતો માટે ઝડપી, વિશ્વસનીય અને વાજબી સેવાઓ",
  "From colour printouts and xerox to lamination, binding and stationery, we provide everything you need under one roof in Virar.": "કલર પ્રિન્ટઆઉટ અને ઝેરોક્ષથી લઈને લેમિનેશન, બાઇન્ડિંગ અને સ્ટેશનરી સુધી, વિરારમાં એક જ છત નીચે અમે તમારી તમામ જરૂરિયાતો પૂરી કરીએ છીએ.",
  "Black & White Printing": "બ્લેક એન્ડ વ્હાઇટ પ્રિન્ટિંગ",
  "Sharp monochrome prints for forms, assignments, reports and office documents.": "ફોર્મ, અસાઇનમેન્ટ, રિપોર્ટ અને ઑફિસના દસ્તાવેજો માટે શાર્પ બ્લેક એન્ડ વ્હાઇટ પ્રિન્ટ્સ.",
  "Learn More": "વધુ જાણો",
  "Vibrant colour prints for presentations, brochures, posters and project work.": "પ્રેઝન્ટેશન, બ્રોશર, પોસ્ટર અને પ્રોજેક્ટ વર્ક માટે આકર્ષક કલર પ્રિન્ટ્સ.",
  "Affordable photocopying for books, forms, IDs and daily office needs.": "પુસ્તકો, ફોર્મ, આઈડી અને રોજિંદા ઑફિસના કામ માટે વાજબી ભાવે ફોટોકોપી.",
  "Protect important certificates, ID cards and documents with durable lamination.": "મહત્વપૂર્ણ પ્રમાણપત્રો, આઈડી કાર્ડ્સ અને દસ્તાવેજોને ટકાઉ લેમિનેશન વડે સુરક્ષિત કરો.",
  "Professional binding for project reports, files and presentations.": "પ્રોજેક્ટ રિપોર્ટ્સ, ફાઇલો અને પ્રેઝન્ટેશન માટે પ્રોફેશનલ બાઇન્ડિંગ.",
  "Quick passport-size photo prints with clean framing and fast delivery.": "શાર્પ ફ્રેમિંગ અને ઝડપી ડિલિવરી સાથે ઇન્સ્ટન્ટ પાસપોર્ટ સાઇઝ ફોટો પ્રિન્ટ્સ.",
  "Project Printing": "પ્રોજેક્ટ પ્રિન્ટિંગ",
  "Complete support for school and college projects with print and finishing options.": "પ્રિન્ટ અને ફિનિશિંગ વિકલ્પો સાથે શાળા અને કૉલેજના પ્રોજેક્ટ્સ માટે સંપૂર્ણ સપોર્ટ.",
  "Stationery Products": "સ્ટેશનરી ઉત્પાદનો",
  "Daily-use stationery, notebooks, pens, files, and office essentials in one place.": "રોજિંદા ઉપયોગની સ્ટેશનરી, નોટબુક, પેન, ફાઇલો અને ઑફિસની જરૂરી વસ્તુઓ એક જ જગ્યાએ.",
  "Blackbook Printing": "બ્લેકબુક પ્રિન્ટિંગ",
  "Clear and durable blackbook print service for projects, records, and submissions.": "પ્રોજેક્ટ્સ, રેકોર્ડ્સ અને સબમિશન માટે સ્પષ્ટ અને ટકાઉ બ્લેકબુક પ્રિન્ટ સેવા.",
  "Letterhead Print": "લેટરહેડ પ્રિન્ટ",
  "Professional letterhead printing for offices, shops, and local business branding.": "ઑફિસો, દુકાનો અને સ્થાનિક બિઝનેસ બ્રાન્ડિંગ માટે પ્રોફેશનલ લેટરહેડ પ્રિન્ટિંગ.",
  "Visiting Card": "વિઝિટિંગ કાર્ડ",
  "Neat visiting card printing with quality finish for personal and business use.": "વ્યક્તિગત અને વ્યાપારી ઉપયોગ માટે ઉત્તમ ફિનિશિંગ સાથે વિઝિટિંગ કાર્ડ પ્રિન્ટિંગ.",
  "Billbook Print": "બિલબુક પ્રિન્ટ",
  "Custom billbook printing for daily billing, invoicing, and store operations.": "રોજિંદા બિલિંગ, ઇન્વોઇસિંગ અને દુકાનના કામકાજ માટે કસ્ટમ બિલબુક પ્રિન્ટિંગ.",
  "Smart card printing for ID cards, membership cards, office cards and custom cards. Starting from &#8377;80.": "ID કાર્ડ્સ, મેમ્બરશિપ કાર્ડ્સ, ઑફિસ કાર્ડ્સ અને કસ્ટમ કાર્ડ્સ માટે સ્માર્ટ કાર્ડ પ્રિન્ટિંગ. ₹80 થી શરૂ.",
  "Large-size xerox and copy solutions available in A3, A2, A1, A0, A00 for drawings, plans, posters, and charts.": "ડ્રોઇંગ, પ્લાન, પોસ્ટર અને ચાર્ટ માટે A3, A2, A1, A0, A00 સાઇઝમાં મોટા કદના ઝેરોક્ષ અને કોપી સોલ્યુશન્સ ઉપલબ્ધ છે.",
  "Cartridge Refilling": "કાર્ટ્રિજ રિફિલિંગ",
  "Reliable ink and toner cartridge refilling for regular office and home printing.": "નિયમિત ઑફિસ અને ઘરના પ્રિન્ટિંગ માટે વિશ્વસનીય શાહી અને ટોનર કાર્ટ્રિજ રિફિલિંગ.",
  "All Size Scanning": "તમામ સાઇઝનું સ્કેનિંગ",
  "Document scanning support in multiple sizes for records, forms, and submissions.": "રેકોર્ડ્સ, ફોર્મ અને સબમિશન માટે વિવિધ સાઇઝમાં ડોક્યુમેન્ટ સ્કેનિંગ સપોર્ટ.",
  "Computer Accessories": "કમ્પ્યુટર એસેસરીઝ",
  "Essential computer accessories including cables, peripherals, and daily-use items.": "કેબલ્સ, પેરિફેરલ્સ અને રોજિંદા ઉપયોગની વસ્તુઓ સહિત કમ્પ્યુટર એસેસરીઝ.",
  "Why Choose Us": "અમને કેમ પસંદ કરવા",
  "Why Virar Chooses Us": "વિરાર અમને કેમ પસંદ કરે છે",
  "Fast service, affordable pricing, professional quality, and trusted support for students, offices, and families across Virar.": "વિરારના વિદ્યાર્થીઓ, ઑફિસો અને પરિવારો માટે ઝડપી સેવા, વાજબી કિંમત, પ્રોફેશનલ ગુણવત્તા અને ભરોસાપાત્ર સપોર્ટ.",
  "Fast Turnaround": "ઝડપી સર્વિસ",
  "Urgent printouts, xerox, lamination, and project work completed quickly with same-day service available.": "તાત્કાલિક પ્રિન્ટઆઉટ, ઝેરોક્ષ, લેમિનેશન અને પ્રોજેક્ટ વર્ક ઝડપથી પૂર્ણ કરવામાં આવે છે, તે જ દિવસે સેવા ઉપલબ્ધ છે.",
  "Most Chosen": "સૌથી વધુ પસંદ કરાયેલ",
  "Affordable Pricing": "વાજબી કિંમતો",
  "Budget-friendly rates for students, offices, bulk orders, and everyday printing needs.": "વિદ્યાર્થીઓ, ઑફિસો, મોટા ઓર્ડર અને રોજિંદી પ્રિન્ટિંગ જરૂરિયાતો માટે બજેટને અનુકૂળ કિંમતો.",
  "Professional Quality": "પ્રોફેશનલ ગુણવત્તા",
  "Sharp printing, neat finishing, accurate colours, and premium-quality materials for every order.": "દરેક ઓર્ડર માટે શાર્પ પ્રિન્ટિંગ, સ્વચ્છ ફિનિશિંગ, સચોટ રંગો અને ઉચ્ચ ગુણવત્તાવાળી સામગ્રી.",
  "Trusted Local Support": "વિશ્વસનીય લોકલ સપોર્ટ",
  "Friendly assistance, WhatsApp ordering, quick guidance, and reliable service trusted across Virar.": "વિરારમાં વિશ્વાસપાત્ર સેવા, WhatsApp ઓર્ડરિંગ, અને મૈત્રીપૂર્ણ માર્ગદર્શન.",
  "10+ Years in Virar": "વિરારમાં 10+ વર્ષ",
  "200,000+ Customers Served Since 2016": "2016 થી 200,000+ ગ્રાહકોની સેવા",
  "Same-Day Service": "તે જ દિવસે સેવા",
  "Open 7 Days a Week": "અઠવાડિયાના 7 દિવસ ખુલ્લું",
  "Featured Products": "વિશેષ ઉત્પાદનો",
  "Stationery essentials for school, college, and office use": "શાળા, કૉલેજ અને ઑફિસના ઉપયોગ માટે જરૂરી સ્ટેશનરી",
  "Quality stationery essentials for students, offices, and businesses — available at our shop.": "વિદ્યાર્થીઓ, ઑફિસો અને વ્યવસાયો માટે ઉત્તમ ગુણવત્તાવાળી સ્ટેશનરી — અમારી દુકાન પર ઉપલબ્ધ છે.",
  "Pens": "પેન",
  "Reliable writing tools for everyday use.": "રોજિંદા ઉપયોગ માટે ભરોસાપાત્ર રાઇટિંગ ટૂલ્સ.",
  "Notebooks": "નોટબુક",
  "Durable notebooks for study and office notes.": "અભ્યાસ અને ઑફિસની નોંધો માટે ટકાઉ નોટબુક.",
  "Files": "ફાઇલો",
  "Keep documents sorted and ready to present.": "દસ્તાવેજોને વ્યવસ્થિત રાખો અને પ્રેઝન્ટેશન માટે તૈયાર રાખો.",
  "Art Supplies": "કળા સામગ્રી",
  "Materials for creative school and hobby work.": "શાળા અને શોખના સર્જનાત્મક કાર્યો માટે સામગ્રી.",
  "Calculators": "કેલ્ક્યુલેટર",
  "Useful calculators for class and work tasks.": "વર્ગ અને કામ માટે ઉપયોગી કેલ્ક્યુલેટર.",
  "Charts": "ચાર્ટ્સ",
  "Classroom and project charts that stand out.": "વર્ગખંડ અને પ્રોજેક્ટ માટે આકર્ષક ચાર્ટ્સ.",
  "Project Materials": "પ્રોજેક્ટ સામગ્રી",
  "All the pieces needed for neat project work.": "સ્વચ્છ પ્રોજેક્ટ વર્ક માટે જરૂરી તમામ સામગ્રી.",
  "Sticky Notes": "સ્ટીકી નોટ્સ",
  "Handy notes for reminders and planning.": "રિમાઇન્ડર અને પ્લાનિંગ માટે ઉપયોગી નોટ્સ.",
  "Inside the Shop": "દુકાનની અંદર",
  "A quick look at our daily work, printing setup, stationery shelves, and customer service.": "અમારા રોજિંદા કામ, પ્રિન્ટિંગ સેટઅપ, સ્ટેશનરી શેલ્ફ અને ગ્રાહક સેવાની એક ઝલક.",
  "What customers say": "ગ્રાહકો શું કહે છે",
  "What our customers say about their experience.": "અમારા ગ્રાહકો તેમના અનુભવ વિશે શું કહે છે.",
  "I needed 80 pages of my final year project printed and spiral bound urgently. They finished it in under 30 minutes — print quality was sharp and the binding looked professional. I've been coming here since first year and they never disappoint.": "મારે મારા ફાઇનલ યર પ્રોજેક્ટના 80 પેજની તાત્કાલિક પ્રિન્ટ અને સ્પાયરલ બાઇન્ડિંગની જરૂર હતી. તેઓએ તે 30 મિનિટથી ઓછા સમયમાં પૂરું કર્યું — પ્રિન્ટની ગુણવત્તા શાનદાર હતી અને બાઇન્ડિંગ પ્રોફેશનલ લાગતું હતું. હું પહેલા વર્ષથી અહીં આવું છું અને તેઓ ક્યારેય નિરાશ કરતા નથી.",
  "Engineering Student, Viva College": "એન્જિનિયરિંગની વિદ્યાર્થીની, વિવા કૉલેજ",
  "Thesis Printing & Binding": "થીસીસ પ્રિન્ટિંગ અને બાઇન્ડિંગ",
  "We get our office letterheads, visiting cards, and daily xerox done here. The uncle and his team are very reliable — pricing is always fair and they remember our preferences. Best print shop in Virar West, hands down.": "અમે અમારા ઑફિસના લેટરહેડ્સ, વિઝિટિંગ કાર્ડ્સ અને રોજિંદી ઝેરોક્ષ અહીંથી કરાવીએ છીએ. અંકલ અને તેમની ટીમ ખૂબ જ ભરોસાપાત્ર છે — કિંમતો હંમેશાં વાજબી હોય છે અને તેઓ અમારી પસંદગીઓ યાદ રાખે છે. વિરાર પશ્ચિમમાં શ્રેષ્ઠ પ્રિન્ટ શૉપ.",
  "Office Manager, Local Business": "ઑફિસ મેનેજર, લોકલ બિઝનેસ",
  "Name": "નામ",
  "Phone Number": "ફોન નંબર",
  "Email (Optional)": "ઇમેઇલ (વૈકલ્પિક)",
  "Business / Institution (Optional)": "વ્યવસાય / સંસ્થા (વૈકલ્પિક)",
  "Service Required": "જરૂરી સેવા",
  "Expected Quantity": "અંદાજિત માત્રા",
  "Project Description / Special Requests": "પ્રોજેક્ટનું વર્ણન / વિશેષ વિનંતીઓ",
  "Send Enquiry via WhatsApp": "WhatsApp દ્વારા પૂછપરછ મોકલો",
  "Our Location": "અમારું સરનામું",
  "Old Viva College Rd, Virar West, Virar, Maharashtra 401303": "ઓલ્ડ વિવા કોલેજ રોડ, વિરાર વેસ્ટ, વિરાર, મહારાષ્ટ્ર 401303",
  "Business Hours": "કામકાજના કલાકો",
  "Monday - Sunday": "સોમવાર - રવિવાર",
  "8:00 AM - 9:00 PM": "સવારે 8:00 - રાત્રે 9:00",
  "Quick Links": "ઝડપી લિંક્સ",
  "All Rights Reserved.": "સર્વાધિકાર સુરક્ષિત.",
  "Order Tracking Status": "ઓર્ડર ટ્રેકિંગ સ્થિતિ"
};

let js = fs.readFileSync('assets/js/features/language-toggle.js', 'utf8');

const guStart = js.indexOf('  gu: {');
if (guStart === -1) {
  console.log("Could not find gu: {");
  process.exit(1);
}

const guEnd = js.indexOf('\n};\n', guStart);
let beforeGu = js.substring(0, guStart + 7);
let guBlock = js.substring(guStart + 7, guEnd);
let afterGu = js.substring(guEnd);

let replacementsMade = 0;

for (let [key, val] of Object.entries(improvedGu)) {
  let safeKey = key.replace(/'/g, "\\'");
  let safeVal = val.replace(/'/g, "\\'");

  // The regex ensures we match exactly the line with the key
  const regex = new RegExp(`^\\s*'${safeKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}':\\s*'.*?',?$`, 'm');
  
  if (regex.test(guBlock)) {
    guBlock = guBlock.replace(regex, `    '${safeKey}': '${safeVal}',`);
    replacementsMade++;
  } else {
    // If the key is completely missing in guBlock, we inject it at the end of the gu block.
    // Ensure there's a comma for the previous line if we append.
    guBlock = guBlock.trimEnd();
    if (!guBlock.endsWith(',')) guBlock += ',';
    guBlock += `\n    '${safeKey}': '${safeVal}',\n  `;
    replacementsMade++;
  }
}

// Make sure guBlock ends cleanly with `  }`
guBlock = guBlock.trimEnd();
if (guBlock.endsWith(',')) {
    guBlock = guBlock.slice(0, -1);
}
guBlock += '\n  }';

let newJS = beforeGu + '\n' + guBlock + afterGu;

fs.writeFileSync('assets/js/features/language-toggle.js', newJS);
console.log('Successfully updated Gujarati translations. Replacements made: ' + replacementsMade);

