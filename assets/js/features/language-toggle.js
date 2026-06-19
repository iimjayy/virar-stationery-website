/**
 * @fileoverview Smart Language Toggle — Virar Stationery Website
 * 
 * Uses a DOM TreeWalker to find and replace ALL visible text nodes on the page.
 * No data-i18n attributes required on HTML elements — works on the entire document.
 * 
 * Strategy: Build a phrase dictionary (EN → target language), then walk every
 * text node in <body> and do exact-match or trimmed-match replacements.
 */

import { showEnquiryToast } from '../core/toast.js';

'use strict';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'virar-lang';
const LANG_CYCLE  = ['en', 'mr', 'hi'];

const LANG_TOAST = {
  en: 'Language: English',
  mr: 'भाषा: मराठी',
  hi: 'भाषा: हिंदी',
};

const LANG_LABEL = { en: 'EN', mr: 'मर', hi: 'हि' };

// ---------------------------------------------------------------------------
// Complete phrase dictionary — every visible string on the page
// ---------------------------------------------------------------------------
const DICT = {
  mr: {
    // ── Navigation ──
    'Home': 'मुख्यपृष्ठ',
    'Stationery': 'स्टेशनरी',
    'Printing Services': 'प्रिंटिंग सेवा',
    'Xerox': 'झेरॉक्स',
    'Lamination': 'लॅमिनेशन',
    'Binding': 'बाइंडिंग',
    'Passport Photos': 'पासपोर्ट फोटो',
    'Gallery': 'गॅलरी',
    'Contact': 'संपर्क',

    // ── Hero ──
    "VIRAR'S TRUSTED STATIONERY, PRINTING & XEROX DESTINATION":
      'विरारचे विश्वासू स्टेशनरी, प्रिंटिंग आणि झेरॉक्स केंद्र',
    'Your One-Stop Shop for Printing, Xerox & Stationery in Virar':
      'विरारमधील प्रिंटिंग, झेरॉक्स आणि स्टेशनरीसाठी एकच ठिकाण',
    'Serving students, offices and local businesses with fast Xerox, colour printing, lamination, binding, passport photos and stationery essentials.':
      'विद्यार्थी, कार्यालये आणि स्थानिक व्यवसायांना जलद झेरॉक्स, रंगीत प्रिंटिंग, लॅमिनेशन, बाइंडिंग, पासपोर्ट फोटो आणि स्टेशनरीसह सेवा.',
    'Fast prints. Reliable service.': 'जलद प्रिंट्स. विश्वासार्ह सेवा.',
    'Send Files on WhatsApp': 'WhatsApp वर फाईल्स पाठवा',
    'Call Now': 'आत्ता कॉल करा',
    '10+ Years Serving Virar': '१०+ वर्षे विरारची सेवा',
    '2,00,000+ Happy Customers': '२,००,०००+ आनंदी ग्राहक',
    'Same-Day Delivery Available': 'त्याच दिवशी डिलिव्हरी उपलब्ध',
    'Open 7 Days · 8am - 9pm': '७ दिवस खुले · सकाळी ८ - रात्री ९',
    'Bulk Orders Accepted': 'बल्क ऑर्डर स्वीकारल्या जातात',
    'For offices, schools and projects': 'कार्यालये, शाळा आणि प्रकल्पांसाठी',
    'Passport Photos in 10 Minutes': '१० मिनिटांत पासपोर्ट फोटो',
    'Quick photo print service': 'जलद फोटो प्रिंट सेवा',

    // ── Quick Actions ──
    'Print Documents': 'दस्तऐवज प्रिंट करा',
    'Fast print support for forms and files.': 'फॉर्म आणि फाईल्ससाठी जलद प्रिंट सपोर्ट.',
    'WhatsApp Inquiry': 'WhatsApp चौकशी',
    'Send files and questions instantly.': 'फाईल्स आणि प्रश्न त्वरित पाठवा.',
    'Talk directly for urgent orders.': 'तातडीच्या ऑर्डरसाठी थेट बोला.',
    'Get Directions': 'दिशा मिळवा',
    'Find the exact shop location quickly.': 'दुकानाचे नेमके ठिकाण पटकन शोधा.',
    'View Services': 'सेवा पहा',
    'See all available printing options.': 'उपलब्ध सर्व प्रिंटिंग पर्याय पहा.',
    'Ask for Prices': 'किमती विचारा',
    'Check starting rates before visiting.': 'भेट देण्यापूर्वी सुरुवातीचे दर तपासा.',

    // ── Pricing ──
    'Popular Services': 'लोकप्रिय सेवा',
    'Most requested services with starting prices': 'सर्वाधिक मागणी असलेल्या सेवा आणि सुरुवातीचे दर',
    'Indicative prices to help customers estimate costs quickly.': 'ग्राहकांना खर्चाचा अंदाज लवकर घेण्यासाठी अंदाजित किमती.',
    'Most Popular': 'सर्वाधिक लोकप्रिय',
    'Xerox / Photocopy': 'झेरॉक्स / फोटोकॉपी',
    'Starting from ₹1.5': 'सुरुवात ₹१.५ पासून',
    'Colour Printout': 'रंगीत प्रिंटआउट',
    'Starting from ₹10': 'सुरुवात ₹१० पासून',
    'Spiral Binding': 'स्पायरल बाइंडिंग',
    'Starting from ₹30': 'सुरुवात ₹३० पासून',
    'Starting from ₹80': 'सुरुवात ₹८० पासून',
    'Smart Card': 'स्मार्ट कार्ड',

    // ── Quote Calculator ──
    'Instant Quote': 'तत्काळ अंदाज',
    'Calculate your print estimate in seconds': 'सेकंदात तुमच्या प्रिंटचा अंदाज काढा',
    'Get a quick price estimate before you WhatsApp your files. Final pricing is confirmed at the shop.':
      'WhatsApp वर फाईल पाठवण्यापूर्वी जलद किमतीचा अंदाज घ्या. अंतिम किंमत दुकानात निश्चित होते.',
    'Select a service': 'सेवा निवडा',
    'Pick the service you want to estimate.': 'तुम्हाला अंदाज काढायची सेवा निवडा.',
    'Service Type': 'सेवेचा प्रकार',
    'Black & White Printing': 'काळे-पांढरे प्रिंटिंग',
    'Color Printing': 'रंगीत प्रिंटिंग',
    'Jumbo Xerox': 'जम्बो झेरॉक्स',
    'Choose options': 'पर्याय निवडा',
    'Size, color, and quantity help us estimate accurately.': 'आकार, रंग आणि प्रमाण अचूक अंदाजासाठी मदत करतात.',
    'Paper Size': 'कागदाचा आकार',
    'Standard': 'मानक',
    'Print Type': 'प्रिंटचा प्रकार',
    'Black & White': 'काळे-पांढरे',
    'Color': 'रंगीत',
    'Quantity': 'प्रमाण',
    'Add finishing services': 'फिनिशिंग सेवा जोडा',
    'Optional add-ons that improve presentation and durability.': 'सादरीकरण आणि टिकाऊपणा सुधारणारे पर्यायी ॲड-ऑन.',
    'Estimates update instantly. Final pricing depends on paper choice and file details.':
      'अंदाज त्वरित अपडेट होतो. अंतिम किंमत कागद आणि फाईलच्या तपशीलावर अवलंबून असते.',
    'Upload PDF': 'PDF अपलोड करा',
    '(Optional)': '(पर्यायी)',
    "Drop your PDF and we'll count the pages automatically.": 'तुमची PDF टाका आणि आम्ही पाने आपोआप मोजू.',
    'Drop PDF here or browse': 'PDF येथे टाका किंवा ब्राउझ करा',
    'Page count auto-fills quantity · Max 25 MB': 'पान संख्या आपोआप भरते · कमाल २५ MB',
    'Your Estimate': 'तुमचा अंदाज',
    'Live pricing': 'थेट किंमत',
    'Per Unit': 'प्रति युनिट',
    'Total Cost': 'एकूण खर्च',
    'Select a service to calculate pricing.': 'किंमत मोजण्यासाठी सेवा निवडा.',
    'Send Quote on WhatsApp': 'WhatsApp वर अंदाज पाठवा',
    'All estimates are indicative and confirmed after file review.': 'सर्व अंदाज सूचक आहेत आणि फाईल तपासणीनंतर निश्चित केले जातात.',

    // ── Downloads ──
    'Downloads': 'डाउनलोड्स',
    'Quick PDF guides for pricing and services': 'किमती आणि सेवांसाठी जलद PDF मार्गदर्शिका',
    'Download the latest price list and service guide to plan your visit or office order.':
      'भेटीची किंवा कार्यालयीन ऑर्डरची योजना करण्यासाठी नवीनतम दरपत्रक आणि सेवा मार्गदर्शिका डाउनलोड करा.',
    'Price List PDF': 'दरपत्रक PDF',
    'Updated pricing overview for popular printing and xerox services.': 'लोकप्रिय प्रिंटिंग आणि झेरॉक्स सेवांचे अपडेट केलेले दर.',
    'Download Price List': 'दरपत्रक डाउनलोड करा',
    'Service Guide PDF': 'सेवा मार्गदर्शिका PDF',
    'Service details, turnaround times, and ordering tips in one file.': 'सेवेचे तपशील, वेळ आणि ऑर्डरच्या टिपा एका फाईलमध्ये.',
    'Download Service Guide': 'सेवा मार्गदर्शिका डाउनलोड करा',

    // ── How It Works ──
    'How It Works': 'कसे काम करते',
    'Simple 3-step process for faster service': 'जलद सेवेसाठी सोपी ३-चरण प्रक्रिया',
    'From WhatsApp file sharing to easy pickup at the shop.': 'WhatsApp वर फाईल शेअर करण्यापासून ते दुकानात सहज पिकअपपर्यंत.',
    'Send your file on WhatsApp': 'WhatsApp वर तुमची फाईल पाठवा',
    'Share documents, images, or print instructions directly.': 'दस्तऐवज, प्रतिमा किंवा प्रिंट सूचना थेट शेअर करा.',
    'Confirm print details and quantity': 'प्रिंट तपशील आणि प्रमाण निश्चित करा',
    'Approve paper, copies, size, and final cost quickly.': 'कागद, प्रती, आकार आणि अंतिम खर्च पटकन मंजूर करा.',
    'Visit the shop and collect your order': 'दुकानाला भेट द्या आणि तुमची ऑर्डर घ्या',
    'Pickup at Virar Stationery & Jumbo Xerox with ease.': 'विरार स्टेशनरी आणि जम्बो झेरॉक्स येथून सहज पिकअप करा.',

    // ── Services ──
    'Printing, Xerox & Stationery Services': 'प्रिंटिंग, झेरॉक्स आणि स्टेशनरी सेवा',
    'Fast, Reliable & Affordable Services for Students, Offices and Everyday Needs':
      'विद्यार्थी, कार्यालये आणि दैनंदिन गरजांसाठी जलद, विश्वासार्ह आणि परवडणाऱ्या सेवा',
    'From colour printouts and xerox to lamination, binding and stationery, we provide everything you need under one roof in Virar.':
      'रंगीत प्रिंटआउट आणि झेरॉक्स ते लॅमिनेशन, बाइंडिंग आणि स्टेशनरी, विरारमध्ये एकाच छताखाली सर्व काही.',
    'Sharp monochrome prints for forms, assignments, reports and office documents.':
      'फॉर्म, असाइनमेंट, अहवाल आणि कार्यालयीन कागदपत्रांसाठी तीक्ष्ण मोनोक्रोम प्रिंट्स.',
    'Vibrant colour prints for presentations, brochures, posters and project work.':
      'सादरीकरण, ब्रोशर, पोस्टर आणि प्रकल्प कार्यासाठी दोलायमान रंगीत प्रिंट्स.',
    'Affordable photocopying for books, forms, IDs and daily office needs.':
      'पुस्तके, फॉर्म, ओळखपत्रे आणि दैनंदिन कार्यालयीन गरजांसाठी परवडणारी फोटोकॉपी.',
    'Protect important certificates, ID cards and documents with durable lamination.':
      'महत्त्वाची प्रमाणपत्रे, ओळखपत्रे आणि कागदपत्रे टिकाऊ लॅमिनेशनने सुरक्षित करा.',
    'Professional binding for project reports, files and presentations.':
      'प्रकल्प अहवाल, फाईल्स आणि सादरीकरणांसाठी व्यावसायिक बाइंडिंग.',
    'Quick passport-size photo prints with clean framing and fast delivery.':
      'स्वच्छ फ्रेमिंग आणि जलद डिलिव्हरीसह त्वरित पासपोर्ट-आकाराचे फोटो प्रिंट.',
    'Complete support for school and college projects with print and finishing options.':
      'प्रिंट आणि फिनिशिंग पर्यायांसह शालेय आणि महाविद्यालयीन प्रकल्पांसाठी संपूर्ण सपोर्ट.',
    'Daily-use stationery, notebooks, pens, files, and office essentials in one place.':
      'दैनंदिन वापराची स्टेशनरी, नोटबुक, पेन, फाईल्स आणि कार्यालयीन आवश्यक वस्तू एकाच ठिकाणी.',
    'Learn More': 'अधिक जाणून घ्या',
    'Project Printing': 'प्रकल्प प्रिंटिंग',
    'Stationery Products': 'स्टेशनरी उत्पादने',
    'Blackbook Printing': 'ब्लॅकबुक प्रिंटिंग',
    'Letterhead Print': 'लेटरहेड प्रिंट',
    'Visiting Card': 'व्हिजिटिंग कार्ड',
    'Billbook Print': 'बिलबुक प्रिंट',
    'Cartridge Refilling': 'काट्रिज रिफिलिंग',
    'All Size Scanning': 'सर्व आकाराचे स्कॅनिंग',
    'Computer Accessories': 'संगणक सहाय्यक',

    // ── Why Choose Us ──
    'Why Choose Us': 'आम्हालाच का निवडावे',
    'Why Virar Chooses Us': 'विरार आम्हाला का निवडतो',
    'Fast service, affordable pricing, professional quality, and trusted support for students, offices, and families across Virar.':
      'विरारमधील विद्यार्थी, कार्यालये आणि कुटुंबांसाठी जलद सेवा, परवडणाऱ्या किमती, व्यावसायिक गुणवत्ता आणि विश्वासार्ह सपोर्ट.',
    'Fast Turnaround': 'जलद सेवा',
    'Urgent printouts, xerox, lamination, and project work completed quickly with same-day service available.':
      'तातडीचे प्रिंटआउट, झेरॉक्स, लॅमिनेशन आणि प्रकल्प कार्य त्याच दिवशी जलद पूर्ण.',
    'Most Chosen': 'सर्वाधिक निवडले',
    'Affordable Pricing': 'परवडणाऱ्या किमती',
    'Budget-friendly rates for students, offices, bulk orders, and everyday printing needs.':
      'विद्यार्थी, कार्यालये, बल्क ऑर्डर आणि दैनंदिन प्रिंटिंग गरजांसाठी बजेट-अनुकूल दर.',
    'Professional Quality': 'व्यावसायिक गुणवत्ता',
    'Sharp printing, neat finishing, accurate colours, and premium-quality materials for every order.':
      'प्रत्येक ऑर्डरसाठी तीक्ष्ण प्रिंटिंग, नीटनेटके फिनिशिंग, अचूक रंग आणि उच्च-दर्जाची सामग्री.',
    'Trusted Local Support': 'विश्वासार्ह स्थानिक सपोर्ट',
    'Friendly assistance, WhatsApp ordering, quick guidance, and reliable service trusted across Virar.':
      'मैत्रीपूर्ण सहाय्य, WhatsApp ऑर्डर, जलद मार्गदर्शन आणि विरारभर विश्वासार्ह सेवा.',
    '10+ Years in Virar': '१०+ वर्षे विरारमध्ये',
    '200000+ Happy Customers': '२,००,०००+ आनंदी ग्राहक',
    'Same-Day Service': 'त्याच दिवशी सेवा',
    'Open 7 Days a Week': 'आठवड्यातून ७ दिवस खुले',

    // ── Stationery Products ──
    'Featured Products': 'वैशिष्ट्यीकृत उत्पादने',
    'Stationery essentials for school, college, and office use': 'शाळा, महाविद्यालय आणि कार्यालयासाठी स्टेशनरी',
    'Quality stationery essentials for students, offices, and businesses — available at our shop.':
      'विद्यार्थी, कार्यालये आणि व्यवसायांसाठी दर्जेदार स्टेशनरी — आमच्या दुकानात उपलब्ध.',
    'Pens': 'पेन',
    'Reliable writing tools for everyday use.': 'दैनंदिन वापरासाठी विश्वासार्ह लेखन साधने.',
    'Notebooks': 'नोटबुक',
    'Durable notebooks for study and office notes.': 'अभ्यास आणि कार्यालयीन नोट्ससाठी टिकाऊ नोटबुक.',
    'Files': 'फाईल्स',
    'Keep documents sorted and ready to present.': 'कागदपत्रे व्यवस्थित आणि सादर करण्यास तयार ठेवा.',
    'Art Supplies': 'कला साहित्य',
    'Materials for creative school and hobby work.': 'शालेय आणि छंदाच्या कामासाठी साहित्य.',
    'Calculators': 'कॅल्क्युलेटर',
    'Useful calculators for class and work tasks.': 'वर्ग आणि कामाच्या कार्यांसाठी उपयुक्त कॅल्क्युलेटर.',
    'Charts': 'चार्ट',
    'Classroom and project charts that stand out.': 'वर्गखोली आणि प्रकल्पासाठी उठावदार चार्ट.',
    'Project Materials': 'प्रकल्प साहित्य',
    'All the pieces needed for neat project work.': 'नीटनेटक्या प्रकल्प कार्यासाठी सर्व आवश्यक घटक.',
    'Sticky Notes': 'स्टिकी नोट्स',
    'Handy notes for reminders and planning.': 'आठवणी आणि नियोजनासाठी सोयीस्कर नोट्स.',

    // ── Gallery ──
    'GALLERY': 'गॅलरी',
    'Inside the Shop': 'दुकानाच्या आतील दृश्य',
    'A quick look at our daily work, printing setup, stationery shelves, and customer service.':
      'आमचे दैनंदिन काम, प्रिंटिंग सेटअप, स्टेशनरी शेल्व्ह आणि ग्राहक सेवेचा एक झलक.',

    // ── Testimonials ──
    'Testimonials': 'ग्राहकांचे अभिप्राय',
    'What customers say': 'ग्राहक काय म्हणतात',
    'What our customers say about their experience.': 'आमच्या ग्राहकांनी त्यांच्या अनुभवाबद्दल काय सांगितले.',
    'Very quick service and the print quality is excellent. I get my project work done here every time.':
      'खूप जलद सेवा आणि प्रिंट गुणवत्ता उत्कृष्ट आहे. मी माझे प्रकल्प काम येथे नेहमी करतो.',
    'Student': 'विद्यार्थी',
    'Best place for stationery and xerox in the area. Friendly staff and fair pricing.':
      'परिसरातील स्टेशनरी आणि झेरॉक्ससाठी सर्वोत्तम ठिकाण. मैत्रीपूर्ण कर्मचारी आणि योग्य किंमती.',
    'Local Customer': 'स्थानिक ग्राहक',
    'They handled our office printing and binding efficiently. Smooth experience from start to finish.':
      'त्यांनी आमच्या कार्यालयीन प्रिंटिंग आणि बाइंडिंगला कार्यक्षमतेने हाताळले. सुरुवातीपासून शेवटपर्यंत सुरळीत अनुभव.',
    'Office Executive': 'कार्यालयीन अधिकारी',

    // ── Trust Counters ──
    'Local Trust': 'स्थानिक विश्वास',
    "Virar's trusted print partner in numbers": 'विरारचा विश्वासू प्रिंट भागीदार आकड्यांमध्ये',
    'Real local volume, consistent support, and dependable turnaround for students, offices, and families.':
      'खरे स्थानिक प्रमाण, सातत्यपूर्ण सपोर्ट आणि विद्यार्थी, कार्यालये व कुटुंबांसाठी विश्वासार्ह वेळ.',
    'Years Serving Virar': 'वर्षे विरारची सेवा',
    'Customer Visits': 'ग्राहकांच्या भेटी',
    'Days Open Every Week': 'दर आठवड्यात खुले दिवस',
    'Typical Fast Order Time': 'सामान्य जलद ऑर्डर वेळ',

    // ── Order Status ──
    'Track Your Order': 'तुमची ऑर्डर ट्रॅक करा',
    'Check Your Print Order Status': 'तुमच्या प्रिंट ऑर्डरची स्थिती तपासा',
    'Enter your order ID or the last 4 digits of your phone number to see real-time status.':
      'रिअल-टाइम स्थिती पाहण्यासाठी तुमचा Order ID किंवा फोन नंबरचे शेवटचे ४ अंक टाका.',
    'Order ID or Phone Number': 'Order ID किंवा फोन नंबर',
    'Track Order': 'ऑर्डर ट्रॅक करा',
    "Try VS-2026-0847 or last 4 digits 2757 to see a demo.": 'डेमो पाहण्यासाठी VS-2026-0847 किंवा शेवटचे ४ अंक 2757 वापरा.',
    "Can't find your order?": 'तुमची ऑर्डर सापडत नाही?',
    'Ask on WhatsApp': 'WhatsApp वर विचारा',

    // ── FAQ ──
    'FAQs': 'वारंवार विचारले जाणारे प्रश्न',
    'Answers to common customer questions': 'ग्राहकांच्या सामान्य प्रश्नांची उत्तरे',
    'Quick guidance before you visit or place your print order on WhatsApp.':
      'भेट देण्यापूर्वी किंवा WhatsApp वर प्रिंट ऑर्डर देण्यापूर्वी त्वरित मार्गदर्शन.',
    'Do you accept urgent same-day print orders?': 'तुम्ही तातडीच्या त्याच दिवशी प्रिंट ऑर्डर स्वीकारता का?',
    'Yes. Most urgent print and xerox jobs are completed the same day depending on queue and file size.':
      'होय. बहुतेक तातडीचे प्रिंट आणि झेरॉक्स काम रांग आणि फाईलच्या आकारावर अवलंबून त्याच दिवशी पूर्ण होते.',
    "Can I send files on WhatsApp before coming to the shop?": 'दुकानात येण्यापूर्वी मी WhatsApp वर फाईल्स पाठवू शकतो का?',
    'Absolutely. Share your file and required quantity on WhatsApp, and we will confirm timing and price quickly.':
      'नक्कीच. WhatsApp वर तुमची फाईल आणि आवश्यक प्रमाण शेअर करा, आणि आम्ही वेळ आणि किंमत पटकन निश्चित करू.',
    'Do you provide student discounts for project prints?': 'तुम्ही प्रकल्प प्रिंट्ससाठी विद्यार्थी सूट देता का?',
    'Yes, student-friendly pricing is available for selected services and bulk project printing requests.':
      'होय, निवडक सेवा आणि बल्क प्रकल्प प्रिंटिंग विनंत्यांसाठी विद्यार्थी-अनुकूल किंमत उपलब्ध आहे.',
    'Which payment options are available at the shop?': 'दुकानात कोणते पेमेंट पर्याय उपलब्ध आहेत?',
    'You can pay via UPI, cash, and common digital methods available at local retail counters.':
      'तुम्ही UPI, रोख आणि स्थानिक किरकोळ काउंटरवर उपलब्ध सामान्य डिजिटल पद्धतींनी पेमेंट करू शकता.',
    'Can offices place recurring monthly print orders?': 'कार्यालये नियमित मासिक प्रिंट ऑर्डर देऊ शकतात का?',
    'Yes. Regular office requirements can be planned with priority turnaround and quantity-based rates.':
      'होय. नियमित कार्यालयीन आवश्यकता प्राधान्य वेळ आणि प्रमाण-आधारित दरांसह नियोजित केल्या जाऊ शकतात.',

    // ── Bulk Enquiry ──
    'Bulk / Business Enquiry': 'बल्क / व्यवसाय चौकशी',
    'Priority support for offices, schools, and large orders': 'कार्यालये, शाळा आणि मोठ्या ऑर्डरसाठी प्राधान्य सपोर्ट',
    'Share your requirements, attach files, and get a fast response with tailored pricing.':
      'तुमच्या आवश्यकता शेअर करा, फाईल्स जोडा आणि अनुकूलित किमतींसह जलद प्रतिसाद मिळवा.',
    'Made for high-volume needs': 'उच्च-प्रमाण गरजांसाठी',
    'Get priority turnaround and business-friendly pricing for repeat orders.':
      'पुनरावृत्ती ऑर्डरसाठी प्राधान्य वेळ आणि व्यवसाय-अनुकूल किंमत मिळवा.',
    'Dedicated response for bulk printing': 'बल्क प्रिंटिंगसाठी समर्पित प्रतिसाद',
    'Custom bundles for schools and offices': 'शाळा आणि कार्यालयांसाठी कस्टम बंडल',
    'File review and delivery guidance': 'फाईल तपासणी आणि डिलिव्हरी मार्गदर्शन',
    'Support for recurring monthly orders': 'नियमित मासिक ऑर्डरसाठी सपोर्ट',
    'Need urgent help?': 'तातडीची मदत हवी आहे?',
    'WhatsApp now': 'आत्ता WhatsApp करा',
    'Business details': 'व्यवसायाचे तपशील',
    'Tell us who is placing the order.': 'ऑर्डर कोण देत आहे ते सांगा.',
    'Name': 'नाव',
    'Business / Organization': 'व्यवसाय / संस्था',
    'Phone': 'फोन',
    'Email (Optional)': 'ईमेल (पर्यायी)',
    'Order requirements': 'ऑर्डरच्या आवश्यकता',
    'Share service type and quantity details.': 'सेवेचा प्रकार आणि प्रमाणाचे तपशील शेअर करा.',
    'Service Required': 'आवश्यक सेवा',
    'Select a service': 'सेवा निवडा',
    'Description': 'वर्णन',
    'Paper size, color, deadline, delivery notes': 'कागदाचा आकार, रंग, अंतिम तारीख, डिलिव्हरी नोट्स',
    'Upload files (optional)': 'फाईल्स अपलोड करा (पर्यायी)',
    'Drag & drop files to speed up the quote.': 'अंदाज जलद करण्यासाठी फाईल्स ड्रॅग आणि ड्रॉप करा.',
    'Tap to select or drop your file here': 'फाईल निवडण्यासाठी टॅप करा किंवा येथे टाका',
    'PDF, DOC, JPG up to 10MB': 'PDF, DOC, JPG १०MB पर्यंत',
    'Browse file': 'फाईल ब्राउझ करा',
    'Share file on WhatsApp': 'WhatsApp वर फाईल शेअर करा',
    'WhatsApp will open. Attach the file if prompted.': 'WhatsApp उघडेल. सांगितल्यास फाईल जोडा.',
    'Submit Business Enquiry': 'व्यवसाय चौकशी सबमिट करा',
    'WhatsApp Direct': 'थेट WhatsApp',

    // ── Contact ──
    'Contact Us': 'आमच्याशी संपर्क करा',
    'Visit the shop or send an inquiry': 'दुकानाला भेट द्या किंवा चौकशी पाठवा',
    'Find our shop quickly, call or WhatsApp instantly, and send your inquiry anytime.':
      'आमचे दुकान पटकन शोधा, त्वरित कॉल किंवा WhatsApp करा आणि कधीही चौकशी पाठवा.',
    'Shop Details': 'दुकानाचे तपशील',
    'Address': 'पत्ता',
    'Today': 'आज',
    'Open Today · 8:30 AM – 9:00 PM': 'आज खुले · सकाळी ८:३० - रात्री ९:००',
    'Send a Message': 'संदेश पाठवा',
    'Phone Number (Optional)': 'फोन नंबर (पर्यायी)',
    'Service Needed': 'आवश्यक सेवा',
    'Message': 'संदेश',
    'Get Free Quote': 'मोफत अंदाज मिळवा',
    'WhatsApp Quote': 'WhatsApp अंदाज',

    // ── Footer ──
    'Virar Stationery & Jumbo Xerox': 'विरार स्टेशनरी आणि जम्बो झेरॉक्स',
    'Printing, stationery, xerox and lamination services in Virar.': 'विरारमध्ये प्रिंटिंग, स्टेशनरी, झेरॉक्स आणि लॅमिनेशन सेवा.',
    'Trusted by students, offices and families across Virar': 'विरारमधील विद्यार्थी, कार्यालये आणि कुटुंबांचा विश्वास',
    'Open Today · 8am – 9pm': 'आज खुले · सकाळी ८ - रात्री ९',
    'Quick Links': 'जलद लिंक्स',
    'Services': 'सेवा',
    'Printing': 'प्रिंटिंग',
    'Privacy Policy': 'गोपनीयता धोरण',
    'Terms': 'अटी',
    'Sitemap': 'साइटमॅप',
    '© 2026 Virar Stationery & Jumbo Xerox. All rights reserved.': '© २०२६ विरार स्टेशनरी आणि जम्बो झेरॉक्स. सर्व हक्क राखीव.',

    // ── Mobile Bar / Chat ──
    'WhatsApp': 'WhatsApp',
    'Call': 'कॉल',
    'Directions': 'दिशा',
    'Chat with us': 'आमच्याशी चॅट करा',
    'Quick help in seconds': 'सेकंदात जलद मदत',
    'Hi! How can we help you today?': 'नमस्कार! आम्ही आज तुमची कशी मदत करू शकतो?',
    'Try a quick option below.': 'खाली एक जलद पर्याय वापरा.',
    'Send files': 'फाईल्स पाठवा',
    'Check price': 'किंमत तपासा',
    'Location': 'स्थान',
    'Continue on WhatsApp': 'WhatsApp वर सुरू ठेवा',
  },

  hi: {
    // ── Navigation ──
    'Home': 'होम',
    'Stationery': 'स्टेशनरी',
    'Printing Services': 'Printing सेवाएँ',
    'Xerox': 'Xerox',
    'Lamination': 'Lamination',
    'Binding': 'Binding',
    'Passport Photos': 'पासपोर्ट फोटो',
    'Gallery': 'गैलरी',
    'Contact': 'संपर्क',

    // ── Hero ──
    "VIRAR'S TRUSTED STATIONERY, PRINTING & XEROX DESTINATION":
      'विरार का विश्वसनीय स्टेशनरी, Printing और Xerox केंद्र',
    'Your One-Stop Shop for Printing, Xerox & Stationery in Virar':
      'विरार में Printing, Xerox और Stationery के लिए एक ही जगह',
    'Serving students, offices and local businesses with fast Xerox, colour printing, lamination, binding, passport photos and stationery essentials.':
      'विद्यार्थियों, कार्यालयों और स्थानीय व्यवसायों को तेज़ Xerox, रंगीन Printing, Lamination, Binding, पासपोर्ट फोटो और स्टेशनरी के साथ सेवा।',
    'Fast prints. Reliable service.': 'तेज़ प्रिंट। विश्वसनीय सेवा।',
    'Send Files on WhatsApp': 'WhatsApp पर फ़ाइलें भेजें',
    'Call Now': 'अभी कॉल करें',
    '10+ Years Serving Virar': '10+ साल विरार की सेवा',
    '2,00,000+ Happy Customers': '2,00,000+ खुश ग्राहक',
    'Same-Day Delivery Available': 'उसी दिन डिलीवरी उपलब्ध',
    'Open 7 Days · 8am - 9pm': '7 दिन खुला · सुबह 8 - रात 9',
    'Bulk Orders Accepted': 'Bulk Orders स्वीकार किए जाते हैं',
    'For offices, schools and projects': 'कार्यालयों, स्कूलों और प्रोजेक्ट्स के लिए',
    'Passport Photos in 10 Minutes': '10 मिनट में पासपोर्ट फोटो',
    'Quick photo print service': 'त्वरित फोटो प्रिंट सेवा',

    // ── Quick Actions ──
    'Print Documents': 'दस्तावेज़ Print करें',
    'Fast print support for forms and files.': 'फॉर्म और फ़ाइलों के लिए तेज़ प्रिंट सपोर्ट।',
    'WhatsApp Inquiry': 'WhatsApp पूछताछ',
    'Send files and questions instantly.': 'फ़ाइलें और सवाल तुरंत भेजें।',
    'Talk directly for urgent orders.': 'तत्काल ऑर्डर के लिए सीधे बात करें।',
    'Get Directions': 'दिशा-निर्देश पाएं',
    'Find the exact shop location quickly.': 'दुकान का सटीक स्थान जल्दी खोजें।',
    'View Services': 'सेवाएँ देखें',
    'See all available printing options.': 'सभी उपलब्ध Printing विकल्प देखें।',
    'Ask for Prices': 'कीमतें पूछें',
    'Check starting rates before visiting.': 'जाने से पहले शुरुआती दर देखें।',

    // ── Pricing ──
    'Popular Services': 'लोकप्रिय सेवाएँ',
    'Most requested services with starting prices': 'सबसे ज़्यादा मांगी जाने वाली सेवाएँ और शुरुआती दर',
    'Indicative prices to help customers estimate costs quickly.': 'ग्राहकों को जल्दी लागत का अनुमान लगाने के लिए सांकेतिक कीमतें।',
    'Most Popular': 'सबसे लोकप्रिय',
    'Xerox / Photocopy': 'Xerox / Photocopy',
    'Starting from ₹1.5': '₹1.5 से शुरू',
    'Colour Printout': 'रंगीन Printout',
    'Starting from ₹10': '₹10 से शुरू',
    'Spiral Binding': 'Spiral Binding',
    'Starting from ₹30': '₹30 से शुरू',
    'Starting from ₹80': '₹80 से शुरू',
    'Smart Card': 'Smart Card',

    // ── Quote Calculator ──
    'Instant Quote': 'तत्काल कोटेशन',
    'Calculate your print estimate in seconds': 'सेकंडों में अपना प्रिंट अनुमान लगाएं',
    'Get a quick price estimate before you WhatsApp your files. Final pricing is confirmed at the shop.':
      'WhatsApp पर फ़ाइल भेजने से पहले जल्दी कीमत का अनुमान लगाएं। अंतिम कीमत दुकान पर तय होती है।',
    'Select a service': 'सेवा चुनें',
    'Pick the service you want to estimate.': 'वह सेवा चुनें जिसका आप अनुमान लगाना चाहते हैं।',
    'Service Type': 'सेवा का प्रकार',
    'Black & White Printing': 'Black & White Printing',
    'Color Printing': 'Color Printing',
    'Jumbo Xerox': 'Jumbo Xerox',
    'Choose options': 'विकल्प चुनें',
    'Size, color, and quantity help us estimate accurately.': 'आकार, रंग और मात्रा सटीक अनुमान में मदद करते हैं।',
    'Paper Size': 'कागज़ का आकार',
    'Standard': 'मानक',
    'Print Type': 'Print का प्रकार',
    'Black & White': 'Black & White',
    'Color': 'Color',
    'Quantity': 'मात्रा',
    'Add finishing services': 'Finishing सेवाएँ जोड़ें',
    'Optional add-ons that improve presentation and durability.': 'प्रेज़ेंटेशन और टिकाऊपन सुधारने वाले वैकल्पिक Add-ons।',
    'Estimates update instantly. Final pricing depends on paper choice and file details.':
      'अनुमान तुरंत अपडेट होता है। अंतिम कीमत कागज़ और फ़ाइल के विवरण पर निर्भर करती है।',
    'Upload PDF': 'PDF अपलोड करें',
    '(Optional)': '(वैकल्पिक)',
    "Drop your PDF and we'll count the pages automatically.": 'अपना PDF डालें और हम पृष्ठ अपने आप गिन लेंगे।',
    'Drop PDF here or browse': 'यहाँ PDF डालें या Browse करें',
    'Page count auto-fills quantity · Max 25 MB': 'पृष्ठ संख्या अपने आप भरती है · अधिकतम 25 MB',
    'Your Estimate': 'आपका अनुमान',
    'Live pricing': 'लाइव कीमत',
    'Per Unit': 'प्रति यूनिट',
    'Total Cost': 'कुल लागत',
    'Select a service to calculate pricing.': 'कीमत गणना के लिए सेवा चुनें।',
    'Send Quote on WhatsApp': 'WhatsApp पर कोटेशन भेजें',
    'All estimates are indicative and confirmed after file review.': 'सभी अनुमान सांकेतिक हैं और फ़ाइल समीक्षा के बाद तय होते हैं।',

    // ── Downloads ──
    'Downloads': 'Downloads',
    'Quick PDF guides for pricing and services': 'कीमतों और सेवाओं के लिए त्वरित PDF मार्गदर्शिका',
    'Download the latest price list and service guide to plan your visit or office order.':
      'अपनी यात्रा या कार्यालय ऑर्डर की योजना बनाने के लिए नवीनतम दर सूची और सेवा मार्गदर्शिका डाउनलोड करें।',
    'Price List PDF': 'दर सूची PDF',
    'Updated pricing overview for popular printing and xerox services.': 'लोकप्रिय Printing और Xerox सेवाओं की अपडेट कीमतें।',
    'Download Price List': 'दर सूची डाउनलोड करें',
    'Service Guide PDF': 'सेवा मार्गदर्शिका PDF',
    'Service details, turnaround times, and ordering tips in one file.': 'एक फ़ाइल में सेवा विवरण, समय और ऑर्डर टिप्स।',
    'Download Service Guide': 'सेवा मार्गदर्शिका डाउनलोड करें',

    // ── How It Works ──
    'How It Works': 'कैसे काम करता है',
    'Simple 3-step process for faster service': 'तेज़ सेवा के लिए सरल 3-चरण प्रक्रिया',
    'From WhatsApp file sharing to easy pickup at the shop.': 'WhatsApp पर फ़ाइल शेयर करने से लेकर दुकान पर आसान Pickup तक।',
    'Send your file on WhatsApp': 'WhatsApp पर अपनी फ़ाइल भेजें',
    'Share documents, images, or print instructions directly.': 'दस्तावेज़, छवियाँ या Print निर्देश सीधे शेयर करें।',
    'Confirm print details and quantity': 'Print विवरण और मात्रा की पुष्टि करें',
    'Approve paper, copies, size, and final cost quickly.': 'कागज़, प्रतियाँ, आकार और अंतिम लागत जल्दी मंज़ूर करें।',
    'Visit the shop and collect your order': 'दुकान पर जाएं और अपना ऑर्डर लें',
    'Pickup at Virar Stationery & Jumbo Xerox with ease.': 'Virar Stationery & Jumbo Xerox से आसानी से Pickup करें।',

    // ── Services ──
    'Printing, Xerox & Stationery Services': 'Printing, Xerox और Stationery सेवाएँ',
    'Fast, Reliable & Affordable Services for Students, Offices and Everyday Needs':
      'विद्यार्थियों, कार्यालयों और दैनिक ज़रूरतों के लिए तेज़, विश्वसनीय और किफ़ायती सेवाएँ',
    'From colour printouts and xerox to lamination, binding and stationery, we provide everything you need under one roof in Virar.':
      'रंगीन Printout और Xerox से Lamination, Binding और Stationery तक, विरार में एक ही छत के नीचे सब कुछ।',
    'Sharp monochrome prints for forms, assignments, reports and office documents.':
      'फॉर्म, असाइनमेंट, रिपोर्ट और कार्यालयी दस्तावेज़ों के लिए तेज़ Monochrome Print।',
    'Vibrant colour prints for presentations, brochures, posters and project work.':
      'Presentation, Brochure, Poster और Project कार्य के लिए जीवंत रंगीन Print।',
    'Affordable photocopying for books, forms, IDs and daily office needs.':
      'किताबों, फॉर्म, पहचान पत्रों और दैनिक कार्यालयी ज़रूरतों के लिए किफ़ायती Photocopy।',
    'Protect important certificates, ID cards and documents with durable lamination.':
      'टिकाऊ Lamination से महत्वपूर्ण प्रमाणपत्र, पहचान पत्र और दस्तावेज़ सुरक्षित करें।',
    'Professional binding for project reports, files and presentations.':
      'Project रिपोर्ट, फ़ाइलों और Presentation के लिए पेशेवर Binding।',
    'Quick passport-size photo prints with clean framing and fast delivery.':
      'साफ़ Framing और तेज़ डिलीवरी के साथ त्वरित Passport Size फोटो Print।',
    'Complete support for school and college projects with print and finishing options.':
      'Print और Finishing विकल्पों के साथ School और College Projects के लिए पूर्ण सपोर्ट।',
    'Daily-use stationery, notebooks, pens, files, and office essentials in one place.':
      'दैनिक उपयोग की Stationery, Notebooks, Pens, Files और कार्यालयी ज़रूरी चीज़ें एक ही जगह।',
    'Learn More': 'और जानें',
    'Project Printing': 'Project Printing',
    'Stationery Products': 'Stationery उत्पाद',
    'Blackbook Printing': 'Blackbook Printing',
    'Letterhead Print': 'Letterhead Print',
    'Visiting Card': 'Visiting Card',
    'Billbook Print': 'Billbook Print',
    'Cartridge Refilling': 'Cartridge Refilling',
    'All Size Scanning': 'सभी आकार Scanning',
    'Computer Accessories': 'Computer Accessories',

    // ── Why Choose Us ──
    'Why Choose Us': 'हमें ही क्यों चुनें',
    'Why Virar Chooses Us': 'विरार हमें क्यों चुनता है',
    'Fast service, affordable pricing, professional quality, and trusted support for students, offices, and families across Virar.':
      'विरार में विद्यार्थियों, कार्यालयों और परिवारों के लिए तेज़ सेवा, किफ़ायती कीमत, पेशेवर गुणवत्ता और भरोसेमंद सपोर्ट।',
    'Fast Turnaround': 'तेज़ सेवा',
    'Urgent printouts, xerox, lamination, and project work completed quickly with same-day service available.':
      'तत्काल Printout, Xerox, Lamination और Project काम उसी दिन की सेवा के साथ जल्दी पूरा।',
    'Most Chosen': 'सबसे ज़्यादा चुना गया',
    'Affordable Pricing': 'किफ़ायती कीमतें',
    'Budget-friendly rates for students, offices, bulk orders, and everyday printing needs.':
      'विद्यार्थियों, कार्यालयों, Bulk Orders और दैनिक Printing ज़रूरतों के लिए बजट-अनुकूल दर।',
    'Professional Quality': 'पेशेवर गुणवत्ता',
    'Sharp printing, neat finishing, accurate colours, and premium-quality materials for every order.':
      'हर ऑर्डर के लिए तेज़ Printing, साफ़ Finishing, सटीक रंग और उच्च गुणवत्ता सामग्री।',
    'Trusted Local Support': 'भरोसेमंद स्थानीय सपोर्ट',
    'Friendly assistance, WhatsApp ordering, quick guidance, and reliable service trusted across Virar.':
      'मित्रवत् सहायता, WhatsApp Order, त्वरित मार्गदर्शन और विरार में भरोसेमंद सेवा।',
    '10+ Years in Virar': '10+ साल विरार में',
    '200000+ Happy Customers': '2,00,000+ खुश ग्राहक',
    'Same-Day Service': 'उसी दिन सेवा',
    'Open 7 Days a Week': 'सप्ताह में 7 दिन खुला',

    // ── Stationery Products ──
    'Featured Products': 'विशेष उत्पाद',
    'Stationery essentials for school, college, and office use': 'School, College और Office के लिए Stationery',
    'Quality stationery essentials for students, offices, and businesses — available at our shop.':
      'विद्यार्थियों, कार्यालयों और व्यवसायों के लिए गुणवत्तापूर्ण Stationery — हमारी दुकान में उपलब्ध।',
    'Pens': 'पेन',
    'Reliable writing tools for everyday use.': 'दैनिक उपयोग के लिए विश्वसनीय लेखन उपकरण।',
    'Notebooks': 'Notebooks',
    'Durable notebooks for study and office notes.': 'अध्ययन और कार्यालयी नोट्स के लिए टिकाऊ Notebooks।',
    'Files': 'Files',
    'Keep documents sorted and ready to present.': 'दस्तावेज़ व्यवस्थित और प्रस्तुत करने के लिए तैयार रखें।',
    'Art Supplies': 'कला सामग्री',
    'Materials for creative school and hobby work.': 'रचनात्मक स्कूल और शौक के काम के लिए सामग्री।',
    'Calculators': 'Calculators',
    'Useful calculators for class and work tasks.': 'कक्षा और काम के लिए उपयोगी Calculators।',
    'Charts': 'Charts',
    'Classroom and project charts that stand out.': 'कक्षा और Project के लिए आकर्षक Charts।',
    'Project Materials': 'Project सामग्री',
    'All the pieces needed for neat project work.': 'साफ़ Project काम के लिए सभी ज़रूरी चीज़ें।',
    'Sticky Notes': 'Sticky Notes',
    'Handy notes for reminders and planning.': 'याद दिलाने और योजना बनाने के लिए उपयोगी नोट्स।',

    // ── Gallery ──
    'GALLERY': 'गैलरी',
    'Inside the Shop': 'दुकान के अंदर',
    'A quick look at our daily work, printing setup, stationery shelves, and customer service.':
      'हमारे दैनिक काम, Printing सेटअप, Stationery शेल्फ और ग्राहक सेवा की एक झलक।',

    // ── Testimonials ──
    'Testimonials': 'प्रशंसापत्र',
    'What customers say': 'ग्राहक क्या कहते हैं',
    'What our customers say about their experience.': 'हमारे ग्राहक अपने अनुभव के बारे में क्या कहते हैं।',
    'Very quick service and the print quality is excellent. I get my project work done here every time.':
      'बहुत तेज़ सेवा और Print गुणवत्ता उत्कृष्ट है। मैं हर बार यहाँ अपना Project काम करवाता हूँ।',
    'Student': 'विद्यार्थी',
    'Best place for stationery and xerox in the area. Friendly staff and fair pricing.':
      'क्षेत्र में Stationery और Xerox के लिए सबसे अच्छी जगह। मित्रवत् कर्मचारी और उचित कीमत।',
    'Local Customer': 'स्थानीय ग्राहक',
    'They handled our office printing and binding efficiently. Smooth experience from start to finish.':
      'उन्होंने हमारी कार्यालयी Printing और Binding कुशलता से संभाली। शुरू से अंत तक सहज अनुभव।',
    'Office Executive': 'कार्यालय अधिकारी',

    // ── Trust Counters ──
    'Local Trust': 'स्थानीय विश्वास',
    "Virar's trusted print partner in numbers": 'विरार का भरोसेमंद Print भागीदार आँकड़ों में',
    'Real local volume, consistent support, and dependable turnaround for students, offices, and families.':
      'वास्तविक स्थानीय मात्रा, लगातार सपोर्ट और विद्यार्थियों, कार्यालयों और परिवारों के लिए विश्वसनीय समय।',
    'Years Serving Virar': 'साल विरार की सेवा',
    'Customer Visits': 'ग्राहकों की यात्राएँ',
    'Days Open Every Week': 'हर सप्ताह खुले दिन',
    'Typical Fast Order Time': 'सामान्य तेज़ ऑर्डर समय',

    // ── Order Status ──
    'Track Your Order': 'अपना ऑर्डर Track करें',
    'Check Your Print Order Status': 'अपने Print ऑर्डर की स्थिति देखें',
    'Enter your order ID or the last 4 digits of your phone number to see real-time status.':
      'Real-time स्थिति देखने के लिए Order ID या फ़ोन नंबर के आखिरी 4 अंक डालें।',
    'Order ID or Phone Number': 'Order ID या फ़ोन नंबर',
    'Track Order': 'ऑर्डर Track करें',
    "Try VS-2026-0847 or last 4 digits 2757 to see a demo.": 'Demo देखने के लिए VS-2026-0847 या आखिरी 4 अंक 2757 आज़माएं।',
    "Can't find your order?": 'अपना ऑर्डर नहीं मिल रहा?',
    'Ask on WhatsApp': 'WhatsApp पर पूछें',

    // ── FAQ ──
    'FAQs': 'अक्सर पूछे जाने वाले सवाल',
    'Answers to common customer questions': 'ग्राहकों के सामान्य सवालों के जवाब',
    'Quick guidance before you visit or place your print order on WhatsApp.':
      'दुकान जाने या WhatsApp पर Print ऑर्डर देने से पहले त्वरित मार्गदर्शन।',
    'Do you accept urgent same-day print orders?': 'क्या आप तत्काल उसी दिन Print ऑर्डर स्वीकार करते हैं?',
    'Yes. Most urgent print and xerox jobs are completed the same day depending on queue and file size.':
      'हाँ। अधिकांश तत्काल Print और Xerox काम Queue और फ़ाइल आकार के आधार पर उसी दिन पूरा होता है।',
    "Can I send files on WhatsApp before coming to the shop?": 'क्या मैं दुकान आने से पहले WhatsApp पर फ़ाइलें भेज सकता हूँ?',
    'Absolutely. Share your file and required quantity on WhatsApp, and we will confirm timing and price quickly.':
      'बिल्कुल। WhatsApp पर अपनी फ़ाइल और आवश्यक मात्रा शेयर करें, और हम समय और कीमत जल्दी बताएंगे।',
    'Do you provide student discounts for project prints?': 'क्या आप Project Print के लिए छात्र छूट देते हैं?',
    'Yes, student-friendly pricing is available for selected services and bulk project printing requests.':
      'हाँ, चुनी हुई सेवाओं और Bulk Project Printing अनुरोधों के लिए छात्र-अनुकूल कीमत उपलब्ध है।',
    'Which payment options are available at the shop?': 'दुकान पर कौन से Payment विकल्प उपलब्ध हैं?',
    'You can pay via UPI, cash, and common digital methods available at local retail counters.':
      'आप UPI, नकद और स्थानीय Retail काउंटर पर उपलब्ध सामान्य Digital तरीकों से Payment कर सकते हैं।',
    'Can offices place recurring monthly print orders?': 'क्या कार्यालय नियमित मासिक Print ऑर्डर दे सकते हैं?',
    'Yes. Regular office requirements can be planned with priority turnaround and quantity-based rates.':
      'हाँ। नियमित कार्यालयी ज़रूरतें प्राथमिकता समय और मात्रा-आधारित दरों के साथ योजनाबद्ध की जा सकती हैं।',

    // ── Bulk Enquiry ──
    'Bulk / Business Enquiry': 'Bulk / व्यापार पूछताछ',
    'Priority support for offices, schools, and large orders': 'कार्यालयों, स्कूलों और बड़े ऑर्डर के लिए प्राथमिकता सपोर्ट',
    'Share your requirements, attach files, and get a fast response with tailored pricing.':
      'अपनी ज़रूरतें शेयर करें, फ़ाइलें संलग्न करें और अनुकूलित कीमतों के साथ तेज़ प्रतिक्रिया पाएं।',
    'Made for high-volume needs': 'उच्च-मात्रा ज़रूरतों के लिए',
    'Get priority turnaround and business-friendly pricing for repeat orders.':
      'दोहराए जाने वाले ऑर्डर के लिए प्राथमिकता समय और व्यापार-अनुकूल कीमत पाएं।',
    'Dedicated response for bulk printing': 'Bulk Printing के लिए समर्पित प्रतिक्रिया',
    'Custom bundles for schools and offices': 'School और Office के लिए Custom Bundle',
    'File review and delivery guidance': 'फ़ाइल समीक्षा और डिलीवरी मार्गदर्शन',
    'Support for recurring monthly orders': 'नियमित मासिक ऑर्डर के लिए सपोर्ट',
    'Need urgent help?': 'तत्काल मदद चाहिए?',
    'WhatsApp now': 'अभी WhatsApp करें',
    'Business details': 'व्यापार विवरण',
    'Tell us who is placing the order.': 'बताएं कि ऑर्डर कौन दे रहा है।',
    'Name': 'नाम',
    'Business / Organization': 'व्यापार / संगठन',
    'Phone': 'फ़ोन',
    'Email (Optional)': 'ईमेल (वैकल्पिक)',
    'Order requirements': 'ऑर्डर ज़रूरतें',
    'Share service type and quantity details.': 'सेवा प्रकार और मात्रा का विवरण शेयर करें।',
    'Service Required': 'आवश्यक सेवा',
    'Description': 'विवरण',
    'Paper size, color, deadline, delivery notes': 'कागज़ आकार, रंग, अंतिम तारीख, डिलीवरी नोट्स',
    'Upload files (optional)': 'फ़ाइलें अपलोड करें (वैकल्पिक)',
    'Drag & drop files to speed up the quote.': 'कोटेशन तेज़ करने के लिए फ़ाइलें Drag & Drop करें।',
    'Tap to select or drop your file here': 'फ़ाइल चुनने के लिए Tap करें या यहाँ डालें',
    'PDF, DOC, JPG up to 10MB': 'PDF, DOC, JPG 10MB तक',
    'Browse file': 'फ़ाइल Browse करें',
    'Share file on WhatsApp': 'WhatsApp पर फ़ाइल शेयर करें',
    'WhatsApp will open. Attach the file if prompted.': 'WhatsApp खुलेगा। अनुरोध होने पर फ़ाइल संलग्न करें।',
    'Submit Business Enquiry': 'व्यापार पूछताछ सबमिट करें',
    'WhatsApp Direct': 'सीधे WhatsApp',

    // ── Contact ──
    'Contact Us': 'हमसे संपर्क करें',
    'Visit the shop or send an inquiry': 'दुकान पर जाएं या पूछताछ भेजें',
    'Find our shop quickly, call or WhatsApp instantly, and send your inquiry anytime.':
      'हमारी दुकान जल्दी खोजें, तुरंत Call या WhatsApp करें और कभी भी पूछताछ भेजें।',
    'Shop Details': 'दुकान विवरण',
    'Address': 'पता',
    'Today': 'आज',
    'Open Today · 8:30 AM – 9:00 PM': 'आज खुला · सुबह 8:30 - रात 9:00',
    'Send a Message': 'संदेश भेजें',
    'Phone Number (Optional)': 'फ़ोन नंबर (वैकल्पिक)',
    'Service Needed': 'आवश्यक सेवा',
    'Message': 'संदेश',
    'Get Free Quote': 'मुफ़्त कोटेशन पाएं',
    'WhatsApp Quote': 'WhatsApp कोटेशन',

    // ── Footer ──
    'Virar Stationery & Jumbo Xerox': 'Virar Stationery & Jumbo Xerox',
    'Printing, stationery, xerox and lamination services in Virar.': 'विरार में Printing, Stationery, Xerox और Lamination सेवाएँ।',
    'Trusted by students, offices and families across Virar': 'विरार में विद्यार्थियों, कार्यालयों और परिवारों का भरोसा',
    'Open Today · 8am – 9pm': 'आज खुला · सुबह 8 - रात 9',
    'Quick Links': 'त्वरित लिंक',
    'Services': 'सेवाएँ',
    'Printing': 'Printing',
    'Privacy Policy': 'गोपनीयता नीति',
    'Terms': 'शर्तें',
    'Sitemap': 'Sitemap',
    '© 2026 Virar Stationery & Jumbo Xerox. All rights reserved.': '© 2026 Virar Stationery & Jumbo Xerox. सभी अधिकार सुरक्षित।',

    // ── Mobile Bar / Chat ──
    'WhatsApp': 'WhatsApp',
    'Call': 'Call',
    'Directions': 'दिशा-निर्देश',
    'Chat with us': 'हमसे Chat करें',
    'Quick help in seconds': 'सेकंडों में त्वरित मदद',
    'Hi! How can we help you today?': 'नमस्ते! आज हम आपकी कैसे मदद कर सकते हैं?',
    'Try a quick option below.': 'नीचे एक त्वरित विकल्प आज़माएं।',
    'Send files': 'फ़ाइलें भेजें',
    'Check price': 'कीमत देखें',
    'Location': 'स्थान',
    'Continue on WhatsApp': 'WhatsApp पर जारी रखें',
  },
};

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let currentLang = 'en';
/** @type {Map<Text, string>} — original EN text of every touched node */
const originalNodes = new Map();

