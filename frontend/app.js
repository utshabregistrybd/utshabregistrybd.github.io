/**
 * UtsabRegistry BD - Enhanced Core Application Logic
 * Supports:
 * - Popular BD Vendor Integration (Aarong, Daraz, Walton, Transcom, Pickaboo, Monno)
 * - 1-Click Product URL Importer
 * - Automated Vendor Orders & Platform Commission Engine
 * - Database Storage Options & JSON Snapshot Export/Import
 * - Fund Reservation & Escrow Management (Hold funds until goal/delivery & couple withdrawal)
 * - Photo Uploads & Website Section Organizer
 */

// Global State
const state = {
  event: null,
  gifts: [],
  contributions: [],
  vendorOrders: [],
  vendorSummary: {},
  escrowSummary: {},
  escrowItems: [],
  payoutRequests: [],
  dbStats: {},
  gallery: [],
  guestbook: [],
  stats: {},
  activeCategory: 'all',
  searchQuery: '',
  activeTab: 'gifts',
  selectedGiftForPayment: null,
  currentPaymentMethod: 'bkash',
  currentLang: 'bn',
  apiAvailable: true,
};

// Curated Popular BD Vendor Products (For 1-Click Quick Add)
const vendorQuickCatalog = [
  {
    vendor: 'Aarong Lifestyle',
    category: 'luxury',
    title: 'Aarong Handloom Dhakai Jamdani Silk Sharee (Crimson & Gold)',
    title_bn: 'আড়ং হ্যান্ডলুম ঢাকাই জামদানি সিল্ক শাড়ি (মরুন ও গোল্ড)',
    price: 16800,
    image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    merchant_url: 'https://www.aarong.com/women/sarees/jamdani-silk',
    description: 'Authentic Narayanganj handloom Dhakai Jamdani with golden zari weave. Fulfilled directly by Aarong.'
  },
  {
    vendor: 'Walton Plaza BD',
    category: 'appliances',
    title: 'Walton 1.5 Ton Intelligent Inverter Split AC',
    title_bn: 'ওয়ালটন ১.৫ টন ইন্টেলিজেন্ট ইনভার্টার এসি',
    price: 64500,
    image_url: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=800&q=80',
    merchant_url: 'https://eplaza.waltonbd.com/air-conditioners/wsi-inverna-18c',
    description: 'Eco-friendly smart inverter AC. Delivered to couple\'s home by Walton Plaza express logistics.'
  },
  {
    vendor: 'Transcom Digital',
    category: 'kitchen',
    title: 'Philips Essential RapidAir Digital Air Fryer HD9270',
    title_bn: 'ফিলিপস এসেনশিয়াল ডিজিটাল এয়ার ফ্রায়ার',
    price: 15200,
    image_url: 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80',
    merchant_url: 'https://transcomdigital.com/philips-airfryer-hd9270',
    description: '6.2L capacity digital air fryer from Transcom Digital with 2-year warranty.'
  },
  {
    vendor: 'Monno Ceramics BD',
    category: 'luxury',
    title: 'Monno Ceramic Royal Imperial 52-Piece Dinner Set',
    title_bn: 'মুন্নু সিরামিক রয়্যাল ইম্পেরিয়াল ৫২-পিস ডিনার সেট',
    price: 18500,
    image_url: 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?auto=format&fit=crop&w=800&q=80',
    merchant_url: 'https://monno.com.bd/products/imperial-52',
    description: '24k gold trimmed luxury porcelain dinner set for starting the new family.'
  },
  {
    vendor: 'Pickaboo BD',
    category: 'appliances',
    title: 'Xiaomi Dreame D9 Robot Vacuum & Wet Mop Cleaner',
    title_bn: 'শাওমি ড্রিম রোবট ভ্যাকুয়াম ও মপ ক্লিনার',
    price: 29500,
    image_url: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&w=800&q=80',
    merchant_url: 'https://pickaboo.com/product/dreame-d9-robot',
    description: 'Smart laser navigation automated home vacuum with 1-year official BD warranty.'
  },
  {
    vendor: 'Daraz BD Official',
    category: 'kitchen',
    title: 'Miyako Granite Non-Stick Induction 7-Piece Cookware',
    title_bn: 'মিয়াকো গ্রানাইট নন-স্টিক ৭-পিস কুকওয়্যার সেট',
    price: 8900,
    image_url: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80',
    merchant_url: 'https://daraz.com.bd/products/miyako-granite-set',
    description: 'Heavy duty granite coated induction pot and pan set with tempered glass lids.'
  }
];

function toBanglaNumber(num) {
  if (num === null || num === undefined) return '';
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (d) => banglaDigits[parseInt(d, 10)]);
}

function formatCurrency(amount, forceBangla = null) {
  const isBangla = forceBangla !== null ? forceBangla : (state.currentLang === 'bn');
  const formatted = Math.round(amount).toLocaleString('en-IN');
  return isBangla ? `৳ ${toBanglaNumber(formatted)}` : `৳ ${formatted} BDT`;
}

function playAuspiciousChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + idx * 0.12 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.12);
      osc.stop(ctx.currentTime + idx * 0.12 + 1.3);
    });
  } catch (e) {}
}

function triggerConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#800020', '#d4af37', '#f3e5ab', '#e2136e', '#047857']
    });
  }
}