// ---------------------------------------------------------------------------
// Core: TreeWalker-based full-page translation
// ---------------------------------------------------------------------------

/**
 * Walk every text node in <body> and replace its text if a dictionary match exists.
 * Stores the original English text so we can restore it when switching back to EN.
 *
 * @param {string} targetLang — 'en' | 'mr' | 'hi'
 */
function translatePage(targetLang) {
  if (targetLang === 'en') {
    // Restore all original English nodes
    originalNodes.forEach((originalText, node) => {
      if (node.parentNode) node.textContent = originalText;
    });
    return;
  }

  const dict = DICT[targetLang];
  if (!dict) return;

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        // Skip script/style/noscript content
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') {
          return NodeFilter.FILTER_REJECT;
        }
        // Only process nodes with visible text
        const text = node.textContent.trim();
        if (!text || text.length < 2) return NodeFilter.FILTER_SKIP;
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  const nodesToProcess = [];
  let node;
  while ((node = walker.nextNode())) nodesToProcess.push(node);

  nodesToProcess.forEach((textNode) => {
    const raw = textNode.textContent;
    const trimmed = raw.trim();

    // Store original EN text on first encounter
    if (!originalNodes.has(textNode)) {
      originalNodes.set(textNode, raw);
    }

    // Use original EN text as the lookup key (so we always translate from English)
    const enText = originalNodes.get(textNode).trim();
    const translated = dict[enText];

    if (translated) {
      // Preserve leading/trailing whitespace from original
      const leading  = raw.match(/^\s*/)[0];
      const trailing = raw.match(/\s*$/)[0];
      textNode.textContent = leading + translated + trailing;
    }
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSavedLanguage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return LANG_CYCLE.includes(saved) ? saved : 'en';
}

function getNextLanguage(lang) {
  return LANG_CYCLE[(LANG_CYCLE.indexOf(lang) + 1) % LANG_CYCLE.length];
}

function updateToggleBtn(btn, lang) {
  if (!btn) return;
  const span = btn.querySelector('.lang-label');
  if (span) span.textContent = LANG_LABEL[lang] || lang.toUpperCase();
  btn.setAttribute('title', LANG_TOAST[lang]);
}

// ---------------------------------------------------------------------------
// Public init
// ---------------------------------------------------------------------------

/**
 * Initialises the language toggle feature.
 * Applies the saved language on load and wires the toggle button click handler.
 */
export const initLanguageToggle = () => {
  const toggleBtn = document.getElementById('langToggle');
  currentLang = getSavedLanguage();

  // Apply on load
  translatePage(currentLang);
  document.documentElement.lang = currentLang;
  updateToggleBtn(toggleBtn, currentLang);

  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    currentLang = getNextLanguage(currentLang);
    localStorage.setItem(STORAGE_KEY, currentLang);

    translatePage(currentLang);
    document.documentElement.lang = currentLang;
    updateToggleBtn(toggleBtn, currentLang);

    showEnquiryToast(LANG_TOAST[currentLang]);
  });
};