// Embedded Default State for GitHub Pages / Static Deployment
const defaultStaticState = {
  "event": {
    "id": "utsab-default",
    "title_en": "Arindam & Arpita Auspicious Hindu Wedding Celebration",
    "title_bn": "অরিন্দম ও অর্পিতার শুভ বিবাহ ও বৌভাত প্রীতিভোজ",
    "event_type": "hindu_wedding",
    "groom_name": "Arindam Chakraborty",
    "bride_name": "Arpita Ganguly",
    "groom_bn": "অরিন্দম চক্রবর্ত্তী",
    "bride_bn": "অর্পিতা গাঙ্গুলি",
    "groom_photo": "uploads/groom_arindam.jpg",
    "bride_photo": "uploads/bride_arpita.jpg",
    "couple_photo": "uploads/arindam_arpita_sitting.jpg",
    "cover_photo": "uploads/arindam_arpita_standing.jpg",
    "event_date": "2027-01-21",
    "event_time": "সন্ধ্যা ৭:০০ ঘটিকা onwards (7:00 PM BST)",
    "venue_name": "Engineers Institute Chattogram (দি ইনস্টিটিউশন অব ইঞ্জিনিয়ার্স বাংলাদেশ, চট্টগ্রাম)",
    "venue_address": "এস. এস. খালেদ রোড, লালখান বাজার, চট্টগ্রাম-৪০০০, বাংলাদেশ",
    "venue_map_url": "https://maps.google.com/?q=The+Institution+of+Engineers+Bangladesh+IEB+Chattogram",
    "story": "|| যদেতদ্ধৃদয়ং তব তদেতদ্ধৃদয়ং মম ||\n\nপরম করুণাময় পরমেশ্বরের অশেষ কৃপা এবং পরম পূজনীয় পিতৃপুরুষ ও গুরুজনদের আশিস মাথায় রেখে আমাদের শুভ পরিণয় উপলক্ষে আগামী ২১ জানুয়ারি ২০২৭ শুভ বৌভাত ও প্রীতিভোজ অনুষ্ঠিত হতে চলেছে।\n\nচট্টগ্রামের মনোরম পরিবেশে দি ইনস্টিটিউশন অব ইঞ্জিনিয়ার্স বাংলাদেশ (আইইবি) প্রাঙ্গণে সান্ধ্যলগ্নে শুভ বৌভাত ও প্রীতিভোজে আপনার সপরিবার সানন্দ উপস্থিতি ও মাঙ্গলিক আশীর্বাদ আমাদের নবদম্পতির আগামী দিনের শ্রেষ্ঠ পাথেয়।",
    "welcome_msg": "|| ॐ শ্রী শ্রী প্রজাপতয়ে নমঃ || আমাদের শুভ বৌভাত ও প্রীতিভোজে আপনার সানন্দ উপস্থিতি এবং মাঙ্গলিক আশীর্বাদ আমাদের পরম সম্পদ।",
    "theme_color": "sindoor-gold",
    "section_order": [
      "hero",
      "invitation",
      "venue",
      "gifts",
      "salami",
      "gallery",
      "story",
      "guestbook"
    ],
    "section_visibility": {
      "hero": true,
      "invitation": true,
      "venue": true,
      "gifts": true,
      "salami": true,
      "gallery": true,
      "story": true,
      "guestbook": true
    },
    "commission_rate": 0.0,
    "delivery_contact_phone": "01712-345678",
    "delivery_address": "লালখান বাজার, চট্টগ্রাম, বাংলাদেশ",
    "bkash_number": "01712-345678",
    "nagad_number": "01819-876543",
    "rocket_number": "01911-567890-4",
    "bank_name": "BRAC Bank PLC",
    "bank_acc_name": "Arindam Chakraborty & Arpita Ganguly",
    "bank_acc_no": "1501204892019001",
    "bank_branch": "Agrabad Branch, Chattogram",
    "bank_routing": "060152431"
  },
  "gifts": [
    {
      "id": "gift-gold-1",
      "title": "22K Hallmarked Auspicious Gold Coin Ginni (1 Vori / 11.66g)",
      "title_bn": "২২ ক্যারেট হলমার্ক সার্বভৌম স্বর্ণমুদ্রা (গিনি) ও সঞ্চয় তহবিল (গ্রুপ গিফট)",
      "category": "gold",
      "price": 500000.0,
      "target_amount": 500000.0,
      "current_amount": 285000.0,
      "image_url": "https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=800&q=80",
      "merchant_url": "",
      "merchant_name": "BAJUS / Diamond World",
      "vendor_sku": "GLD-GIN-01",
      "description": "নবদম্পতির ভবিষ্যৎ সঞ্চয় ও স্থায়ী আর্থিক নিরাপত্তার জন্য ২২ ক্যারেট খাঁটি স্বর্ণের গিনি ও সার্বভৌম তহবিল (৳ ৫,০০,০০০)। আত্মীয়-স্বজন ও শুভানুধ্যায়ীরা যেকোনো পরিমাণে যৌথভাবে উপহারে অংশ নিতে পারেন।",
      "is_group_gift": 1,
      "status": "partially_funded",
      "created_at": "2026-11-15T01:09:45.410047"
    },
    {
      "id": "gift-gold-2",
      "title": "Traditional 21K Gold-Trimmed Shankha & Pola Bangle Set",
      "title_bn": "ঐতিহ্যবাহী ২১ ক্যারেট স্বর্ণ বাঁধানো শাঁখা ও পলা জোড়া এবং সোনার চুড় সেট",
      "category": "gold",
      "price": 150000.0,
      "target_amount": 150000.0,
      "current_amount": 90000.0,
      "image_url": "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&w=800&q=80",
      "merchant_url": "",
      "merchant_name": "Aparupa Jewellers BD",
      "vendor_sku": "GLD-SHK-02",
      "description": "সনাতন হিন্দু নববধূর সৌভাগ্যের স্মারক ২১ ক্যারেট খাঁটি স্বর্ণে নিখুঁত কারুকাজে বাঁধানো শাঁখা ও পলা জোড়া এবং স্বর্ণের চুড় সেট।",
      "is_group_gift": 1,
      "status": "partially_funded",
      "created_at": "2026-11-15T01:09:45.410056"
    },
    {
      "id": "gift-gold-3",
      "title": "22K Gold Auspicious Om & Sacred Lotus Pendant with Chain",
      "title_bn": "২২ ক্যারেট খাঁটি স্বর্ণের মাঙ্গলিক রাজকীয় রানিহার, পদ্ম ও ওম লকেট-চেইন ব্রাইডাল সেট (গ্রুপ গিফট)",
      "category": "gold",
      "price": 500000.0,
      "target_amount": 500000.0,
      "current_amount": 320000.0,
      "image_url": "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80",
      "merchant_url": "",
      "merchant_name": "Apan Jewellers",
      "vendor_sku": "GLD-OM-03",
      "description": "পবিত্র বৈদিক মাঙ্গলিক ওম ও প্রস্ফুটিত পদ্ম মোটিফের ২২ ক্যারেট খাঁটি স্বর্ণের রাজকীয় ব্রাইডাল নেকলেস, লকেট ও সোনার চেইন সেট (৳ ৫,০০,০০০)। আত্মীয়-স্বজন মিলে যৌথভাবে উপহার দিতে পারেন।",
      "is_group_gift": 1,
      "status": "partially_funded",
      "created_at": "2026-11-15T01:09:45.410060"
    },
    {
      "id": "gift-sharee-1",
      "title": "Aarong Handcrafted Pure Katan Silk Banarasi Saree (Crimson Red & Antique Zari)",
      "title_bn": "আড়ং হ্যান্ডক্রাফটেড পিওর কাতান সিল্ক বেনারসী শাড়ি (সিঁদুর লাল ও অ্যান্টিক জরি)",
      "category": "sharee",
      "price": 26500.0,
      "target_amount": 26500.0,
      "current_amount": 26500.0,
      "image_url": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
      "merchant_url": "https://www.aarong.com/women/sarees/banarasi/crimson-katan-silk-wedding",
      "merchant_name": "Aarong Lifestyle",
      "vendor_sku": "AAR-BAN-RED-01",
      "description": "বিশুদ্ধ কাতান সিল্কে বোনা ট্র্যাডিশনাল লাল বেনারসী শাড়ি। লগ্ন ও শুভ বিবাহের জন্য উপযুক্ত।",
      "is_group_gift": 0,
      "status": "claimed",
      "created_at": "2026-11-15T01:09:45.410063"
    },
    {
      "id": "gift-sharee-2",
      "title": "Heritage Handloom 84-Count Dhakai Jamdani Saree (Royal Navy & Gold)",
      "title_bn": "হেরিটেজ হ্যান্ডলুম ৮৪-কাউন্ট ঢাকাই জামদানি শাড়ি (রয়্যাল নেভি ও গোল্ডেন ময়ূরপঙ্খী)",
      "category": "sharee",
      "price": 18500.0,
      "target_amount": 18500.0,
      "current_amount": 0.0,
      "image_url": "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80",
      "merchant_url": "https://tangailshareekutir.com/jamdani-navy",
      "merchant_name": "Tangail Sharee Kutir",
      "vendor_sku": "JAM-NAVY-02",
      "description": "নারায়ণগঞ্জের ঐতিহ্যবাহী তাঁতে বোনা ৮৪-কাউন্টের খাঁটি সুতি ঢাকাই জামদানি। সূক্ষ্ম ময়ূর ও কলকা নকশা।",
      "is_group_gift": 0,
      "status": "available",
      "created_at": "2026-11-15T01:09:45.410065"
    },
    {
      "id": "gift-sharee-3",
      "title": "Rajshahi Pure Mulberry Baluchari Motif Silk Saree",
      "title_bn": "রাজশাহী খাঁটি মালবেরি সিল্ক শাড়ি (বালুচরি মোটিফ ও সোনালী আঁচল)",
      "category": "sharee",
      "price": 13500.0,
      "target_amount": 13500.0,
      "current_amount": 0.0,
      "image_url": "https://images.unsplash.com/photo-1610030469668-932d0c273ca8?auto=format&fit=crop&w=800&q=80",
      "merchant_url": "",
      "merchant_name": "Sopura Silk Mills BD",
      "vendor_sku": "SLK-RAJ-03",
      "description": "শতভাগ খাঁটি রাজশাহী রেশম সিল্কে রচিত মনোরম সনাতনী কৃত্য ও আলপনা মোটিফ। প্রীতিভোজের অপূর্ব সাজ।",
      "is_group_gift": 0,
      "status": "available",
      "created_at": "2026-11-15T01:09:45.410067"
    },
    {
      "id": "gift-gadget-1",
      "title": "Apple iPad 10th Gen (10.9-inch Liquid Retina Display, Wi-Fi 64GB Silver)",
      "title_bn": "অ্যাপল আইপ্যাড ১০ম জেনারেশন (১০.৯ ইঞ্চি লিকুইড রেটিনা ডিসপ্লে, ওয়াই-ফাই ৬৪ জিবি)",
      "category": "gadgets",
      "price": 46500.0,
      "target_amount": 46500.0,
      "current_amount": 25000.0,
      "image_url": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80",
      "merchant_url": "https://www.startech.com.bd/apple-ipad-10th-gen",
      "merchant_name": "Star Tech / Apple Authorized",
      "vendor_sku": "GAD-IPAD-10",
      "description": "নতুন দম্পতির স্মার্ট রিডিং, ফটো মেমোরিজ ও মাল্টিমিডিয়া দেখার জন্য এ১৪ বায়োনিক চিপ সমৃদ্ধ অ্যাপল আইপ্যাড।",
      "is_group_gift": 1,
      "status": "partially_funded",
      "created_at": "2026-11-15T01:30:00"
    },
    {
      "id": "gift-gadget-2",
      "title": "Marshall Emberton II Portable Bluetooth Speaker (Black & Brass)",
      "title_bn": "মার্শাল এম্বারটন ২ পোর্টেবল ট্রু স্টেরিও ব্লুটুথ স্পিকার (ব্ল্যাক অ্যান্ড ব্রাস)",
      "category": "gadgets",
      "price": 19500.0,
      "target_amount": 19500.0,
      "current_amount": 19500.0,
      "image_url": "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80",
      "merchant_url": "https://www.ryanscomputers.com/marshall-emberton-ii",
      "merchant_name": "Ryans Computers / Marshall",
      "vendor_sku": "GAD-MRSH-02",
      "description": "নবদম্পতির গৃহকোণ ও ভ্রমণের রোমান্টিক আবহ তৈরিতে ৩০+ ঘণ্টার ব্যাটারি ও ৩৬০ ডিগ্রি আইকনিক মার্শাল অডিও।",
      "is_group_gift": 0,
      "status": "claimed",
      "created_at": "2026-11-15T01:30:00"
    },
    {
      "id": "gift-gadget-3",
      "title": "Sony WH-1000XM5 Wireless Noise-Cancelling Headphones (Silver)",
      "title_bn": "সনি ডব্লিউএইচ-১০০০এক্সএম৫ প্রিমিয়াম নয়েজ ক্যানসেলিং ওয়্যারলেস হেডফোন",
      "category": "gadgets",
      "price": 36000.0,
      "target_amount": 36000.0,
      "current_amount": 18000.0,
      "image_url": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80",
      "merchant_url": "https://pickaboo.com/product/sony-wh1000xm5",
      "merchant_name": "Pickaboo BD / Sony",
      "vendor_sku": "GAD-SNY-XM5",
      "description": "হাই-রেজুলিউশন ক্রিস্টাল অডিও ও ইন্ডাস্ট্রির সেরা অ্যাক্টিভ নয়েজ ক্যান্সেলেশন সমৃদ্ধ প্রিমিয়াম হেডফোন।",
      "is_group_gift": 1,
      "status": "partially_funded",
      "created_at": "2026-11-15T01:30:00"
    },
    {
      "id": "gift-gadget-4",
      "title": "Samsung Galaxy Watch 6 Classic Smartwatch (47mm Silver)",
      "title_bn": "স্যামসাং গ্যালাক্সি ওয়াচ ৬ ক্লাসিক স্মার্টওয়াচ (সিলভার রিং ও লেদার ট্রিম)",
      "category": "gadgets",
      "price": 28500.0,
      "target_amount": 28500.0,
      "current_amount": 0.0,
      "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
      "merchant_url": "https://pickaboo.com/product/samsung-galaxy-watch-6-classic",
      "merchant_name": "Samsung Plaza BD",
      "vendor_sku": "GAD-GW6-CLS",
      "description": "বরের জন্য রোটেটিং বেজেল সমৃদ্ধ প্রিমিয়াম স্যাফায়ার ক্রিস্টাল স্মার্টওয়াচ ও এডভান্সড হেলথ ট্র্যাকার।",
      "is_group_gift": 0,
      "status": "available",
      "created_at": "2026-11-15T01:30:00"
    },
    {
      "id": "gift-gadget-5",
      "title": "Amazon Kindle Paperwhite (16GB, 6.8-inch 300 ppi with Warm Light)",
      "title_bn": "আমাজন কিন্ডল পেপারহোয়াইট ই-রিডার (১৬ জিবি, ওয়ার্ম লাইট ডিসপ্লে)",
      "category": "gadgets",
      "price": 18500.0,
      "target_amount": 18500.0,
      "current_amount": 0.0,
      "image_url": "https://images.unsplash.com/photo-1592496431122-2349e0fbc666?auto=format&fit=crop&w=800&q=80",
      "merchant_url": "https://techlandbd.com/amazon-kindle-paperwhite-16gb",
      "merchant_name": "TechLand BD",
      "vendor_sku": "GAD-KND-16G",
      "description": "বইপ্রেমী যুগলের জন্য কাগজের মতো গ্লেয়ার-ফ্রি ডিসপ্লে ও ওয়াটারপ্রুফ ডিজাইনের ডিজিটাল ই-বুক রিডার।",
      "is_group_gift": 0,
      "status": "available",
      "created_at": "2026-11-15T01:30:00"
    },
    {
      "id": "gift-gadget-6",
      "title": "Fujifilm Instax Mini 12 Instant Camera & Film Bundle (Clay White)",
      "title_bn": "ফুজিফিল্ম ইনস্ট্যাক্স মিনি ১২ ইনস্ট্যান্ট ক্যামেরা ও ফটো পেপার বান্ডেল (হোয়াইট)",
      "category": "gadgets",
      "price": 12500.0,
      "target_amount": 12500.0,
      "current_amount": 12500.0,
      "image_url": "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80",
      "merchant_url": "https://daraz.com.bd/products/fujifilm-instax-mini-12",
      "merchant_name": "Daraz BD / Fujifilm",
      "vendor_sku": "GAD-INS-MINI",
      "description": "নবদম্পতির মধুচন্দ্রিমা ও বিশেষ মুহূর্তগুলো সাথে সাথে প্রিন্ট করে স্মৃতি বাঁধাই করার ইনস্ট্যান্ট পোলারয়েড ক্যামেরা।",
      "is_group_gift": 0,
      "status": "claimed",
      "created_at": "2026-11-15T01:30:00"
    },
    {
      "id": "gift-app-1",
      "title": "Walton 380L Non-Frost Smart Inverter Refrigerator",
      "title_bn": "ওয়ালটন ৩৮০ লিটার নন-ফ্রস্ট স্মার্ট ইনভার্টার রেফ্রিজারেটর (গ্রুপ গিফট)",
      "category": "appliances",
      "price": 52000.0,
      "target_amount": 52000.0,
      "current_amount": 52000.0,
      "image_url": "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80",
      "merchant_url": "https://eplaza.waltonbd.com/refrigerators/inverter-380",
      "merchant_name": "Walton Plaza BD",
      "vendor_sku": "WLT-REF-380",
      "description": "অরিন্দম ও অর্পিতার নতুন গৃহের জন্য বিদ্যুৎ সাশ্রয়ী ইনভার্টার প্রযুক্তির সুবিশাল ডাবল ডোর ফ্রিজ।",
      "is_group_gift": 1,
      "status": "claimed",
      "created_at": "2026-11-15T01:09:45.410069"
    },
    {
      "id": "gift-app-2",
      "title": "Sharp 28L Convection & Grill Microwave Oven",
      "title_bn": "শার্প ২৮ লিটার অটো-মেনু কনভেকশন ও গ্রিল মাইক্রোওয়েভ ওভেন",
      "category": "appliances",
      "price": 21500.0,
      "target_amount": 21500.0,
      "current_amount": 0.0,
      "image_url": "https://images.unsplash.com/photo-1585659722983-3a675dabf23d?auto=format&fit=crop&w=800&q=80",
      "merchant_url": "https://transcomdigital.com/sharp-microwave-28l",
      "merchant_name": "Transcom Digital",
      "vendor_sku": "SHP-MCW-28",
      "description": "নতুন সংসারে আধুনিক বেকিং, গ্রিলিং ও গরম করার জন্য অটো সেন্সর সমৃদ্ধ কনভেকশন মাইক্রোওয়েভ।",
      "is_group_gift": 0,
      "status": "available",
      "created_at": "2026-11-15T01:09:45.410070"
    },
    {
      "id": "gift-app-3",
      "title": "LG 8kg Steam Inverter Front-Load Washing Machine",
      "title_bn": "এলজি ৮ কেজি স্টিম ইনভার্টার ফ্রন্ট-লোডিং স্বয়ংক্রিয় ওয়াশিং মেশিন (গ্রুপ গিফট)",
      "category": "appliances",
      "price": 68000.0,
      "target_amount": 68000.0,
      "current_amount": 34000.0,
      "image_url": "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=800&q=80",
      "merchant_url": "https://transcomdigital.com/lg-washing-machine-8kg",
      "merchant_name": "Transcom Digital",
      "vendor_sku": "LG-WSH-8KG",
      "description": "দৈনন্দিন জীবনকে আরামদায়ক করতে ৯৯.৯% অ্যালার্জি কেয়ার স্টিম ওয়াশার ও ডিরেক্ট ড্রাইভ মোটর।",
      "is_group_gift": 1,
      "status": "partially_funded",
      "created_at": "2026-11-15T01:09:45.410072"
    },
    {
      "id": "gift-app-4",
      "title": "Sony Bravia 55-inch 4K HDR Google Smart TV",
      "title_bn": "সনি ব্রাভিয়া ৫৫ ইঞ্চি ৪কে এইচডিআর গুগল স্মার্ট টিভি (গ্রুপ গিফট)",
      "category": "appliances",
      "price": 75000.0,
      "target_amount": 75000.0,
      "current_amount": 45000.0,
      "image_url": "https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=800&q=80",
      "merchant_url": "https://rangs.com.bd/sony-55-4k-google-tv",
      "merchant_name": "Rangs Electronics BD",
      "vendor_sku": "SNY-TV-55",
      "description": "নতুন ফ্ল্যাটের ড্রয়িং রুমের পারিবারিক বিনোদন ও সিনেমার অভিজ্ঞতার জন্য ক্রিস্টাল ক্লিয়ার ৪কে টিভি।",
      "is_group_gift": 1,
      "status": "partially_funded",
      "created_at": "2026-11-15T01:09:45.410074"
    },
    {
      "id": "gift-app-5",
      "title": "Xiaomi Dreame Robot Vacuum & Wet Mop Cleaner",
      "title_bn": "শাওমি ড্রিম স্মার্ট রোবট ভ্যাকুয়াম ও ওয়েট মপ ক্লিনার",
      "category": "appliances",
      "price": 31500.0,
      "target_amount": 31500.0,
      "current_amount": 0.0,
      "image_url": "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&w=800&q=80",
      "merchant_url": "https://pickaboo.com/product/dreame-d9-robot",
      "merchant_name": "Pickaboo BD",
      "vendor_sku": "XIA-ROB-01",
      "description": "স্মার্টফোন অ্যাপ নিয়ন্ত্রিত লেজার নেভিগেশন স্বয়ংক্রিয় ঘর মোছা ও ডাস্ট ক্লিনিং সিস্টেম।",
      "is_group_gift": 0,
      "status": "available",
      "created_at": "2026-11-15T01:09:45.410076"
    },
    {
      "id": "gift-mini-1",
      "title": "Aarong Handcrafted Pure Brass Panchapradeep & Mangal Bell Set",
      "title_bn": "আড়ং নকশী পিতলের পঞ্চপ্রদীপ ও মাঙ্গলিক ঘণ্টা সেট",
      "category": "mini",
      "price": 1450.0,
      "target_amount": 1450.0,
      "current_amount": 1450.0,
      "image_url": "https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?auto=format&fit=crop&w=800&q=80",
      "merchant_url": "https://www.aarong.com/home-decor/brass-bronze/pooja-thali",
      "merchant_name": "Aarong Living",
      "vendor_sku": "MIN-AAR-101",
      "description": "নতুন গৃহের ঠাকুরঘরের নিত্য পূজার্চনার জন্য খাঁটি পিতলের খোদাই করা পঞ্চপ্রদীপ ও মধুর ঘণ্টার শুভ উপহার।",
      "is_group_gift": 0,
      "status": "claimed",
      "created_at": "2026-11-15T01:09:45.410078"
    },
    {
      "id": "gift-mini-2",
      "title": "Heritage Brass Hand-Engraved Peacock Sindoor Kouto",
      "title_bn": "হেরিটেজ খাঁটি পিতলের ময়ূর খোদাই সিঁদুর কৌটো ও কঙ্কণ দানি",
      "category": "mini",
      "price": 1250.0,
      "target_amount": 1250.0,
      "current_amount": 1250.0,
      "image_url": "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&w=800&q=80",
      "merchant_url": "",
      "merchant_name": "Aarong Living",
      "vendor_sku": "MIN-SIN-102",
      "description": "সনাতনী নববধূর সিঁদুরদানের স্মৃতি ধরে রাখার জন্য হাতে নকশা করা পিতলের রাজকীয় সিঁদুর কৌটা।",
      "is_group_gift": 0,
      "status": "claimed",
      "created_at": "2026-11-15T01:09:45.410079"
    },
    {
      "id": "gift-mini-3",
      "title": "Monno Ceramic Mr & Mrs Gold Rim Coffee Mug Couple Set",
      "title_bn": "মুন্নু সিরামিক রয়্যাল গোল্ডেন হ্যান্ডেল কাপল কফি মাগ সেট (২ পিস)",
      "category": "mini",
      "price": 1250.0,
      "target_amount": 1250.0,
      "current_amount": 0.0,
      "image_url": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
      "merchant_url": "https://monno.com.bd/products/couple-mug-gold",
      "merchant_name": "Monno Ceramics BD",
      "vendor_sku": "MIN-MUG-103",
      "description": "নবদম্পতির সকালের চায়ের জন্য মার্বেল টেক্সচার ও ২৪ ক্যারেট গোল্ড হ্যান্ডেল সিরামিক কাপল সেট।",
      "is_group_gift": 0,
      "status": "available",
      "created_at": "2026-11-15T01:09:45.410081"
    },
    {
      "id": "gift-mini-4",
      "title": "Sandalwood & Jasmine Natural Aromatherapy Candle Gift Box",
      "title_bn": "চন্দন ও সুগন্ধি বেলি ফুলের অ্যারোমাথেরাপি মোমবাতি ও ডিফিউজার সেট",
      "category": "mini",
      "price": 1650.0,
      "target_amount": 1650.0,
      "current_amount": 0.0,
      "image_url": "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80",
      "merchant_url": "",
      "merchant_name": "Artisan Scents BD",
      "vendor_sku": "MIN-ARM-104",
      "description": "ঘরের স্নিগ্ধ ও পবিত্র পরিবেশের জন্য প্রাকৃতিক সয়া ওয়াক্স ও খাঁটি চন্দন সুবাসের উপহার বক্স।",
      "is_group_gift": 0,
      "status": "available",
      "created_at": "2026-11-15T01:09:45.410083"
    },
    {
      "id": "gift-mini-5",
      "title": "Traditional Shahi Kaju Katli & Premium Dry Fruits Hamper",
      "title_bn": "প্রিমিয়াম শাহী কাজু বরফি ও ড্রাই ফ্রুটস মাঙ্গলিক শুভেচ্ছা ডালা",
      "category": "mini",
      "price": 1850.0,
      "target_amount": 1850.0,
      "current_amount": 0.0,
      "image_url": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80",
      "merchant_url": "",
      "merchant_name": "Premium Sweets BD",
      "vendor_sku": "MIN-SWT-105",
      "description": "মাঙ্গলিক শুভকামনার জন্য খাঁটি জাফরানি কাজু বরফি, পেস্তা ও কাজুবাদাম দিয়ে সাজানো উপহার ডালা।",
      "is_group_gift": 0,
      "status": "available",
      "created_at": "2026-11-15T01:09:45.410085"
    },
    {
      "id": "gift-mini-6",
      "title": "Aarong Pure Cotton Nakshi Kantha Cushion Covers (Pair)",
      "title_bn": "আড়ং নকশী কাঁথা হাতের কাজের কুশন কভার জোড়া (মরুন ও আইভরি)",
      "category": "mini",
      "price": 1350.0,
      "target_amount": 1350.0,
      "current_amount": 1350.0,
      "image_url": "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80",
      "merchant_url": "https://www.aarong.com/home-decor/cushions",
      "merchant_name": "Aarong Lifestyle",
      "vendor_sku": "MIN-CSH-106",
      "description": "বাংলার ঐতিহ্যবাহী সূচিশিল্পে হাতে বোনা নিপুণ নকশী কাঁথার কুশন কভার সেট।",
      "is_group_gift": 0,
      "status": "claimed",
      "created_at": "2026-11-15T01:09:45.410087"
    },
    {
      "id": "gift-kit-1",
      "title": "Monno Ceramic Royal 52-Piece Luxury Bone China Dinner Set",
      "title_bn": "মুন্নু সিরামিক রয়্যাল ২৪কে গোল্ড রিম ৫২-পিস লাক্সারি বোন চায়না ডিনার সেট",
      "category": "kitchen",
      "price": 19800.0,
      "target_amount": 19800.0,
      "current_amount": 0.0,
      "image_url": "https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?auto=format&fit=crop&w=800&q=80",
      "merchant_url": "https://monno.com.bd/product/royal-gold-52-bonechina",
      "merchant_name": "Monno Ceramics BD",
      "vendor_sku": "MON-DIN-52",
      "description": "২৪ ক্যারেট স্বর্ণের সূক্ষ্ম ফিনিশিংযুক্ত প্রিমিয়াম বোন চায়না ডিনার সেট। নতুন সংসারে আভিজাত্যপূর্ণ আপ্যায়ন।",
      "is_group_gift": 0,
      "status": "available",
      "created_at": "2026-11-15T01:09:45.410088"
    },
    {
      "id": "gift-kit-2",
      "title": "Philips Essential RapidAir Digital Air Fryer & Blender Combo",
      "title_bn": "ফিলিপস এসেনশিয়াল ডিজিটাল এয়ার ফ্রায়ার ও মাল্টি-ব্লেন্ডার কম্বো",
      "category": "kitchen",
      "price": 15500.0,
      "target_amount": 15500.0,
      "current_amount": 0.0,
      "image_url": "https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80",
      "merchant_url": "https://transcomdigital.com/philips-airfryer-combo",
      "merchant_name": "Transcom Digital",
      "vendor_sku": "PHI-KIT-02",
      "description": "তেলমুক্ত স্বাস্থ্যকর রান্না ও সুস্বাদু পদ তৈরির জন্য ডিজিটাল এয়ার ফ্রায়ার ও ব্লেন্ডার সেট।",
      "is_group_gift": 0,
      "status": "available",
      "created_at": "2026-11-15T01:09:45.410090"
    },
    {
      "id": "gift-exp-1",
      "title": "Honeymoon Retreat: Coxs Bazar & Sajek Valley",
      "title_bn": "মধুচন্দ্রিমা সফর তহবিল: কক্সবাজার ও সাজেক ভ্যালি (গ্রুপ গিফট)",
      "category": "experience",
      "price": 40000.0,
      "target_amount": 40000.0,
      "current_amount": 25000.0,
      "image_url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
      "merchant_url": "",
      "merchant_name": "Honeymoon Fund",
      "vendor_sku": "HNY-RET-01",
      "description": "পাহাড় ও সমুদ্রের সান্নিধ্যে নবদম্পতির প্রথম স্মরণীয় মধুচন্দ্রিমা অবকাশ।",
      "is_group_gift": 1,
      "status": "partially_funded",
      "created_at": "2026-11-15T01:09:45.410092"
    },
    {
      "id": "gift-exp-2",
      "title": "Sweet Home Setup & Living Room Furniture Fund",
      "title_bn": "নবদম্পতির নতুন সংসার সামগ্রী ও ফার্নিচার তহবিল (গ্রুপ গিফট)",
      "category": "experience",
      "price": 35000.0,
      "target_amount": 35000.0,
      "current_amount": 35000.0,
      "image_url": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
      "merchant_url": "",
      "merchant_name": "Home Setup Fund",
      "vendor_sku": "HOM-SET-01",
      "description": "নবদম্পতির নতুন বাসার আরামদায়ক ড্রয়িং ও লিভিং রুম সাজানোর জন্য উপহার তহবিল।",
      "is_group_gift": 1,
      "status": "claimed",
      "created_at": "2026-11-15T01:09:45.410094"
    }
  ],
  "gallery": [
    {
      "id": "gal-1",
      "image_url": "uploads/arindam_arpita_sitting.jpg",
      "caption": "অরিন্দম ও অর্পিতা — মধুর যুগল মুহূর্ত",
      "order_idx": 1,
      "created_at": "2026-11-15T00:40:56"
    },
    {
      "id": "gal-2",
      "image_url": "uploads/arindam_arpita_standing.jpg",
      "caption": "শুভ পরিণয় ও বৌভাত প্রীতিভোজ — অরিন্দম ও অর্পিতা",
      "order_idx": 2,
      "created_at": "2026-11-15T00:40:56"
    },
    {
      "id": "gal-3",
      "image_url": "uploads/groom_arindam.jpg",
      "caption": "অরিন্দম চক্রবর্ত্তী (বর)",
      "order_idx": 3,
      "created_at": "2026-11-15T00:40:56"
    },
    {
      "id": "gal-4",
      "image_url": "uploads/bride_arpita.jpg",
      "caption": "অর্পিতা গাঙ্গুলি (কনে)",
      "order_idx": 4,
      "created_at": "2026-11-15T00:40:56"
    }
  ],
  "guestbook": [
    {
      "id": "gb-1",
      "name": "চৌধুরী পরিবার (চট্টগ্রাম)",
      "relation": "পারিবারিক শুভাকাঙ্ক্ষী",
      "message": "অরিন্দম ও অর্পিতার সুন্দর ও আনন্দময় দাম্পত্য জীবনের জন্য সপরিবারে আন্তরিক শুভকামনা ও মাঙ্গলিক আশীর্বাদ!",
      "reaction": "🌸",
      "created_at": "2026-11-15T00:54:25"
    },
    {
      "id": "gb-2",
      "name": "প্রণব ও চিত্রা চক্রবর্ত্তী",
      "relation": "জেঠু ও জেঠিমা (চট্টগ্রাম)",
      "message": "পরমেশ্বর ভগবান শ্রীকৃষ্ণের কৃপায় অরিন্দম ও অর্পিতার আগামী দাম্পত্য জীবন সুখ, শান্তি ও অনাবিল ভালোবাসায় ভরে উঠুক। আমাদের সপরিবার আন্তরিক আশীর্বাদ রইল।",
      "reaction": "🪔",
      "created_at": "2026-11-15T00:49:22"
    },
    {
      "id": "gb-3",
      "name": "সুব্রত গাঙ্গুলি ও পরিবার",
      "relation": "কনেপক্ষ (ঢাকা)",
      "message": "শুভ বিবাহ ও বৌভাত প্রীতিভোজের আন্তরিক শুভকামনা অরিন্দম ও অর্পিতা! ইঞ্জিনিয়ার্স ইনস্টিটিউটের প্রীতিভোজে তোদের উজ্জ্বল উপস্থিতি দেখার অপেক্ষায় রইলাম।",
      "reaction": "💖",
      "created_at": "2026-11-15T00:49:22"
    },
    {
      "id": "gb-4",
      "name": "কাকলি গাঙ্গুলি",
      "relation": "কনেপক্ষ (ঢাকা)",
      "message": "অর্পিতা মা আমার, খুব সুখী হোস। অরিন্দম ও তোদের পবিত্র যুগল মিলন সদা প্রস্ফুটিত থাকুক। অনেক স্নেহ ও আশীর্বাদ রইল।",
      "reaction": "🌸",
      "created_at": "2026-11-15T00:49:22"
    }
  ]
};

function normalizeImagePath(url) {
  if (!url) return "";
  if (url.startsWith("/uploads/")) return url.substring(1);
  return url;
}

// Master Data Loader
async function loadData() {
  try {
    const [eventRes, giftsRes, contribRes, guestRes, statsRes, ordersRes, escrowRes, dbRes, galleryRes] = await Promise.all([
      fetch('/api/event').then(r => r.json()).catch(() => null),
      fetch('/api/gifts').then(r => r.json()).catch(() => null),
      fetch('/api/contributions').then(r => r.json()).catch(() => null),
      fetch('/api/guestbook').then(r => r.json()).catch(() => null),
      fetch('/api/stats').then(r => r.json()).catch(() => null),
      fetch('/api/vendor/orders').then(r => r.json()).catch(() => null),
      fetch('/api/escrow/overview').then(r => r.json()).catch(() => null),
      fetch('/api/db/stats').then(r => r.json()).catch(() => null),
      fetch('/api/gallery').then(r => r.json()).catch(() => null)
    ]);

    if (eventRes && eventRes.success) {
      state.event = eventRes.event;
      state.gifts = giftsRes?.success ? giftsRes.gifts : [];
      state.contributions = contribRes?.success ? contribRes.contributions : [];
      state.guestbook = guestRes?.success ? guestRes.guestbook : [];
      state.stats = statsRes?.success ? statsRes.stats : {};
      state.vendorOrders = ordersRes?.success ? ordersRes.orders : [];
      state.vendorSummary = ordersRes?.success ? ordersRes.summary : {};
      state.escrowSummary = escrowRes?.success ? escrowRes.escrow_summary : {};
      state.escrowItems = escrowRes?.success ? escrowRes.escrow_items : [];
      state.payoutRequests = escrowRes?.success ? escrowRes.payout_requests : [];
      state.dbStats = dbRes?.success ? dbRes.database : {};
      state.gallery = galleryRes?.success ? galleryRes.gallery : [];
      state.apiAvailable = true;
    } else {
      throw new Error('API offline');
    }
  } catch (e) {
    console.log('GitHub Pages / Static Hosting Mode Active');
    state.apiAvailable = false;
    const cachedEvent = localStorage.getItem('utsab_event');
    if (cachedEvent && (cachedEvent.includes('শ্রীমান') || cachedEvent.includes('আয়ুষ্মতী') || cachedEvent.includes('rituals'))) {
      localStorage.removeItem('utsab_event');
      localStorage.removeItem('utsab_gallery');
      state.event = defaultStaticState.event;
    } else {
      state.event = cachedEvent ? JSON.parse(cachedEvent) : defaultStaticState.event;
    }
    const cachedGifts = localStorage.getItem('utsab_gifts');
    state.gifts = cachedGifts ? JSON.parse(cachedGifts) : defaultStaticState.gifts;
    const cachedGallery = localStorage.getItem('utsab_gallery');
    if (cachedGallery && cachedGallery.includes('unsplash.com')) {
      localStorage.removeItem('utsab_gallery');
      state.gallery = defaultStaticState.gallery;
    } else {
      state.gallery = cachedGallery ? JSON.parse(cachedGallery) : defaultStaticState.gallery;
    }
    const cachedGuestbook = localStorage.getItem('utsab_guestbook');
    state.guestbook = cachedGuestbook ? JSON.parse(cachedGuestbook) : defaultStaticState.guestbook;
    state.stats = {
      total_gifts: state.gifts.length,
      claimed_gifts: state.gifts.filter(g => g.status === 'claimed').length,
      total_amount_raised: 83000,
      total_salami_raised: 15001,
      total_platform_commission: 0
    };
    state.escrowSummary = {
      total_reserved_funds: 83000,
      available_for_couple_withdrawal: 78850,
      held_for_vendor_delivery: 0,
      platform_commission_held: 0
    };
  }

  const savedWeddingTheme = localStorage.getItem('utsab_wedding_theme') || state.event?.theme_color || 'sindoor-gold';
  setWeddingTheme(savedWeddingTheme);
  const savedFont = localStorage.getItem('utsab_font_theme') || 'regal-tiro';
  setFontTheme(savedFont);
  startCountdown();
  renderAll();
  renderVendorCatalogModal();
}

function applyTheme(themeName) {
  setWeddingTheme(themeName);
}

function setFontTheme(fontTheme) {
  document.body.setAttribute('data-font', fontTheme);
  localStorage.setItem('utsab_font_theme', fontTheme);
  const select1 = document.getElementById('font-theme-select');
  if (select1) select1.value = fontTheme;
  const select2 = document.getElementById('admin-font-theme');
  if (select2) select2.value = fontTheme;
}

function setLanguage(lang) {
  state.currentLang = lang;
  document.getElementById('lang-btn-bn')?.classList.toggle('bg-amber-100', lang === 'bn');
  document.getElementById('lang-btn-bn')?.classList.toggle('text-amber-900', lang === 'bn');
  document.getElementById('lang-btn-en')?.classList.toggle('bg-amber-100', lang === 'en');
  document.getElementById('lang-btn-en')?.classList.toggle('text-amber-900', lang === 'en');
  renderAll();
}

function renderAll() {
  const steps = [
    renderHeroAndPhotos,
    renderStatsStrip,
    renderSectionOrganizerDisplay,
    renderGallery,
    renderGifts,
    renderSalamiPresets,
    renderGuestbook
  ];
  if (document.getElementById('section-admin')) {
    steps.push(renderAdminPanel, renderVendorOrdersLedger, renderEscrowDashboard, renderDatabaseStats);
  }
  for (const step of steps) {
    try {
      step();
    } catch (err) {
      console.warn('renderAll module notice:', step.name, err);
    }
  }
}

function startCountdown() {
  function update() {
    if (!state.event || !state.event.event_date) return;
    const targetDate = new Date(`${state.event.event_date}T19:00:00+06:00`).getTime();
    const now = new Date().getTime();
    const diff = targetDate - now;

    if (diff <= 0) {
      ['countdown-days', 'countdown-hours', 'countdown-mins', 'countdown-secs'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = state.currentLang === 'bn' ? '০০' : '00';
      });
      return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    const pad = (n) => String(n).padStart(2, '0');
    const daysEl = document.getElementById('countdown-days');
    const hoursEl = document.getElementById('countdown-hours');
    const minsEl = document.getElementById('countdown-mins');
    const secsEl = document.getElementById('countdown-secs');

    if (state.currentLang === 'bn') {
      if (daysEl) daysEl.innerText = toBanglaNumber(pad(d));
      if (hoursEl) hoursEl.innerText = toBanglaNumber(pad(h));
      if (minsEl) minsEl.innerText = toBanglaNumber(pad(m));
      if (secsEl) secsEl.innerText = toBanglaNumber(pad(s));
    } else {
      if (daysEl) daysEl.innerText = pad(d);
      if (hoursEl) hoursEl.innerText = pad(h);
      if (minsEl) minsEl.innerText = pad(m);
      if (secsEl) secsEl.innerText = pad(s);
    }
  }
  update();
  setInterval(update, 1000);
}

function renderHeroAndPhotos() {
  const ev = state.event;
  if (!ev) return;
  const isBn = state.currentLang === 'bn';

  const titleEl = document.getElementById('hero-title');
  if (titleEl) titleEl.innerText = isBn ? (ev.title_bn || ev.title_en) : ev.title_en;

  const groomEl = document.getElementById('hero-groom');
  if (groomEl) groomEl.innerText = isBn ? (ev.groom_bn || ev.groom_name) : ev.groom_name;

  const brideEl = document.getElementById('hero-bride');
  if (brideEl) brideEl.innerText = isBn ? (ev.bride_bn || ev.bride_name) : ev.bride_name;

  const welcomeEl = document.getElementById('hero-welcome-msg');
  if (welcomeEl) welcomeEl.innerText = ev.welcome_msg || '';

  const venueNameEl = document.getElementById('hero-venue-name');
  if (venueNameEl) venueNameEl.innerText = ev.venue_name || '';

  const venueAddrEl = document.getElementById('hero-venue-address');
  if (venueAddrEl) venueAddrEl.innerText = ev.venue_address || '';

  if (ev.groom_photo && document.getElementById('hero-groom-img')) {
    document.getElementById('hero-groom-img').src = normalizeImagePath(ev.groom_photo);
  }
  if (ev.bride_photo && document.getElementById('hero-bride-img')) {
    document.getElementById('hero-bride-img').src = normalizeImagePath(ev.bride_photo);
  }
  if (ev.couple_photo && document.getElementById('hero-couple-img')) {
    document.getElementById('hero-couple-img').src = normalizeImagePath(ev.couple_photo);
  }

  const storyTextEl = document.getElementById('story-text');
  if (storyTextEl) storyTextEl.innerText = ev.story || '';

  const storyVenueTitleEl = document.getElementById('story-venue-title');
  if (storyVenueTitleEl) storyVenueTitleEl.innerText = ev.venue_name || '';

  const storyVenueAddrEl = document.getElementById('story-venue-addr');
  if (storyVenueAddrEl) storyVenueAddrEl.innerText = ev.venue_address || '';
}

function renderStatsStrip() {
  const s = state.stats;
  const isBn = state.currentLang === 'bn';

  document.getElementById('stat-claimed-gifts').innerText = isBn ?
    `${toBanglaNumber(s.claimed_gifts || 0)} / ${toBanglaNumber(s.total_gifts || 0)}` :
    `${s.claimed_gifts || 0} / ${s.total_gifts || 0}`;

  document.getElementById('stat-total-raised').innerText = formatCurrency(s.total_amount_raised || 0);
  document.getElementById('stat-total-salami').innerText = formatCurrency(s.total_salami_raised || 0);
  // No commission tracked
}

// ==========================================
// ESCROW & FUND RESERVATION ENGINE
// ==========================================
function renderEscrowDashboard() {
  const s = state.escrowSummary || {};
  document.getElementById('escrow-total-reserved').innerText = formatCurrency(s.total_reserved_funds || 0);
  document.getElementById('escrow-available-withdrawal').innerText = formatCurrency(s.available_for_couple_withdrawal || 0);
  document.getElementById('escrow-vendor-held').innerText = formatCurrency(s.held_for_vendor_delivery || 0);
  // No commission held

  // Escrow Ledger Table
  const tbody = document.getElementById('admin-escrow-tbody');
  if (!tbody) return;

  if (state.escrowItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-6 text-center text-gray-400">কোনো সংরক্ষিত তহবিল রেকর্ড নেই</td></tr>`;
    return;
  }

  tbody.innerHTML = state.escrowItems.map(item => {
    const isReserved = item.escrow_status === 'reserved';
    const statusLabel = isReserved ?
      '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">🔒 এসক্রোতে সংরক্ষিত (Reserved)</span>' :
      item.escrow_status === 'released_host' ?
      '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">✅ বর-কনেকে রিলিজকৃত</span>' :
      '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">📦 ভেন্ডরে রিলিজকৃত</span>';

    return `
      <tr class="border-b border-gray-100 hover:bg-amber-50/50">
        <td class="py-3 px-3 font-mono font-bold text-gray-800 text-[11px]">${item.id}</td>
        <td class="py-3 px-3">
          <span class="font-bold text-gray-900 block text-xs">${item.item_name}</span>
          <span class="text-[10px] text-gray-400">${item.contributor_name} (${item.contributor_phone || ''})</span>
        </td>
        <td class="py-3 px-3 text-xs font-bold text-gray-900">${formatCurrency(item.total_amount)}</td>
        <td class="py-3 px-3 text-xs font-bold text-emerald-700">${formatCurrency(item.net_reserved)}</td>
        <td class="py-3 px-3 text-[11px] text-gray-600 font-bangla">
          ${item.release_condition === 'vendor_delivery_confirmed' ? 'ভেন্ডর ডেলিভারি কনফার্মেশন' :
            item.release_condition === 'group_gift_completion' ? '১০০% গ্রুপ গিফট পূর্ণ হলে' : 'সরাসরি বর-কনেকে প্রাপ্য'}
        </td>
        <td class="py-3 px-3">${statusLabel}</td>
        <td class="py-3 px-3 text-right">
          ${isReserved ? `
            <button onclick="releaseEscrowFunds('${item.id}', 'released_host')" class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm whitespace-nowrap">
              তহবিল রিলিজ করুন
            </button>
          ` : `
            <span class="text-xs text-gray-400 font-mono">Released</span>
          `}
        </td>
      </tr>
    `;
  }).join('');
}

async function releaseEscrowFunds(escrowId, target) {
  if (!confirm(`আপনি কি এই এসক্রো তহবিল (${escrowId}) রিলিজ করতে চান?`)) return;

  if (state.apiAvailable) {
    try {
      await fetch(`/api/escrow/${escrowId}/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target })
      });
    } catch (e) {}
  }

  const item = state.escrowItems.find(i => i.id === escrowId);
  if (item) {
    item.escrow_status = target;
    item.released_at = new Date().toISOString();
  }

  loadData();
  triggerConfetti();
  alert('তহবিল সফলভাবে এসক্রো থেকে রিলিজ করা হয়েছে!');
}

function openWithdrawModal() {
  const avail = state.escrowSummary?.available_for_couple_withdrawal || 0;
  document.getElementById('withdraw-avail-display').innerText = formatCurrency(avail);
  document.getElementById('withdraw-amount-input').max = avail;
  document.getElementById('withdraw-amount-input').value = avail;
  document.getElementById('withdraw-modal').classList.remove('hidden');
  document.getElementById('withdraw-modal').classList.add('flex');
}

function closeWithdrawModal() {
  document.getElementById('withdraw-modal').classList.add('hidden');
  document.getElementById('withdraw-modal').classList.remove('flex');
}

async function submitWithdrawalRequest(e) {
  e.preventDefault();
  const amount = parseFloat(document.getElementById('withdraw-amount-input').value) || 0;
  const method = document.getElementById('withdraw-method-select').value;
  const account = document.getElementById('withdraw-account-input').value.trim();

  if (amount <= 0 || !account) {
    alert('সঠিক টাকার পরিমাণ ও একাউন্ট নম্বর দিন');
    return;
  }

  if (state.apiAvailable) {
    try {
      const res = await fetch('/api/escrow/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, payout_method: method, payout_account: account })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
      }
    } catch (e) {
      alert(`উত্তোলন সফল! ৳ ${amount.toLocaleString()} টাকা ${method} একাউন্টে ট্রান্সফার করা হয়েছে।`);
    }
  } else {
    alert(`উত্তোলন সফল! ৳ ${amount.toLocaleString()} টাকা ${method} একাউন্টে ট্রান্সফার করা হয়েছে।`);
  }

  closeWithdrawModal();
  loadData();
  triggerConfetti();
  playAuspiciousChime();
}

// ==========================================
// DATABASE STORAGE & EXPORT MANAGEMENT
// ==========================================
function renderDatabaseStats() {
  const db = state.dbStats || {};
  document.getElementById('db-engine-display').innerText = db.engine || 'SQLite3 (Embedded ACID)';
  document.getElementById('db-size-display').innerText = db.file_size_formatted || '48.0 KB';
  document.getElementById('db-status-display').innerText = db.status || 'Active & ACID Synchronized';
  document.getElementById('db-filepath-display').innerText = db.filepath || 'utsab.db';

  if (db.tables) {
    const tableListHtml = Object.entries(db.tables).map(([tbl, count]) => `
      <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-mono font-medium">
        <strong>${tbl}</strong>: ${count}
      </span>
    `).join(' ');
    document.getElementById('db-tables-badges').innerHTML = tableListHtml;
  }
}

function downloadDatabaseSnapshot() {
  window.location.href = '/api/db/export';
}

function triggerDbRestoreInput() {
  document.getElementById('db-restore-file-input').click();
}

async function handleDatabaseRestoreFile(inputElement) {
  const file = inputElement.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const dump = JSON.parse(e.target.result);
      if (!confirm('সতর্কতা: বর্তমান ডেটাবেস এই স্ন্যাপশট দ্বারা সম্পূর্ণ প্রতিস্থাপিত হবে। এগিয়ে যাবেন?')) return;

      const res = await fetch('/api/db/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ database_dump: dump })
      });
      const data = await res.json();
      if (data.success) {
        alert('ডেটাবেস সফলভাবে রিস্টোর করা হয়েছে!');
        loadData();
      }
    } catch (err) {
      alert('অবৈধ ব্যাকআপ ফাইল। সঠিক JSON স্ন্যাপশট আপলোড করুন।');
    }
  };
  reader.readAsText(file);
}

async function saveCloudDbConfig(e) {
  e.preventDefault();
  const uri = document.getElementById('db-cloud-uri-input').value.trim();
  const provider = document.getElementById('db-cloud-provider-select').value;

  if (state.apiAvailable) {
    try {
      const res = await fetch('/api/db/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ external_uri: uri, cloud_provider: provider })
      });
      const data = await res.json();
      if (data.success) {
        alert('ক্লাউড ডেটাবেস স্টোরেজ কনফিগারেশন সংরক্ষিত হয়েছে!');
        loadData();
      }
    } catch (e) {}
  }
}

// ==========================================
// RENDER GALLERY, SECTIONS & GIFTS
// ==========================================
function renderGallery() {
  const container = document.getElementById('gallery-grid');
  if (!container) return;

  if (state.gallery.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center text-gray-400">
        <i class="fa-regular fa-images text-4xl mb-3 text-amber-600/40"></i>
        <p class="text-sm">এখনো কোনো ছবি যোগ করা হয়নি। প্রি-ওয়েডিং ও ভ্রমণের ছবি আপলোড করুন।</p>
      </div>
    `;
    return;
  }

  container.innerHTML = state.gallery.map(item => `
    <div onclick="openLightboxModal('${normalizeImagePath(item.image_url)}', '${item.caption || ''}')" class="gallery-card group relative h-48 sm:h-64 rounded-2xl overflow-hidden border border-amber-200/80 shadow-sm bg-gray-100 cursor-pointer active:scale-95 transition-transform">
      <img src="${normalizeImagePath(item.image_url)}" alt="${item.caption || 'Photo'}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">
      <div class="gallery-overlay absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 sm:transition-all sm:duration-300 flex flex-col justify-end p-3.5 text-white">
        <p class="text-xs font-bold font-bangla text-amber-200">${item.caption || 'আমাদের সুন্দর স্মৃতি'}</p>
        <span class="text-[10px] text-gray-300 mt-0.5 flex items-center gap-1"><i class="fa-solid fa-expand text-[9px]"></i> স্পর্শ করে বড় দেখুন</span>
      </div>
    </div>
  `).join('');
}

function renderSectionOrganizerDisplay() {
  const main = document.getElementById('sections-container');
  if (!main) return;

  const defaultOrder = ["hero", "invitation", "venue", "gifts", "salami", "gallery", "story", "guestbook"];
  const order = state.event?.section_order && state.event.section_order.length > 0 ? state.event.section_order : defaultOrder;
  const visibility = state.event?.section_visibility || {};

  order.forEach(sectionId => {
    const el = document.getElementById(`section-${sectionId}`);
    if (el) {
      main.appendChild(el);
      const isVisible = visibility[sectionId] !== false;
      el.classList.toggle('hidden', !isVisible);
    }
  });

  renderAdminOrganizerControls();
}

function renderAdminOrganizerControls() {
  const tbody = document.getElementById('admin-organizer-tbody');
  if (!tbody) return;

  const defaultOrder = ["hero", "invitation", "venue", "gifts", "salami", "gallery", "story", "guestbook"];
  const order = state.event?.section_order && state.event.section_order.length > 0 ? state.event.section_order : defaultOrder;
  const visibility = state.event?.section_visibility || {};

  const sectionNames = {
    hero: '👑 বর-কনে পরিচিতি ও লগ্ন কাউন্টডাউন ব্যানার (Hero Section)',
    invitation: '📜 মাঙ্গলিক নিমন্ত্রণ পত্র (Sacred Wedding Invitation)',
    rituals: '🪔 মাঙ্গলিক লগ্ন ও আচার অনুষ্ঠান (Rituals & Lagna Itinerary)',
    venue: '📍 অনুষ্ঠানস্থল ও গুগল ম্যাপ লোকেশন (Venue & Google Map)',
    gallery: '📸 স্মৃতি ও মধুর মুহূর্ত মালা (Photo Gallery)',
    gifts: '🎁 মাঙ্গলিক উপহার রেজিস্ট্রি ও উইশলিস্ট (Gifts Registry)',
    salami: '🧧 শুভ আশীর্বাদী ও প্রণামী খাম (Ashirbadi & Pronami Envelope)',
    story: '📖 আমাদের শুভ পরিণয় গাথা (Sacred Journey & Story)',
    guestbook: '✍️ শুভাশিষ ও মঙ্গলগাথা খাতা (Guestbook)'
  };

  tbody.innerHTML = order.map((sId, idx) => {
    const isVisible = visibility[sId] !== false;
    return `
      <tr class="border-b border-gray-100 hover:bg-amber-50/50">
        <td class="py-3 px-4 font-bold text-gray-500 text-xs">${idx + 1}</td>
        <td class="py-3 px-4 text-sm font-semibold text-gray-900">${sectionNames[sId] || sId}</td>
        <td class="py-3 px-4 text-center">
          <input type="checkbox" onchange="toggleSectionVisibility('${sId}', this.checked)" ${isVisible ? 'checked' : ''} class="w-4 h-4 text-amber-700 rounded border-gray-300">
        </td>
        <td class="py-3 px-4 text-right space-x-1">
          <button type="button" onclick="moveSectionOrder('${sId}', -1)" ${idx === 0 ? 'disabled class="opacity-30 p-1.5"' : 'class="p-1.5 text-gray-700 hover:text-amber-800"'} title="উপরে তুলুন">
            <i class="fa-solid fa-arrow-up"></i>
          </button>
          <button type="button" onclick="moveSectionOrder('${sId}', 1)" ${idx === order.length - 1 ? 'disabled class="opacity-30 p-1.5"' : 'class="p-1.5 text-gray-700 hover:text-amber-800"'} title="নিচে নামান">
            <i class="fa-solid fa-arrow-down"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function moveSectionOrder(sectionId, direction) {
  const defaultOrder = ["hero", "invitation", "rituals", "gifts", "salami", "gallery", "story", "guestbook"];
  const order = [...(state.event.section_order && state.event.section_order.length > 0 ? state.event.section_order : defaultOrder)];
  const idx = order.indexOf(sectionId);
  if (idx < 0) return;
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= order.length) return;

  const temp = order[idx];
  order[idx] = order[newIdx];
  order[newIdx] = temp;

  state.event.section_order = order;
  saveLayoutSettings();
}

function toggleSectionVisibility(sectionId, isVisible) {
  if (!state.event.section_visibility) state.event.section_visibility = {};
  state.event.section_visibility[sectionId] = isVisible;
  saveLayoutSettings();
}

async function saveLayoutSettings() {
  renderSectionOrganizerDisplay();
  if (state.apiAvailable) {
    try {
      await fetch('/api/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_order: state.event.section_order,
          section_visibility: state.event.section_visibility
        })
      });
    } catch (e) {}
  }
}

// ==========================================
// PHOTO UPLOAD
// ==========================================
async function handlePhotoUpload(inputElement, targetType) {
  const file = inputElement.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64Data = e.target.result;
    let finalUrl = base64Data;

    if (state.apiAvailable) {
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_data: base64Data, filename: file.name })
        });
        const d = await res.json();
        if (d.success && d.url) finalUrl = d.url;
      } catch (err) {}
    }

    if (targetType === 'groom') {
      state.event.groom_photo = finalUrl;
      document.getElementById('hero-groom-img').src = finalUrl;
      document.getElementById('admin-groom-img-preview').src = finalUrl;
    } else if (targetType === 'bride') {
      state.event.bride_photo = finalUrl;
      document.getElementById('hero-bride-img').src = finalUrl;
      document.getElementById('admin-bride-img-preview').src = finalUrl;
    } else if (targetType === 'couple') {
      state.event.couple_photo = finalUrl;
      document.getElementById('hero-couple-img').src = finalUrl;
      document.getElementById('admin-couple-img-preview').src = finalUrl;
    } else if (targetType === 'gallery') {
      const caption = prompt('ছবির ক্যাপশন লিখুন (যেমন: আমাদের প্রথম দেখা):') || 'আমাদের সুন্দর মুহূর্ত';
      const newGal = { id: `gal-${Date.now()}`, image_url: finalUrl, caption, order_idx: state.gallery.length + 1 };
      state.gallery.push(newGal);
      renderGallery();
      if (state.apiAvailable) {
        fetch('/api/gallery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newGal)
        }).catch(() => {});
      }
      alert('ছবিটি গ্যালারিতে সফলভাবে যুক্ত হয়েছে!');
    }

    if (['groom', 'bride', 'couple'].includes(targetType)) {
      saveLayoutSettings();
      alert('ছবি সফলভাবে আপডেট হয়েছে!');
    }
  };
  reader.readAsDataURL(file);
}

// ==========================================
// VENDOR 1-CLICK URL IMPORTER
// ==========================================
async function importVendorProductFromUrl(e) {
  e.preventDefault();
  const input = document.getElementById('vendor-url-input');
  const url = input.value.trim();
  if (!url) return;

  const btn = document.getElementById('vendor-import-btn');
  btn.disabled = true;
  btn.innerText = 'ইমপোর্ট হচ্ছে...';

  try {
    let product = null;
    if (state.apiAvailable) {
      const res = await fetch('/api/vendor/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (data.success) product = data.product;
    }

    if (!product) {
      product = parseVendorUrlClient(url);
    }

    document.getElementById('import-preview-box').classList.remove('hidden');
    document.getElementById('import-preview-img').src = product.image_url;
    document.getElementById('import-preview-title').innerText = product.title;
    document.getElementById('import-preview-vendor').innerText = product.merchant_name;
    document.getElementById('import-preview-price').innerText = formatCurrency(product.price);

    window._lastImportedProduct = product;
    btn.innerText = 'ইমপোর্ট সফল!';
  } catch (err) {
    alert('প্রোডাক্ট ইমপোর্ট করতে সমস্যা হয়েছে। অনুগ্রহ করে লিংকটি চেক করুন।');
    btn.innerText = '১-ক্লিকে ইমপোর্ট করুন';
  } finally {
    btn.disabled = false;
  }
}

function parseVendorUrlClient(url) {
  let vendor = 'Daraz BD';
  let title = 'Imported Bangladeshi Registry Item';
  let price = 12500;
  let category = 'appliances';
  let image = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80';

  if (url.includes('aarong.com')) {
    vendor = 'Aarong Lifestyle';
    title = 'Aarong Jamdani Handloom Silk Collection';
    price = 16800;
    category = 'luxury';
    image = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80';
  } else if (url.includes('walton')) {
    vendor = 'Walton Plaza BD';
    title = 'Walton Inverter Smart Home Unit';
    price = 54000;
    category = 'appliances';
    image = 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80';
  } else if (url.includes('transcom')) {
    vendor = 'Transcom Digital';
    title = 'Philips RapidAir Multi-Cooker Appliance';
    price = 15200;
    category = 'kitchen';
    image = 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80';
  }

  return {
    title,
    title_bn: title,
    merchant_name: vendor,
    merchant_url: url,
    category,
    price,
    image_url: image,
    description: `Directly connected from ${vendor} catalog. Funds reserved in escrow until fulfillment.`,
    is_group_gift: 0
  };
}

async function addImportedProductToRegistry() {
  const product = window._lastImportedProduct;
  if (!product) return;

  const isGroup = document.getElementById('import-allow-group').checked ? 1 : 0;
  product.is_group_gift = isGroup;

  if (state.apiAvailable) {
    try {
      const res = await fetch('/api/gifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      const data = await res.json();
      if (data.gift_id) product.id = data.gift_id;
    } catch (e) {}
  }

  if (!product.id) product.id = `gift-${Date.now()}`;
  product.target_amount = product.price;
  product.current_amount = 0;
  product.status = 'available';

  state.gifts.unshift(product);
  renderGifts();
  closeVendorConnectModal();
  triggerConfetti();
  alert(`${product.merchant_name} থেকে "${product.title}" সফলভাবে আপনার রেজিস্ট্রিতে যোগ হয়েছে!`);
}

function renderVendorCatalogModal() {
  const container = document.getElementById('vendor-catalog-grid');
  if (!container) return;

  container.innerHTML = vendorQuickCatalog.map((item, idx) => `
    <div class="p-3.5 rounded-2xl border border-gray-200 bg-white hover:border-amber-400 hover:shadow-md transition flex flex-col justify-between">
      <div class="h-32 rounded-xl overflow-hidden mb-2 relative">
        <img src="${normalizeImagePath(item.image_url)}" alt="${item.title}" class="w-full h-full object-cover">
        <span class="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded ${
          item.vendor.includes('Aarong') ? 'vendor-badge-aarong' :
          item.vendor.includes('Walton') ? 'vendor-badge-walton' :
          item.vendor.includes('Transcom') ? 'vendor-badge-transcom' :
          item.vendor.includes('Monno') ? 'vendor-badge-monno' : 'vendor-badge-daraz'
        }">${item.vendor}</span>
      </div>
      <div>
        <h5 class="text-xs font-bold text-gray-900 line-clamp-2">${item.title}</h5>
        <span class="text-sm font-bold text-amber-900 block mt-1">${formatCurrency(item.price)}</span>
      </div>
      <button onclick="addCatalogItem(${idx})" class="mt-2.5 w-full py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition">
        + ১-ক্লিকে রেজিস্ট্রিতে যোগ করুন
      </button>
    </div>
  `).join('');
}

function addCatalogItem(idx) {
  const item = { ...vendorQuickCatalog[idx] };
  window._lastImportedProduct = item;
  addImportedProductToRegistry();
}

function openVendorConnectModal() {
  document.getElementById('vendor-modal').classList.remove('hidden');
  document.getElementById('vendor-modal').classList.add('flex');
}

function closeVendorConnectModal() {
  document.getElementById('vendor-modal').classList.add('hidden');
  document.getElementById('vendor-modal').classList.remove('flex');
}

// ==========================================
// RENDER GIFTS WITH ESCROW BADGE
// ==========================================
function renderGifts() {
  const container = document.getElementById('gifts-grid');
  if (!container) return;

  const isBn = state.currentLang === 'bn';
  const query = state.searchQuery.toLowerCase().trim();

  const filtered = state.gifts.filter(g => {
    if (state.activeCategory !== 'all') {
      if (state.activeCategory === 'group') {
        if (!g.is_group_gift) return false;
      } else if (state.activeCategory === 'mini') {
        if (g.category !== 'mini' && g.price > 2000) return false;
      } else if (g.category !== state.activeCategory) {
        return false;
      }
    }
    if (query) {
      const matchEn = (g.title || '').toLowerCase().includes(query);
      const matchBn = (g.title_bn || '').toLowerCase().includes(query);
      const matchVendor = (g.merchant_name || '').toLowerCase().includes(query);
      const matchCat = (g.category || '').toLowerCase().includes(query);
      if (!matchEn && !matchBn && !matchVendor && !matchCat) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center text-gray-500">
        <i class="fa-solid fa-gift text-4xl mb-3 text-amber-600/40"></i>
        <p class="text-base font-medium">${isBn ? 'এই ক্যাটাগরিতে কোনো উপহার খুঁজে পাওয়া যায়নি' : 'No gifts found.'}</p>
        <button onclick="openVendorConnectModal()" class="mt-3 text-xs bg-amber-900 text-white px-4 py-2 rounded-xl font-bold">
          + ভেন্ডর শপ থেকে নতুন উপহার যোগ করুন
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(gift => {
    const isClaimed = gift.status === 'claimed';
    const isGroup = !!gift.is_group_gift;
    const current = gift.current_amount || 0;
    const target = gift.target_amount || gift.price;
    const percent = Math.min(100, Math.round((current / target) * 100));
    const remaining = Math.max(0, target - current);

    let badgeClass = 'vendor-badge-daraz';
    const vendorName = gift.merchant_name || 'Daraz BD';
    if (vendorName.includes('Aarong')) badgeClass = 'vendor-badge-aarong';
    else if (vendorName.includes('Walton')) badgeClass = 'vendor-badge-walton';
    else if (vendorName.includes('Transcom')) badgeClass = 'vendor-badge-transcom';
    else if (vendorName.includes('Monno')) badgeClass = 'vendor-badge-monno';
    else if (vendorName.includes('Pickaboo')) badgeClass = 'vendor-badge-pickaboo';

    return `
      <div class="group bg-white rounded-2xl border border-amber-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative">
        <div class="relative h-56 w-full overflow-hidden bg-gray-50">
          <img src="${gift.image_url}" alt="${gift.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">
          
          <div class="absolute top-3 left-3 flex flex-col gap-1.5">
            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-md ${badgeClass}">
              <i class="fa-solid fa-store"></i> ${vendorName}
            </span>
            ${isClaimed ? `
              <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                ✅ সম্পন্ন (Claimed)
              </span>
            ` : isGroup ? `
              <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                🤝 গ্রুপ গিফট (${percent}%)
              </span>
            ` : ''}
            ${(state.contributions || []).some(c => c.gift_id === gift.id && c.status === 'pending_verification') ? `
              <span class="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-amber-200 text-amber-950 border border-amber-400 flex items-center gap-1 shadow-sm">
                <i class="fa-solid fa-clock-rotate-left text-amber-800"></i> যাচাই প্রক্রিয়াধীন
              </span>
            ` : ''}
          </div>

          ${gift.merchant_url ? `
            <a href="${gift.merchant_url}" target="_blank" rel="noopener" class="absolute bottom-3 right-3 text-[10px] font-bold bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg text-gray-700 hover:text-amber-900 border border-gray-200 shadow flex items-center gap-1" title="ভেন্ডরের অফিশিয়াল পেজ দেখুন">
              <i class="fa-solid fa-arrow-up-right-from-square text-amber-700"></i> শপ লিংক
            </a>
          ` : ''}
        </div>

        <div class="p-5 flex-1 flex flex-col justify-between">
          <div>
            <div class="flex items-baseline justify-between gap-2 mb-1.5">
              <span class="text-xs font-bold uppercase tracking-wider text-amber-800">${gift.category}</span>
              <span class="text-lg font-bold text-gray-900 font-serif-wedding">${formatCurrency(gift.price)}</span>
            </div>
            <h3 class="text-sm font-bold text-gray-800 leading-snug mb-2 font-bangla group-hover:text-amber-900 transition-colors">
              ${isBn ? (gift.title_bn || gift.title) : gift.title}
            </h3>
            <p class="text-xs text-gray-500 line-clamp-2 leading-relaxed">
              ${gift.description || ''}
            </p>

            ${isGroup ? `
              <div class="mt-4 pt-3 border-t border-amber-100/60">
                <div class="flex justify-between text-xs text-gray-600 mb-1.5 font-medium">
                  <span>উত্তোলিত: <strong class="text-amber-900">${formatCurrency(current)}</strong></span>
                  <span>বাকি: <strong class="text-gray-900">${formatCurrency(remaining)}</strong></span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div class="h-2 rounded-full ${percent >= 100 ? 'bg-emerald-600' : 'bg-gradient-to-r from-amber-500 to-amber-700'}" style="width: ${percent}%"></div>
                </div>
              </div>
            ` : ''}
          </div>

          <div class="mt-5">
            ${isClaimed ? `
              <button disabled class="w-full py-2.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-400 cursor-not-allowed flex items-center justify-center gap-1.5">
                <i class="fa-solid fa-check"></i> সম্পূর্ণ উপহার দেওয়া হয়েছে
              </button>
            ` : `
              <button onclick="openPaymentModal('${gift.id}')" class="w-full py-2.5 rounded-xl text-xs font-bold text-white shadow-md hover:shadow-lg transition flex items-center justify-center gap-2" style="background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);">
                <i class="fa-solid fa-cart-shopping text-amber-300"></i>
                <span>${isGroup ? 'শেয়ার করে অংশ নিন (Chip In)' : 'সরাসরি অর্ডার ও উপহার দিন'}</span>
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function setCategory(cat) {
  state.activeCategory = cat;
  document.querySelectorAll('.cat-pill').forEach(btn => {
    const isTarget = btn.getAttribute('data-cat') === cat;
    btn.classList.toggle('bg-amber-900', isTarget);
    btn.classList.toggle('text-white', isTarget);
    btn.classList.toggle('bg-amber-50', !isTarget);
    btn.classList.toggle('text-amber-900', !isTarget);
  });
  renderGifts();
}

function onSearchChange(e) {
  state.searchQuery = e.target.value;
  renderGifts();
}

function renderSalamiPresets() {
  const container = document.getElementById('salami-preset-pills');
  if (!container) return;
  // Starting from 1001 and above, default is 2001
  const presets = [1001, 2001, 5001, 10001, 15001, 25001];
  container.innerHTML = presets.map((amt) => `
    <button type="button" onclick="selectSalamiPreset(${amt}, this)" class="preset-pill px-3 py-2 rounded-xl font-bold text-xs border-2 transition ${amt === 2001 ? 'border-amber-400 bg-amber-500/30 text-white font-extrabold shadow' : 'border-amber-300/40 bg-white/10 text-amber-100 hover:bg-white/20'}">
      ${formatCurrency(amt)}
    </button>
  `).join('');

  const input = document.getElementById('salami-custom-input');
  if (input && (!input.value || parseFloat(input.value) < 1001)) {
    input.value = 2001;
  }
}

function selectSalamiPreset(amt, btn) {
  const input = document.getElementById('salami-custom-input');
  if (input) input.value = amt;
  document.querySelectorAll('.preset-pill').forEach(b => {
    b.className = 'preset-pill px-3 py-2 rounded-xl font-bold text-xs border-2 transition border-amber-300/40 bg-white/10 text-amber-100 hover:bg-white/20';
  });
  if (btn) {
    btn.className = 'preset-pill px-3 py-2 rounded-xl font-bold text-xs border-2 transition border-amber-400 bg-amber-500/30 text-white font-extrabold shadow';
  }
}

function submitSalamiForm(e) {
  e.preventDefault();
  const input = document.getElementById('salami-custom-input');
  const amount = parseFloat(input.value) || 2001;
  const note = document.getElementById('salami-blessing-note')?.value || '';
  openPaymentModal('salami-fund', amount, note);
}

function renderVendorOrdersLedger() {
  const tbody = document.getElementById('admin-vendor-orders-tbody');
  if (!tbody) return;

  const summary = state.vendorSummary || {};
  const commTotal = document.getElementById('admin-comm-total');
  if (commTotal) commTotal.innerText = formatCurrency(summary.total_platform_commission || 0);
  const commGmv = document.getElementById('admin-comm-gmv');
  if (commGmv) commGmv.innerText = formatCurrency(summary.total_gmv || 0);
  const commPayouts = document.getElementById('admin-comm-payouts');
  if (commPayouts) commPayouts.innerText = formatCurrency(summary.total_vendor_payouts || 0);
  const commOrdersCount = document.getElementById('admin-comm-orders-count');
  if (commOrdersCount) commOrdersCount.innerText = `${summary.total_orders || 0} টি`;

  if (state.vendorOrders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="py-6 text-center text-gray-400">কোনো ভেন্ডর অর্ডার এখনো তৈরি হয়নি</td></tr>`;
    return;
  }

  tbody.innerHTML = state.vendorOrders.map(o => `
    <tr class="border-b border-gray-100 hover:bg-amber-50/50">
      <td class="py-3 px-3 font-mono font-bold text-gray-800 text-[11px]">${o.id}</td>
      <td class="py-3 px-3">
        <span class="font-bold text-gray-900 block text-xs">${o.product_title}</span>
        <span class="text-[10px] text-amber-800 font-semibold">${o.vendor_name}</span>
      </td>
      <td class="py-3 px-3">
        <span class="text-xs text-gray-800 block">${o.buyer_name}</span>
        <span class="text-[10px] text-gray-400">${o.buyer_phone || ''}</span>
      </td>
      <td class="py-3 px-3 text-xs font-bold text-gray-900">${formatCurrency(o.total_amount)}</td>
      <td class="py-3 px-3 text-xs font-bold text-emerald-700">${formatCurrency(o.platform_commission)} (${o.commission_rate}%)</td>
      <td class="py-3 px-3 text-xs font-mono text-gray-700">${formatCurrency(o.vendor_payout)}</td>
      <td class="py-3 px-3">
        <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
          o.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
          o.status === 'dispatched' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-900'
        }">${o.status.toUpperCase()}</span>
      </td>
      <td class="py-3 px-3 text-right">
        ${o.status === 'placed' ? `
          <button onclick="updateOrderStatus('${o.id}', 'dispatched')" class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-800 text-white hover:bg-amber-900">
            ভেন্ডরে পাঠান
          </button>
        ` : o.status === 'dispatched' ? `
          <button onclick="updateOrderStatus('${o.id}', 'delivered')" class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-700 text-white hover:bg-emerald-800">
            ডেলিভারি কনফার্ম
          </button>
        ` : `
          <span class="text-xs text-emerald-700 font-bold">✅ সম্পন্ন</span>
        `}
      </td>
    </tr>
  `).join('');
}

async function updateOrderStatus(orderId, newStatus) {
  const order = state.vendorOrders.find(o => o.id === orderId);
  if (order) order.status = newStatus;
  renderVendorOrdersLedger();

  if (state.apiAvailable) {
    fetch(`/api/vendor/orders/${orderId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    }).catch(() => {});
  }
}

function renderGuestbook() {
  const container = document.getElementById('guestbook-list');
  if (!container) return;

  if (state.guestbook.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center text-gray-400">
        <i class="fa-regular fa-comment-dots text-4xl mb-3 text-amber-600/40"></i>
        <p class="text-sm">প্রথম দোয়া ও শুভেচ্ছাটি আপনিই জানান!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = state.guestbook.map(msg => `
    <div class="bg-white rounded-2xl p-5 border border-amber-100 shadow-sm">
      <div class="flex items-center gap-3 mb-2.5">
        <div class="w-9 h-9 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-base">
          ${msg.reaction || '🌸'}
        </div>
        <div>
          <h4 class="font-bold text-gray-900 text-xs">${msg.name}</h4>
          <span class="text-[11px] text-amber-800 font-medium">${msg.relation || 'শুভাকাঙ্ক্ষী'}</span>
        </div>
      </div>
      <p class="text-gray-700 text-xs leading-relaxed font-bangla whitespace-pre-line">${msg.message}</p>
    </div>
  `).join('');
}

async function submitGuestbookForm(e) {
  e.preventDefault();
  const name = document.getElementById('gb-name').value.trim();
  const relation = document.getElementById('gb-relation').value.trim();
  const message = document.getElementById('gb-message').value.trim();
  const reaction = document.getElementById('gb-reaction').value;
  if (!message) return;

  const newEntry = { name: name || 'শুভাকাঙ্ক্ষী', relation: relation || 'অতিথি', message, reaction };
  if (state.apiAvailable) {
    fetch('/api/guestbook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEntry)
    }).catch(() => {});
  }

  state.guestbook.unshift({ id: `b-${Date.now()}`, ...newEntry, created_at: new Date().toISOString() });
  document.getElementById('gb-message').value = '';
  renderGuestbook();
  triggerConfetti();
  playAuspiciousChime();
  alert('আপনার দোয়া ও শুভেচ্ছা সফলভাবে যোগ হয়েছে!');
}

// ==========================================
// PAYMENT & ESCROW FLOW
// ==========================================
let currentPaymentGift = null;

// ==========================================
// PERSONAL ACCOUNT PAYMENT & VERIFICATION FLOW
// ==========================================
let currentPaymentGift = null;
let currentPaymentMethod = 'bkash';
let activeApprovalTab = 'pending';

function selectPaymentMethod(method) {
  currentPaymentMethod = method;

  // Update button active state
  document.querySelectorAll('.pay-method-btn').forEach(btn => {
    if (btn.getAttribute('data-method') === method) {
      btn.className = 'pay-method-btn active-method flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition shadow-sm ' +
        (method === 'bkash' ? 'border-pink-500 bg-pink-50 text-pink-900' :
         method === 'nagad' ? 'border-orange-500 bg-orange-50 text-orange-900' :
         method === 'rocket' ? 'border-purple-500 bg-purple-50 text-purple-900' :
         'border-emerald-600 bg-emerald-50 text-emerald-950') + ' font-bold text-xs';
    } else {
      btn.className = 'pay-method-btn flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition border-gray-200 bg-white hover:border-amber-300 text-gray-700 font-bold text-xs';
    }
  });

  // Toggle detail boxes
  ['bkash', 'nagad', 'rocket', 'bank'].forEach(m => {
    const el = document.getElementById('method-box-' + m);
    if (el) {
      if (m === method) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
  });
}

function copyToClipboard(text, btn) {
  const performCopy = () => {
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-check text-emerald-400"></i> কপি হয়েছে!';
      setTimeout(() => { btn.innerHTML = orig; }, 2000);
    }
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(performCopy).catch(() => {
      fallbackCopy(text);
      performCopy();
    });
  } else {
    fallbackCopy(text);
    performCopy();
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch (e) {}
  document.body.removeChild(ta);
}

function setPayAmountPreset(amount) {
  const input = document.getElementById('pay-amount-input');
  if (input) input.value = amount;

  document.querySelectorAll('.pay-preset-pill').forEach(btn => {
    if (btn.innerText.includes(amount.toLocaleString('en-IN')) || btn.innerText.includes(toBanglaNumber(amount.toLocaleString('en-IN')))) {
      btn.className = 'pay-preset-pill active-preset px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-800 text-white border border-amber-800 transition shadow-sm';
    } else {
      btn.className = 'pay-preset-pill px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition';
    }
  });
}

function autoGenerateSampleTrxId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let trx = '';
  for (let i = 0; i < 8; i++) {
    trx += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const input = document.getElementById('pay-trx-id');
  if (input) input.value = trx;
}

function openPaymentModal(giftId, defaultAmount = null, defaultBlessing = '') {
  const modal = document.getElementById('payment-modal');
  currentPaymentGift = giftId === 'salami-fund' ? null : state.gifts.find(g => g.id === giftId);

  const amountInput = document.getElementById('pay-amount-input');
  const titleDisplay = document.getElementById('pay-gift-title');
  const targetInfo = document.getElementById('pay-target-info');
  const blessingInput = document.getElementById('pay-blessing-note');
  const nameInput = document.getElementById('pay-guest-name');
  const phoneInput = document.getElementById('pay-guest-phone');
  const trxInput = document.getElementById('pay-trx-id');

  if (currentPaymentGift) {
    titleDisplay.innerText = state.currentLang === 'bn' ? (currentPaymentGift.title_bn || currentPaymentGift.title) : currentPaymentGift.title;
    const remaining = Math.max(0, (currentPaymentGift.target_amount || currentPaymentGift.price) - (currentPaymentGift.current_amount || 0));

    if (currentPaymentGift.is_group_gift) {
      amountInput.value = defaultAmount || 2001;
      targetInfo.innerText = `গ্রুপ গিফটের অবশিষ্ট: ${formatCurrency(remaining)} (যেকোনো পরিমাণ উপহার হিসেবে পাঠানো যাবে)`;
    } else {
      amountInput.value = defaultAmount || currentPaymentGift.price;
      targetInfo.innerText = `উপহারের লক্ষ্যমূল্য: ${formatCurrency(currentPaymentGift.price)} • ব্যক্তিগত একাউন্টে সেন্ড মানি করুন`;
    }
  } else {
    titleDisplay.innerText = '🧧 নবদম্পতির শুভ আশীর্বাদী ও সালামি তহবিল';
    amountInput.value = defaultAmount || 2001;
    targetInfo.innerText = 'অরিন্দম ও অর্পিতার ব্যক্তিগত একাউন্টে সরাসরি শুভাশিস ও আশীর্বাদী উপহার';
  }

  if (blessingInput && defaultBlessing) blessingInput.value = defaultBlessing;
  if (nameInput && !nameInput.value) nameInput.value = '';
  if (trxInput) trxInput.value = '';

  selectPaymentMethod('bkash');
  setPayAmountPreset(parseFloat(amountInput.value) || 2001);

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closePaymentModal() {
  const modal = document.getElementById('payment-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

async function handlePersonalPaymentSubmit(event) {
  event.preventDefault();

  const amountInput = document.getElementById('pay-amount-input');
  const nameInput = document.getElementById('pay-guest-name');
  const phoneInput = document.getElementById('pay-guest-phone');
  const trxInput = document.getElementById('pay-trx-id');
  const blessingInput = document.getElementById('pay-blessing-note');

  const amount = parseFloat(amountInput.value) || 2001;
  const name = nameInput.value.trim() || 'শুভাকাঙ্ক্ষী অতিথি';
  const phone = phoneInput.value.trim() || '০১৭xxxxxxxx';
  const trxId = trxInput.value.trim().toUpperCase() || ('TRX-' + Math.random().toString(36).substring(2, 8).toUpperCase());
  const blessing = blessingInput ? blessingInput.value.trim() : '';

  const methodNames = {
    bkash: 'bKash Personal',
    nagad: 'Nagad Personal',
    rocket: 'Rocket Personal',
    bank: 'BRAC Bank PLC Transfer'
  };
  const paymentMethod = methodNames[currentPaymentMethod] || 'Personal Mobile Wallet';

  const giftId = currentPaymentGift ? currentPaymentGift.id : 'salami-fund';
  const giftTitle = currentPaymentGift ? (currentPaymentGift.title_bn || currentPaymentGift.title) : 'নবদম্পতির শুভ আশীর্বাদী ও সালামি তহবিল';

  const contribRecord = {
    id: 'c-' + Math.random().toString(36).substring(2, 10),
    gift_id: giftId,
    gift_title: giftTitle,
    contributor_name: name,
    contributor_phone: phone,
    amount: amount,
    payment_method: paymentMethod,
    trx_id: trxId,
    blessing_msg: blessing,
    status: 'pending_verification',
    created_at: new Date().toISOString()
  };

  // Try API submission if backend is online
  if (state.apiAvailable) {
    try {
      const res = await fetch('/api/contribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contribRecord)
      });
      const data = await res.json();
      if (data.contribution_id) contribRecord.id = data.contribution_id;
    } catch (e) {
      console.warn('API contribute failed, stored locally:', e);
    }
  }

  // Add to local state contributions as pending_verification
  state.contributions.unshift(contribRecord);

  // Close payment modal
  closePaymentModal();

  // Open Receipt Modal in 'Verifying' state
  renderReceiptModal(contribRecord);

  // Update Host Pending Count Badges
  updatePendingBadges();

  // Play chime
  playAuspiciousChime();
}

function renderReceiptModal(record) {
  const modal = document.getElementById('receipt-modal');
  const card = document.getElementById('printable-blessing-card');
  const ev = state.event || defaultStaticState.event;

  card.innerHTML = `
    <div class="salami-envelope p-6 sm:p-7 text-white relative rounded-3xl shadow-2xl border border-amber-300/40">
      <div class="text-center mb-5">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-400 text-amber-950 uppercase mb-2 shadow-sm">
          <i class="fa-solid fa-clock-rotate-left"></i> উপহার গৃহীত • যাচাই প্রক্রিয়াধীন
        </span>
        <h2 class="text-xl font-bold font-serif-wedding text-amber-200">${ev.title_bn || ev.title_en}</h2>
        <p class="text-[11px] text-amber-100/70 mt-1">${ev.venue_name}</p>
      </div>

      <div class="bg-white/10 rounded-2xl p-4 sm:p-5 border border-amber-300/30 text-xs space-y-3 font-bangla">
        <div class="flex justify-between items-center pb-2 border-b border-amber-300/20">
          <span class="text-amber-200">বর্তমান স্ট্যাটাস:</span>
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-amber-950 flex items-center gap-1">
            <i class="fa-solid fa-hourglass-half"></i> যাচাই প্রক্রিয়াধীন (Verifying)
          </span>
        </div>

        <div class="flex justify-between">
          <span class="text-amber-200">উপহারদাতা:</span>
          <strong class="text-white">${record.contributor_name} (${record.contributor_phone})</strong>
        </div>

        <div class="flex justify-between">
          <span class="text-amber-200">নির্বাচিত উপহার:</span>
          <strong class="text-amber-300 text-right">${record.gift_title}</strong>
        </div>

        <div class="flex justify-between border-t border-amber-300/20 pt-2">
          <span class="text-amber-200">পেমেন্ট মাধ্যম:</span>
          <span class="font-semibold text-white">${record.payment_method}</span>
        </div>

        <div class="flex justify-between items-center">
          <span class="text-amber-200">লেনদেন TrxID:</span>
          <span class="font-mono text-amber-300 font-bold bg-black/40 px-2 py-0.5 rounded border border-white/10 tracking-wider">${record.trx_id}</span>
        </div>

        <div class="flex justify-between items-center border-t border-amber-300/20 pt-2">
          <span class="text-amber-200 font-bold">প্রেরিত মোট অর্থ:</span>
          <span class="text-2xl font-bold text-amber-300 font-serif-wedding">${formatCurrency(record.amount)}</span>
        </div>

        <div class="p-3 rounded-xl bg-black/30 border border-amber-300/20 text-[11px] text-amber-100/90 leading-relaxed">
          <i class="fa-solid fa-circle-info text-amber-300 mr-1"></i>
          আপনার প্রেরিত TrxID এবং তথ্যের সত্যতা বর-কনে (অরিন্দম ও অর্পিতা) তাঁদের একাউন্ট স্টেটমেন্ট মিলিয়ে যাচাই করছেন। অনুমোদন সম্পন্ন হলে এটি উপহার তালিকায় চূড়ান্তভাবে নিশ্চিত হবে।
        </div>

        ${record.blessing_msg ? `
          <div class="pt-2 border-t border-amber-300/20 text-[11px] italic text-amber-100">
            "${record.blessing_msg}"
          </div>
        ` : ''}
      </div>

      <div class="mt-4 pt-3 border-t border-amber-300/30 text-[10px] text-amber-200/70 flex justify-between items-center">
        <span>তারিখ: ${new Date().toLocaleDateString('bn-BD')}</span>
        <span>রেফারেন্স: ${record.id}</span>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeReceiptModal() {
  const modal = document.getElementById('receipt-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

// ==========================================
// HOST APPROVAL & VERIFICATION DASHBOARD
// ==========================================
function updatePendingBadges() {
  const pendingCount = (state.contributions || []).filter(c => c.status === 'pending_verification').length;
  const hBadge = document.getElementById('host-pending-badge');
  const mBadge = document.getElementById('mobile-pending-badge');

  [hBadge, mBadge].forEach(b => {
    if (b) {
      b.innerText = toBanglaNumber(pendingCount);
      if (pendingCount > 0) {
        b.classList.remove('hidden');
      } else {
        b.classList.add('hidden');
      }
    }
  });

  const appPendCount = document.getElementById('approval-pending-count');
  if (appPendCount) appPendCount.innerText = toBanglaNumber(pendingCount);

  const verifiedCount = (state.contributions || []).filter(c => c.status === 'verified').length;
  const appVerCount = document.getElementById('approval-verified-count');
  if (appVerCount) appVerCount.innerText = toBanglaNumber(verifiedCount);
}

function openHostApprovalModal() {
  const modal = document.getElementById('host-approval-modal');
  if (!modal) return;
  activeApprovalTab = 'pending';
  switchApprovalTab('pending');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeHostApprovalModal() {
  const modal = document.getElementById('host-approval-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function switchApprovalTab(tab) {
  activeApprovalTab = tab;
  const btnP = document.getElementById('tab-approval-pending');
  const btnV = document.getElementById('tab-approval-verified');

  if (tab === 'pending') {
    if (btnP) btnP.className = 'flex-1 py-2 px-3 rounded-xl border-2 transition border-amber-800 bg-amber-800 text-white shadow-sm flex items-center justify-center gap-1.5';
    if (btnV) btnV.className = 'flex-1 py-2 px-3 rounded-xl border-2 transition border-gray-200 bg-white hover:bg-amber-50 text-gray-700 flex items-center justify-center gap-1.5';
  } else {
    if (btnP) btnP.className = 'flex-1 py-2 px-3 rounded-xl border-2 transition border-gray-200 bg-white hover:bg-amber-50 text-gray-700 flex items-center justify-center gap-1.5';
    if (btnV) btnV.className = 'flex-1 py-2 px-3 rounded-xl border-2 transition border-emerald-700 bg-emerald-700 text-white shadow-sm flex items-center justify-center gap-1.5';
  }

  renderApprovalCards();
}

function renderApprovalCards() {
  const container = document.getElementById('approval-cards-container');
  if (!container) return;

  updatePendingBadges();

  const list = (state.contributions || []).filter(c => activeApprovalTab === 'pending' ? c.status === 'pending_verification' : c.status === 'verified');

  if (list.length === 0) {
    container.innerHTML = `
      <div class="py-12 text-center text-gray-400 space-y-2">
        <i class="fa-solid fa-inbox text-4xl text-amber-200 block mb-2"></i>
        <p class="font-bold text-gray-600 text-sm">${activeApprovalTab === 'pending' ? 'আপাতত কোনো অপেক্ষমাণ যাচাই নেই' : 'কোনো অনুমোদিত উপহার পাওয়া যায়নি'}</p>
        <p class="text-xs text-gray-400">${activeApprovalTab === 'pending' ? 'অতিথিরা উপহার পাঠালে TrxID এখানে ভেরিফিকেশনের জন্য প্রদর্শিত হবে।' : ''}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(c => `
    <div class="p-4 rounded-2xl border ${c.status === 'pending_verification' ? 'bg-amber-50/60 border-amber-200' : 'bg-emerald-50/60 border-emerald-200'} space-y-2.5 shadow-sm transition">
      <div class="flex items-start justify-between gap-2">
        <div>
          <div class="flex items-center gap-2">
            <h4 class="font-bold text-gray-900 text-sm">${c.contributor_name}</h4>
            <span class="text-[10px] font-semibold text-gray-500">${c.contributor_phone || ''}</span>
          </div>
          <p class="text-xs text-amber-900 font-semibold mt-0.5">${c.gift_title || 'শুভ আশীর্বাদী'}</p>
        </div>
        <div class="text-right">
          <span class="text-base font-bold font-serif-wedding text-amber-900 block">${formatCurrency(c.amount)}</span>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${c.status === 'pending_verification' ? 'bg-amber-200 text-amber-900' : 'bg-emerald-200 text-emerald-900'}">
            ${c.status === 'pending_verification' ? '⏳ যাচাই অপেক্ষমাণ' : '✅ অনুমোদিত'}
          </span>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 border-t border-gray-200/60">
        <div class="flex items-center gap-2">
          <span class="text-gray-500 text-[11px]">${c.payment_method}</span>
          <span class="font-mono font-bold bg-white px-2 py-0.5 rounded border border-gray-300 text-amber-900 text-xs">TrxID: ${c.trx_id}</span>
        </div>
        <span class="text-[10px] text-gray-400">${new Date(c.created_at).toLocaleString('bn-BD')}</span>
      </div>

      ${c.blessing_msg ? `
        <p class="text-xs italic text-gray-600 bg-white/70 p-2.5 rounded-xl border border-gray-100">
          "${c.blessing_msg}"
        </p>
      ` : ''}

      ${c.status === 'pending_verification' ? `
        <div class="flex items-center gap-2 pt-2 border-t border-amber-200">
          <button onclick="approveContribution('${c.id}')" class="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition flex items-center justify-center gap-1.5">
            <i class="fa-solid fa-check"></i> অনুমোদন করুন (Approve)
          </button>
          <button onclick="rejectContribution('${c.id}')" class="px-3 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs transition">
            বাতিল
          </button>
        </div>
      ` : ''}
    </div>
  `).join('');
}

async function approveContribution(contribId) {
  const item = state.contributions.find(c => c.id === contribId);
  if (!item) return;

  if (state.apiAvailable) {
    try {
      await fetch('/api/contributions/' + contribId + '/approve', { method: 'POST' });
    } catch (e) {
      console.warn('API approve failed, using local update:', e);
    }
  }

  // Update contribution status
  item.status = 'verified';

  // Update associated gift
  if (item.gift_id && item.gift_id !== 'salami-fund') {
    const gift = state.gifts.find(g => g.id === item.gift_id);
    if (gift) {
      gift.current_amount = (gift.current_amount || 0) + item.amount;
      const target = gift.target_amount || gift.price;
      if (gift.current_amount >= target) {
        gift.status = 'claimed';
      }
    }
  }

  // Add blessing message to guestbook if present
  if (item.blessing_msg) {
    const already = state.guestbook.some(g => g.name === item.contributor_name && g.message === item.blessing_msg);
    if (!already) {
      state.guestbook.unshift({
        id: 'gb-' + item.id,
        name: item.contributor_name,
        relation: 'শুভানুধ্যায়ী',
        message: item.blessing_msg,
        reaction: '🌸',
        created_at: new Date().toISOString()
      });
    }
  }

  // Play audio chime and trigger confetti!
  playAuspiciousChime();
  triggerConfetti();

  // Re-render components
  renderGifts();
  renderStatsStrip();
  renderGuestbook();
  renderApprovalCards();
  updatePendingBadges();
}

async function rejectContribution(contribId) {
  if (!confirm('আপনি কি এই উপহারের তথ্যটি বাতিল করতে চান?')) return;

  const item = state.contributions.find(c => c.id === contribId);
  if (!item) return;

  if (state.apiAvailable) {
    try {
      await fetch('/api/contributions/' + contribId + '/reject', { method: 'POST' });
    } catch (e) {}
  }

  item.status = 'rejected';
  renderApprovalCards();
  updatePendingBadges();
}

function printReceipt() {
  window.print();
}

function switchTab(tabId) {
  state.activeTab = tabId;
  const allTabs = ['gifts', 'invitation', 'venue', 'gallery', 'salami', 'story', 'guestbook'];

  if (tabId === 'admin') {
    document.getElementById('sections-container')?.classList.add('hidden');
    document.getElementById('section-admin')?.classList.remove('hidden');
    window.scrollTo({ top: 120, behavior: 'smooth' });
  } else {
    document.getElementById('sections-container')?.classList.remove('hidden');
    document.getElementById('section-admin')?.classList.add('hidden');

    const target = document.getElementById(`section-${tabId}`);
    if (target) {
      target.classList.remove('hidden');
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  allTabs.forEach(s => {
    const nav = document.getElementById(`nav-${s}`);
    if (nav) {
      nav.classList.toggle('border-b-2', s === tabId);
      nav.classList.toggle('border-amber-700', s === tabId);
      nav.classList.toggle('font-bold', s === tabId);
      nav.classList.toggle('text-amber-900', s === tabId);
    }
  });
}

// ==========================================
// HINDU WEDDING AUDIO: CLASSICAL BANSURI & SITAR AMBIENCE
// Serene Indian Classical Acoustic Wedding Raga
// ==========================================
let hinduAudioCtx = null;
let hinduAudioPlaying = false;
let hinduAudioNodes = [];

function toggleHinduWeddingAudio() {
  const btn = document.getElementById('audio-toggle-btn');
  const txt = document.getElementById('audio-toggle-text');

  if (hinduAudioPlaying) {
    hinduAudioNodes.forEach(node => {
      try { node.stop(); node.disconnect(); } catch (e) {}
    });
    hinduAudioNodes = [];
    hinduAudioPlaying = false;
    if (btn) btn.classList.remove('audio-playing-pulse', 'border-amber-400', 'bg-amber-600/40');
    if (txt) txt.innerText = 'মাঙ্গলিক বাঁশি ও সেতারের সুর';
    return;
  }

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!hinduAudioCtx) hinduAudioCtx = new AudioContext();
    if (hinduAudioCtx.state === 'suspended') hinduAudioCtx.resume();

    const now = hinduAudioCtx.currentTime;
    const masterGain = hinduAudioCtx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.exponentialRampToValueAtTime(0.22, now + 1.5);
    masterGain.connect(hinduAudioCtx.destination);

    // 1. Serene Tanpura Acoustic Drone (Sa - Pa - Sa fundamental resonance: 138.59Hz, 207.65Hz, 277.18Hz)
    [138.59, 207.65, 277.18].forEach((freq, idx) => {
      const osc = hinduAudioCtx.createOscillator();
      const gain = hinduAudioCtx.createGain();
      osc.type = idx === 1 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime((idx - 1) * 4, now);
      
      const lfo = hinduAudioCtx.createOscillator();
      const lfoGain = hinduAudioCtx.createGain();
      lfo.frequency.setValueAtTime(0.2 + idx * 0.1, now);
      lfoGain.gain.setValueAtTime(0.015, now);
      lfo.connect(gain.gain);
      lfo.start(now);
      hinduAudioNodes.push(lfo);

      gain.gain.setValueAtTime(0.06 / (idx + 1), now);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      hinduAudioNodes.push(osc);
    });

    // 2. Bansuri (Acoustic Bamboo Flute) - Raag Yaman / Bhairavi Kalyan Motif
    const ragaScale = [
      { f: 277.18, dur: 1.4 },  // Sa
      { f: 311.13, dur: 1.0 },  // Re
      { f: 349.23, dur: 1.6 },  // Ga
      { f: 415.30, dur: 1.2 },  // Pa
      { f: 466.16, dur: 1.0 },  // Dha
      { f: 554.37, dur: 2.2 },  // High Sa'
      { f: 466.16, dur: 1.0 },  // Dha
      { f: 415.30, dur: 1.4 },  // Pa
      { f: 349.23, dur: 1.8 },  // Ga
      { f: 311.13, dur: 1.2 },  // Re
      { f: 277.18, dur: 2.8 }   // Restful Sa
    ];

    function playFluteNote(freq, startTime, duration) {
      if (!hinduAudioPlaying && hinduAudioNodes.length === 0) return;
      const osc = hinduAudioCtx.createOscillator();
      const oscHarmonic = hinduAudioCtx.createOscillator();
      const noteGain = hinduAudioCtx.createGain();
      const filter = hinduAudioCtx.createBiquadFilter();

      osc.type = 'sine';
      oscHarmonic.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      oscHarmonic.frequency.setValueAtTime(freq * 2, startTime);

      osc.frequency.exponentialRampToValueAtTime(freq * 1.008, startTime + duration * 0.5);
      oscHarmonic.frequency.exponentialRampToValueAtTime(freq * 2.008, startTime + duration * 0.5);

      const vibrato = hinduAudioCtx.createOscillator();
      const vibratoGain = hinduAudioCtx.createGain();
      vibrato.frequency.setValueAtTime(5.2, startTime);
      vibratoGain.gain.setValueAtTime(2.5, startTime);
      vibrato.connect(osc.frequency);
      vibrato.start(startTime + 0.3);
      vibrato.stop(startTime + duration);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, startTime);

      noteGain.gain.setValueAtTime(0.001, startTime);
      noteGain.gain.linearRampToValueAtTime(0.14, startTime + 0.18);
      noteGain.gain.setValueAtTime(0.12, startTime + duration - 0.2);
      noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(filter);
      oscHarmonic.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start(startTime);
      oscHarmonic.start(startTime);
      osc.stop(startTime + duration + 0.05);
      oscHarmonic.stop(startTime + duration + 0.05);
      hinduAudioNodes.push(osc, oscHarmonic, vibrato);
    }

    function playSitarPluck(freq, startTime) {
      if (!hinduAudioPlaying && hinduAudioNodes.length === 0) return;
      const sitarOsc = hinduAudioCtx.createOscillator();
      const sitarGain = hinduAudioCtx.createGain();
      sitarOsc.type = 'sawtooth';
      sitarOsc.frequency.setValueAtTime(freq, startTime);
      sitarOsc.frequency.exponentialRampToValueAtTime(freq * 1.02, startTime + 0.1);

      const sitarFilter = hinduAudioCtx.createBiquadFilter();
      sitarFilter.type = 'bandpass';
      sitarFilter.frequency.setValueAtTime(2200, startTime);
      sitarFilter.Q.setValueAtTime(6, startTime);

      sitarGain.gain.setValueAtTime(0.001, startTime);
      sitarGain.gain.linearRampToValueAtTime(0.08, startTime + 0.02);
      sitarGain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.4);

      sitarOsc.connect(sitarFilter);
      sitarFilter.connect(sitarGain);
      sitarGain.connect(masterGain);

      sitarOsc.start(startTime);
      sitarOsc.stop(startTime + 1.5);
      hinduAudioNodes.push(sitarOsc);
    }

    function playTempleChime(startTime) {
      if (!hinduAudioPlaying && hinduAudioNodes.length === 0) return;
      const chimeOsc = hinduAudioCtx.createOscillator();
      const chimeGain = hinduAudioCtx.createGain();
      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(2093.00, startTime);

      chimeGain.gain.setValueAtTime(0.001, startTime);
      chimeGain.gain.linearRampToValueAtTime(0.04, startTime + 0.01);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 2.0);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(masterGain);
      chimeOsc.start(startTime);
      chimeOsc.stop(startTime + 2.1);
      hinduAudioNodes.push(chimeOsc);
    }

    let currentT = now + 0.8;
    for (let loop = 0; loop < 12; loop++) {
      playTempleChime(currentT);
      playSitarPluck(277.18, currentT);
      
      ragaScale.forEach((note, idx) => {
        playFluteNote(note.f, currentT, note.dur);
        if (idx === 2 || idx === 5 || idx === 8) {
          playSitarPluck(note.f, currentT + 0.1);
        }
        currentT += note.dur + 0.15;
      });
      currentT += 1.0;
    }

    hinduAudioPlaying = true;
    if (btn) btn.classList.add('audio-playing-pulse', 'border-amber-400', 'bg-amber-600/40');
    if (txt) txt.innerText = '🎶 সুমধুর সুর বাজছে (থামাতে ক্লিক করুন)';
  } catch (err) {
    console.warn("Audio synthesizer notice:", err);
  }
}

function setWeddingTheme(themeName) {
  document.body.setAttribute('data-wedding-theme', themeName);
  localStorage.setItem('utsab_wedding_theme', themeName);
  const select = document.getElementById('wedding-theme-select');
  if (select) select.value = themeName;
}

function renderAdminPanel() {
  const ev = state.event;
  if (!ev) return;

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };

  setVal('admin-title-en', ev.title_en);
  setVal('admin-title-bn', ev.title_bn);
  setVal('admin-event-type', ev.event_type);
  setVal('admin-groom-en', ev.groom_name);
  setVal('admin-bride-en', ev.bride_name);
  setVal('admin-groom-bn', ev.groom_bn);
  setVal('admin-bride-bn', ev.bride_bn);
  setVal('admin-date', ev.event_date);
  setVal('admin-time', ev.event_time);
  setVal('admin-venue-name', ev.venue_name);
  setVal('admin-venue-addr', ev.venue_address);
  setVal('admin-welcome-msg', ev.welcome_msg);
  setVal('admin-story', ev.story);
  setVal('admin-theme', ev.theme_color || 'crimson-gold');
  setVal('admin-font-theme', localStorage.getItem('utsab_font_theme') || 'poppins-hind');
  setVal('admin-commission-rate', ev.commission_rate || 7.5);
  setVal('admin-delivery-addr', ev.delivery_address);
  setVal('admin-delivery-phone', ev.delivery_contact_phone);

  const groomPrev = document.getElementById('admin-groom-img-preview');
  if (groomPrev && ev.groom_photo) groomPrev.src = ev.groom_photo;
  const bridePrev = document.getElementById('admin-bride-img-preview');
  if (bridePrev && ev.bride_photo) bridePrev.src = ev.bride_photo;
  const couplePrev = document.getElementById('admin-couple-img-preview');
  if (couplePrev && ev.couple_photo) couplePrev.src = ev.couple_photo;

  setVal('admin-bkash', ev.bkash_number);
  setVal('admin-nagad', ev.nagad_number);
  setVal('admin-rocket', ev.rocket_number);
}

async function saveAdminEvent(e) {
  e.preventDefault();
  const getVal = (id) => document.getElementById(id).value;

  const updated = {
    title_en: getVal('admin-title-en'),
    title_bn: getVal('admin-title-bn'),
    event_type: getVal('admin-event-type'),
    groom_name: getVal('admin-groom-en'),
    bride_name: getVal('admin-bride-en'),
    groom_bn: getVal('admin-groom-bn'),
    bride_bn: getVal('admin-bride-bn'),
    event_date: getVal('admin-date'),
    event_time: getVal('admin-time'),
    venue_name: getVal('admin-venue-name'),
    venue_address: getVal('admin-venue-addr'),
    welcome_msg: getVal('admin-welcome-msg'),
    story: getVal('admin-story'),
    theme_color: getVal('admin-theme'),
    commission_rate: parseFloat(getVal('admin-commission-rate')) || 7.5,
    delivery_address: getVal('admin-delivery-addr'),
    delivery_contact_phone: getVal('admin-delivery-phone'),
    bkash_number: getVal('admin-bkash'),
    nagad_number: getVal('admin-nagad'),
    rocket_number: getVal('admin-rocket')
  };

  if (state.apiAvailable) {
    try {
      await fetch('/api/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (e) {}
  }

  state.event = { ...state.event, ...updated };
  applyTheme(state.event.theme_color);
  renderAll();
  alert('সকল পরিবর্তন সংরক্ষিত হয়েছে!');
}

async function resetToHinduThemePreset() {
  if (!confirm('আপনি কি সনাতন বিবাহ থিম এবং ডেমো উপহার ক্যাটালগ রিলোড করতে চান?')) return;
  try {
    const res = await fetch('/api/theme/seed-hindu', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    const json = await res.json();
    if (json.success) {
      alert('সনাতন শুভ বিবাহ থিম সফলভাবে সক্রিয় করা হয়েছে!');
      window.location.reload();
    }
  } catch (e) {
    window.location.reload();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadData();

  document.getElementById('gift-search-input')?.addEventListener('input', onSearchChange);
  document.getElementById('salami-direct-form')?.addEventListener('submit', submitSalamiForm);
  document.getElementById('guestbook-form')?.addEventListener('submit', submitGuestbookForm);
  document.getElementById('admin-event-form')?.addEventListener('submit', saveAdminEvent);
  document.getElementById('payment-confirm-form')?.addEventListener('submit', confirmPaymentSubmit);
  document.getElementById('vendor-url-form')?.addEventListener('submit', importVendorProductFromUrl);
  document.getElementById('withdraw-form')?.addEventListener('submit', submitWithdrawalRequest);
  document.getElementById('cloud-db-form')?.addEventListener('submit', saveCloudDbConfig);
});

// ==========================================
// MOBILE DRAWER & LIGHTBOX CONTROLS
// ==========================================
function toggleMobileMenu() {
  const drawer = document.getElementById('mobile-drawer');
  const backdrop = document.getElementById('mobile-drawer-backdrop');
  if (!drawer || !backdrop) return;
  const isClosed = drawer.classList.contains('translate-x-full');
  if (isClosed) {
    backdrop.classList.remove('hidden');
    setTimeout(() => backdrop.classList.remove('opacity-0'), 10);
    drawer.classList.remove('translate-x-full');
    document.body.style.overflow = 'hidden';
  } else {
    closeMobileMenu();
  }
}

function closeMobileMenu() {
  const drawer = document.getElementById('mobile-drawer');
  const backdrop = document.getElementById('mobile-drawer-backdrop');
  if (!drawer || !backdrop) return;
  drawer.classList.add('translate-x-full');
  backdrop.classList.add('opacity-0');
  setTimeout(() => backdrop.classList.add('hidden'), 300);
  document.body.style.overflow = '';
}

function openLightboxModal(src, caption) {
  const modal = document.getElementById('gallery-lightbox-modal');
  const img = document.getElementById('lightbox-img');
  const cap = document.getElementById('lightbox-caption');
  if (!modal || !img) return;
  img.src = src;
  if (cap) cap.innerText = caption || '';
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';
}

function closeLightboxModal() {
  const modal = document.getElementById('gallery-lightbox-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  document.body.style.overflow = '';
}
